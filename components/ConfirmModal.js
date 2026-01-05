import { useEffect } from "react"; // für ESC-key-handling bei geöffnetem Modal
import styled from "styled-components";

export default function ConfirmModal({
  open, // Sichtbarkeit Modal
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm, // callback bei confirm
  onCancel, // callback bei cancel (+ overlay + ESC)
}) {
  useEffect(() => {
    if (!open) return; // wenn Modal nicht offen, keine keyboard-events

    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel(); // ESC schließt Modal über onCancel
    }

    window.addEventListener("keydown", handleKeyDown); // event listener für ESC aktivieren
    return () => window.removeEventListener("keydown", handleKeyDown); // event listener beim Schließen entfernen
  }, [open, onCancel]); // effect hängt davon ab, ob Modal offen & welche onCancel-Funktion genutzt wird

  if (!open) return null; // wenn Modal nicht offen, nichts rendern

  return (
    <>
      <Overlay onClick={onCancel} />
      {/* Klick auf overlay schließt Modal über onCancel */}

      <Modal role="dialog" aria-modal="true">
        <h2>{title}</h2>
        <p>{message}</p>
        <ButtonContainer>
          <button type="button" onClick={onConfirm} className="confirm">
            {confirmLabel}
          </button>

          <button type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </ButtonContainer>
      </Modal>
    </>
  );
}

const Overlay = styled.div`
  position: fixed; // bei scroll im viewport
  top: 0; // Start oberer Rand
  left: 0; // Start linker Rand
  width: 100%; // über komplette Breite
  height: 100%; // über komplette Höhe
  background: rgba(0, 0, 0, 0.6); // abgedunkelt
  z-index: 9; // über Seite, unter Modal
`;

const Modal = styled.div`
  background-color: var(--button-background-color);
  color: var(--button-text-color);
  padding: 20px; // Innenabstand
  border-radius: 15px; // runde Ecken
  z-index: 10; // Modal über overlay
  width: min(92vw, 495px); // Breite responsiv + max-Wert
  position: fixed; // bei scroll im viewport
  display: flex;
  flex-direction: column; // Elemente untereinander
  gap: 1rem; // Abstand zw. title + message + buttons
`;

const ButtonContainer = styled.div`
  margin-top: 1rem; // Abstand zu message
  display: flex; // buttons nebeneinander
  justify-content: center; // buttons zentriert
  gap: 1rem; // Abstand zw. buttons
  flex-wrap: wrap; // Umbruch; buttons untereinander

  button {
    border: none;
    border-radius: 20px;
    min-width: 70px;
    min-height: 30px;
    cursor: pointer;

    &:hover {
      transform: scale(1.03);
      font-weight: bold;
    }
  }

  button.confirm {
    background-color: var(--expense-color);
    color: var(--primary-text-color);
  }
`;
