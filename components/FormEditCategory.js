import useSWR from "swr";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useState } from "react"; // state für ConfirmModal open/!open
import ConfirmModal from "./ConfirmModal";

export default function FormEditCategory() {
  const router = useRouter();
  const { id, from } = router.query; // ID der entspr. category aus URL extrahiert // "from" auslesen für back navigation nach delete von category

  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // für ConfirmModal: steuert, ob Modal angezeigt wird

  const { data: category, error } = useSWR(id ? `/api/categories/${id}` : null); // category abrufen

  if (error) return <h3>Failed to load category</h3>;
  if (!category) return <h3>Loading...</h3>;

  // Cancel-Button
  function handleCancel() {
    router.back(); // zurück zur vorherigen Seite (nochmal überdenken, ob er nicht lieber Formular clearen soll & zustätzl. X-Button dafür implemetieren)
  }

  // Save-Button
  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("UPDATING SUCCESSFUL! (category)");
        router.back(); // nach erfolgreichem Updaten der Kategorie zurück zur vorherigen Seite
      } else {
        throw new Error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category: ", error);
    }
  }

  // 1. delete button: öffnet ConfirmModal, statt direkt Löschung
  async function handleDelete() {
    setIsConfirmOpen(true);
  }

  // 2. delete confirm: nach ConfirmModal Löschung
  async function handleConfirmDelete() {
    const hasTransactions = category.transactionCount > 0; // entscheidet mit transactionCount aus API zw. Fall A (leere ca) / B (ca + zugehörige ta)

    try {
      const url = hasTransactions
        ? `/api/categories/${id}?cascade=true`
        : `/api/categories/${id}`; // wählt endpoint-URL abhängig davon, ob cascade-delete nötig

      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      setIsConfirmOpen(false); // Modal schließen nach erfolgreichem delete

      console.log("DELETING SUCCESSFUL! (category)");

      router.push(from || "/categories"); // wenn from existiert, dann nach delete dahin zurück, sonst fallback zu CategoriesPage (anstatt router.back() zur gelöschten CategoryDetailsPage)
    } catch (error) {
      console.error("Error deleting category: ", error);
      setIsConfirmOpen(false); // Modal bei error schließen, damit user nicht festhängt
    }
  }

  return (
    <PageWrapper>
      <FormContainer onSubmit={handleSubmit}>
        <h1>Edit Category</h1>

        <TypeGroup>
          <label htmlFor="type">Type:</label>
          <RadioRow>
            <RadioOption>
              <input
                type="radio"
                id="income"
                name="type"
                value="Income"
                defaultChecked={category.type === "Income"}
              />
              <label htmlFor="income">Income</label>
            </RadioOption>

            <RadioOption>
              <input
                type="radio"
                id="expense"
                name="type"
                value="Expense"
                defaultChecked={category.type === "Expense"}
              />
              <label htmlFor="expense">Expense</label>
            </RadioOption>
          </RadioRow>
        </TypeGroup>

        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" defaultValue={category.name} />

        <label htmlFor="color">Color:</label>
        <input
          type="color"
          id="color"
          name="color"
          defaultValue={category.color}
        />

        <ButtonContainer>
          <button type="button" onClick={handleDelete}>
            Delete
          </button>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </ButtonContainer>
      </FormContainer>

      <ConfirmModal
        open={isConfirmOpen} // Modal offen, wenn isConfirmOpen = true
        title={
          category.transactionCount > 0
            ? "Delete category & transactions?"
            : "Delete category?"
        }
        message={
          category.transactionCount > 0
            ? "Are you sure you want to delete this category & all included transactions? This cannot be undone."
            : "Are you sure you want to delete this category? This cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete} // Löschung erst bei confirm
        onCancel={() => setIsConfirmOpen(false)} // Modal schließen über Cancel / Overlay / ESC
      />
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  min-height: 100vh; // Wrapper nimmt mind. volle Bildschirmhöhe ein
  display: flex; // zentriert Inhalt
  justify-content: center; // form horizontal zentriert
  align-items: center; // form vertikal zentriert
  padding: 2rem; // Abstand zum Bildschirmrand
`;

const FormContainer = styled.form`
  width: 100%; // gesamte verf. Breite von Elterncontainer
  max-width: 420px;
  background-color: var(--button-background-color);
  padding: 1.5rem 2rem 2rem 2rem;
  border-radius: 1.5rem; // abgerundete Ecken

  display: flex; // vertikale Anordnung von form-Inhalt
  flex-direction: column; // untereinander
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.66);

  h1 {
    text-align: center;
    margin-bottom: 1rem; // Abstand zum ersten label
  }

  label {
    font-weight: bold;
    margin-bottom: 0.5rem; // Abstand zw. label & jeweiligem input
  }

  label:first-child {
    margin-bottom: 0.8rem;

    // bei Umbruch von Type & RadioRow kein margin-bottom -> TypeGroup margin-bottom zum nächsten Block
    @media (max-width: 338px) {
      margin-bottom: 0;
    }
  }

  input {
    cursor: pointer;
    margin-bottom: 0.8rem; // Abstand zw. Blöcken
    border-radius: 0.5rem; // abgerundete Ecken
    border: 0.07rem solid var(--button-hover-color);
  }

  input[type="color"] {
    width: 100%; // auch so breit wie parent
    margin-bottom: 0; // letztes input-Feld kein Abstand zu ButtonContainer
    height: 1.5rem;
  }

  /*********************** Chrome ***********************/

  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0; // hässliches weißes padding weg
  }

  input[type="color"]::-webkit-color-swatch {
    border: none; // grauer innerer Rahmen weg
  }

  /******************************************************/

  // muss unter [type="color"] stehen, es überschreibt sonst  (?!)
  input[type="text"] {
    height: 1.5rem;
    accent-color: var(
      --button-hover-color
    ); // Firefox: wenn Feld angeklickt, kein blauer Rahmen
  }
`;

const TypeGroup = styled.div`
  display: flex; // Type & RadioRow in einer Reihe
  flex-wrap: wrap; // Umbruch von Type & RadioRow, wenn nicht genug Platz
  gap: 1rem; // Abstand zw. Type & RadioRow

  // bei Umbruch von Type & RadioRow kleinere gap + margin-bottom zum nächsten Block
  @media (max-width: 338px) {
    gap: 0.35rem;
    margin-bottom: 0.7rem;
  }
`;

const RadioRow = styled.div`
  display: flex; // beide RadioOptions nebeneinander
  gap: 1rem; // Abstand zw. RadioOptions

  // bei Umbruch von Type & RadioRow kleinere gap
  @media (max-width: 338px) {
    gap: 0.35rem;
  }
`;

const RadioOption = styled.div`
  input {
    accent-color: var(--button-hover-color);
  }

  label {
    font-size: 0.9rem;
    font-weight: normal;
    margin-left: 0.35rem; // Abstand zw. radio & label
  }
`;

const ButtonContainer = styled.div`
  margin-top: 2rem; // Abstand zum letzten input-Feld
  display: flex;
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
      transform: scale(1.07);
      font-weight: bold;
    }
  }
`;
