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
          <label htmlFor="type" className="label-type">
            Type:
          </label>

          <RadioRow>
            <RadioOption>
              <input
                type="radio"
                id="income"
                name="type"
                value="Income"
                defaultChecked={category.type === "Income"}
                required
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
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={category.name}
          required
        />

        <label htmlFor="color">Color:</label>
        <input
          type="color"
          id="color"
          name="color"
          defaultValue={category.color}
          required
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
  padding: 2rem; // Abstand zum Bildschirmrand
  min-height: 100vh; // wrapper mind. wie viewport
  display: flex; // wegen Zentrierung von form
  align-items: center; // form vertikal zentriert
  justify-content: center; // form horizontal zentriert
`;

const FormContainer = styled.form`
  max-width: 300px;
  background-color: var(--button-background-color);
  padding: 1.5rem 2rem 2rem 2rem;
  border-radius: 1.5rem; // abgerundete Ecken

  display: flex; // content vertikal
  flex-direction: column; // content untereinander
  box-shadow: 0 0 20px rgba(0, 0, 0, 1);

  h1 {
    text-align: center;
    margin-bottom: 1rem; // Abstand zum ersten label
  }

  label {
    font-weight: bold;
    margin-bottom: 0.5rem; // Abstand zw. label & jeweiligem input
  }

  input[type="text"],
  input[type="color"] {
    border-radius: 0.5rem; // abgerundete Ecken
    border: 0.07rem solid var(--button-hover-color);
    height: 1.5rem;
  }

  input[type="text"] {
    margin-bottom: 0.8rem; // Abstand zu Color

    // Firefox: wenn Feld angeklickt, kein blauer Rahmen:
    accent-color: var(--button-hover-color);
  }

  input[type="color"] {
    cursor: pointer;
    width: 100%; // auch so breit wie container
  }

  /*********************** Chrome ***********************/
  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0; // hässliches weißes padding weg
  }
  input[type="color"]::-webkit-color-swatch {
    border: none; // grauer innerer Rahmen weg
  }
  /******************************************************/
`;

const TypeGroup = styled.div`
  display: flex; // Type & RadioRow in einer Reihe
  flex-wrap: wrap; // Umbruch von Type & RadioRow, wenn nicht genug Platz
  margin-bottom: 1rem; // Abstand zu Name

  // *** Abstand zw. Type & RadioRow: ***************************************
  // margin, nicht margin-right! (im FormContainer haben label margin-bottom)
  .label-type {
    margin: 0 1rem 0 0;

    @media (max-width: 338px) {
      margin: 0 0.75rem 0 0; // kleiner
    }
    @media (max-width: 326px) {
      margin: 0 0.75rem 0.35rem 0; // bei Umbruch auch unten
    }
  }
  // ************************************************************************

  @media (max-width: 326px) {
    margin-bottom: 0.8rem; // Abstand zu Category bei Umbruch von Type & Radiorow
  }
`;

const RadioRow = styled.div`
  display: flex; // beide RadioOptions nebeneinander

  // *** Abstand zw. RadioOptions: *******************************************
  gap: 1rem;

  @media (max-width: 338px) {
    gap: 0.5rem; // kleiner
  }
  @media (max-width: 326px) {
    gap: 1rem; // bei Umbruch von Type & Radiorow wieder normal
  }
  // **************************************************************************
`;

const RadioOption = styled.div`
  input#income {
    accent-color: var(--income-color);
  }
  input#expense {
    accent-color: var(--expense-color);
  }

  label {
    margin-left: 0.35rem; // Abstand zw. radio & label
    font-size: 0.9rem;
    font-weight: normal;
  }
`;

const ButtonContainer = styled.div`
  margin-top: 2rem; // Abstand zum letzten input
  display: flex; // wegen Zentrierung
  justify-content: center; // buttons zentriert
  gap: 0.8rem; // Abstand zw. buttons
  flex-wrap: wrap; // Umbruch; buttons untereinander

  button {
    border: none;
    border-radius: 20px;
    min-width: 70px;
    min-height: 30px;
    cursor: pointer;
    font-weight: bold;
    background-color: var(--secondary-text-color);

    &:hover {
      transform: scale(1.07);
    }
  }
`;
