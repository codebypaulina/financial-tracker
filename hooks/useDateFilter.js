/********************************************************************************
  date-filter für:  pages/transactions/index.js  +  pages/categories/index.js 
  - active date-filter range
  - range-template für < >
  - date picker state
  - session storage: abrufen + speichern
  - handlers: open + close picker, apply + clear picker range, update date-filter
*********************************************************************************/

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  parseDateString,
  getDefaultRange,
  buildTemplateFromRange,
  parseStoredTemplate,
  buildDateFilterForStorage,
} from "@/utils/dateFilter";

// *** [ session storage ] *************************************************
// *** [ subscription ]: nicht nötig -> Änderungen über localDateFilterState
function subscribeToDateFilterSnapshot() {
  return () => {};
}

// *** [ server-snapshot ]: leer -> storage wird nicht aufgerufen
function getServerDateFilterSnapshot() {
  return null;
}
// *************************************************************************

export default function useDateFilter(storageKey) {
  // *** [ default ]
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const defaultTemplate = useMemo(
    () => buildTemplateFromRange(defaultRange.from, defaultRange.to),
    [defaultRange]
  );

  // *** [ STATES ]
  const [localDateFilterState, setLocalDateFilterState] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerRange, setPickerRange] = useState(defaultRange);
  const [pickerVisibleMonth, setPickerVisibleMonth] = useState(
    defaultRange.from
  );

  // *** [ SYNC ] ******************************************************************
  // *** [ stored date filter ]: aus session storage abrufen ***********************
  const getDateFilterSnapshot = useCallback(
    () =>
      typeof storageKey === "string"
        ? sessionStorage.getItem(storageKey)
        : null,
    [storageKey]
  ); // snapshot aus storage lesen anhand storageKey (`u:${userId}:transactions:dateFilter` / `u:${userId}:categories:dateFilter`)

  const storedDateFilterSnapshot = useSyncExternalStore(
    subscribeToDateFilterSnapshot,
    getDateFilterSnapshot,
    getServerDateFilterSnapshot
  ); // date-filter-snapshot als JSON-string

  const storedDateFilterState = useMemo(() => {
    const fallbackState = {
      range: defaultRange,
      template: defaultTemplate,
      isInvalid: false,
    };

    if (!storedDateFilterSnapshot) return fallbackState;

    try {
      const parsedDateFilter = JSON.parse(storedDateFilterSnapshot);
      const storedFrom = parseDateString(parsedDateFilter?.from);
      const storedTo = parseDateString(parsedDateFilter?.to);

      if (
        !storedFrom ||
        !storedTo ||
        storedFrom.getTime() > storedTo.getTime()
      ) {
        return { ...fallbackState, isInvalid: true };
      } // key mit ungültigem Wert: default

      return {
        range: { from: storedFrom, to: storedTo },
        template: parseStoredTemplate(parsedDateFilter, storedFrom, storedTo),
        isInvalid: false,
      }; // key vorhanden + gültig: range + template zurück
    } catch {
      return { ...fallbackState, isInvalid: true };
    }
  }, [storedDateFilterSnapshot, defaultRange, defaultTemplate]); // JSON-string -> filter-state mit Date-objects

  // *** [ active date filter ]: lokale Änderung / stored filter
  const activeDateFilterState =
    localDateFilterState?.storageKey === storageKey
      ? localDateFilterState
      : storedDateFilterState;

  const dateFilter = activeDateFilterState.range;
  const dateFilterTemplate = activeDateFilterState.template;

  // *** [ ungültiger snapshot ]: aus session storage entfernen
  useEffect(() => {
    if (!storageKey || !storedDateFilterState.isInvalid) return;

    sessionStorage.removeItem(storageKey);
  }, [storageKey, storedDateFilterState.isInvalid]);

  // *** [ HANDLERS ] **************************************************************
  // *** [ DateNav < > ] ***********************************************************
  function updateDateFilter(
    startDate,
    endDate,
    nextTemplate = dateFilterTemplate
  ) {
    const nextRange = {
      from: startDate,
      to: endDate,
    };

    // *** [ state ] ********************************************
    setLocalDateFilterState({
      storageKey,
      range: nextRange,
      template: nextTemplate,
    });

    // *** [ session storage ] **********************************
    if (!storageKey) return;

    const isDefaultRange =
      nextRange.from.getTime() === defaultRange.from.getTime() &&
      nextRange.to.getTime() === defaultRange.to.getTime();

    if (isDefaultRange) {
      sessionStorage.removeItem(storageKey);
      return;
    } // default range: nicht in storage speichern

    sessionStorage.setItem(
      storageKey,
      JSON.stringify(buildDateFilterForStorage(nextRange, nextTemplate))
    ); // nicht default range: in storage speichern
  }

  // *** [ DatePicker ] ************************************************************
  function openPicker() {
    setPickerRange(dateFilter);
    setPickerVisibleMonth(dateFilter.from);
    setIsDatePickerOpen(true);
  }

  function closePicker() {
    setIsDatePickerOpen(false);
  }

  function applyPickerRange() {
    if (!pickerRange?.from || !pickerRange?.to) return;

    const nextRangeTemplate = buildTemplateFromRange(
      pickerRange.from,
      pickerRange.to
    );

    updateDateFilter(pickerRange.from, pickerRange.to, nextRangeTemplate);
    setIsDatePickerOpen(false);
  }

  function clearPickerRange() {
    setPickerRange(defaultRange);
    setPickerVisibleMonth(defaultRange.from);
  }

  return {
    dateFilter,
    dateFilterTemplate,
    isDatePickerOpen,
    pickerRange,
    setPickerRange,
    pickerVisibleMonth,
    setPickerVisibleMonth,
    updateDateFilter,
    openPicker,
    closePicker,
    applyPickerRange,
    clearPickerRange,
  };
}
