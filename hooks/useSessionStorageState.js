import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";

// *****************************************************************************
const SESSION_STORAGE_CHANGE_EVENT = "bout2getcha:session-storage-state-change";

// *** [ subscription ]: Änderungen am session storage -> react-callback registrieren
function subscribeToSessionStorage(callback) {
  window.addEventListener(SESSION_STORAGE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener(SESSION_STORAGE_CHANGE_EVENT, callback);
  };
}

// *** [ change-event ]: nach Änderung session-storage-snapshot neu einlesen
function emitSessionStorageChange() {
  window.dispatchEvent(new Event(SESSION_STORAGE_CHANGE_EVENT));
}

// *** [ server-snapshot ]: null -> storage wird nicht aufgerufen
function getServerSessionStorageSnapshot() {
  return null;
}
// *****************************************************************************

function parseStoredValue(storedSnapshot, defaultValue) {
  if (storedSnapshot === null) {
    return { value: defaultValue, isInvalid: false };
  }

  try {
    return { value: JSON.parse(storedSnapshot), isInvalid: false };
  } catch {
    return { value: defaultValue, isInvalid: true };
  }
} // stored snapshot JSON-string -> gespeicherter Wert

// *****************************************************************************

export default function useSessionStorageState(storageKey, defaultValue) {
  // *** [ stored state ]: aus storage abrufen *************************
  const getSessionStorageSnapshot = useCallback(
    () =>
      typeof storageKey === "string"
        ? sessionStorage.getItem(storageKey)
        : null,
    [storageKey]
  ); // snapshot anhand storageKey aus storage lesen

  const storedSnapshot = useSyncExternalStore(
    subscribeToSessionStorage,
    getSessionStorageSnapshot,
    getServerSessionStorageSnapshot
  ); // snapshot als JSON-string

  const storedState = useMemo(
    () => parseStoredValue(storedSnapshot, defaultValue),
    [storedSnapshot, defaultValue]
  ); // JSON-string -> { value, isInvalid }

  // *** [ current state ]: stored state / default
  const state = storedState.value;

  // *** [ ungültiger snapshot ]: aus storage entfernen
  useEffect(() => {
    if (!storageKey || !storedState.isInvalid) return;

    sessionStorage.removeItem(storageKey);
    emitSessionStorageChange();
  }, [storageKey, storedState.isInvalid]);

  // *** [ state + session storage ]: neuen Wert übernehmen ************
  const setState = useCallback(
    (nextStateOrUpdater) => {
      if (typeof storageKey !== "string") return;

      const currentSnapshot = sessionStorage.getItem(storageKey);
      const currentState = parseStoredValue(
        currentSnapshot,
        defaultValue
      ).value;

      const nextState =
        typeof nextStateOrUpdater === "function"
          ? nextStateOrUpdater(currentState)
          : nextStateOrUpdater;

      if (Object.is(nextState, defaultValue)) {
        sessionStorage.removeItem(storageKey); // default: nicht speichern
      } else {
        sessionStorage.setItem(storageKey, JSON.stringify(nextState)); // nicht default: speichern
      }

      emitSessionStorageChange(); // veränderte snapshots neu einlesen
    },
    [storageKey, defaultValue]
  );

  return [state, setState];
}
