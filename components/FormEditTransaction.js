import useSWR from "swr";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useState } from "react"; // state für ConfirmModal open/!open
import ConfirmModal from "./ConfirmModal";

export default function FormEditTransaction() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. transaction aus URL extrahiert

  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // für ConfirmModal: steuert, ob Modal angezeigt wird

  const { data: transaction, error: errorTransaction } = useSWR(
    id ? `/api/transactions/${id}` : null
  ); // transaction abrufen
  const { data: categories, error: errorCategories } =
    useSWR("/api/categories"); // für Dropdown, damit Kategorien zur Auswahl abgerufen werden

  if (errorTransaction || errorCategories) return <h3>Failed to load data</h3>;
  if (!transaction || !categories) return <h3>Loading...</h3>;

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
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("UPDATING SUCCESSFUL! (transaction)");
        router.back(); // nach erfolgreichem Updaten der Transaktion zurück zur vorherigen Seite
      } else {
        throw new Error("Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction: ", error);
    }
  }

  // 1. delete button: öffnet ConfirmModal, statt direkt Löschung
  async function handleDelete() {
    setIsConfirmOpen(true);
  }

  // 2. delete confirm: nach ConfirmModal Löschung
  async function handleConfirmDelete() {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete transaction");

      setIsConfirmOpen(false); // Modal schließen nach erfolgreichem delete

      console.log("DELETING SUCCESSFUL! (transaction)!");

      router.back(); // nach Löschen zurück zur vorherigen Seite
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      setIsConfirmOpen(false); // Modal bei error schließen, damit user nicht festhängt
    }
  }

  return (
    <PageWrapper>
      <FormContainer onSubmit={handleSubmit}>
        <h1>Edit Transaction</h1>

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
                defaultChecked={transaction.type === "Income"}
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
                defaultChecked={transaction.type === "Expense"}
              />
              <label htmlFor="expense">Expense</label>
            </RadioOption>
          </RadioRow>
        </TypeGroup>

        <label htmlFor="category">Category:</label>
        <select
          id="category"
          name="category"
          defaultValue={transaction.category._id}
          required
        >
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>

        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          name="description"
          defaultValue={transaction.description}
          required
        />

        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          name="amount"
          defaultValue={transaction.amount}
          step="any" // hier Kommazahlen nur so (nicht "0.01")
          min="0.01"
          required
        />

        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          defaultValue={transaction.date.slice(0, 10)} // nimmt nur erste 10 Zeichen aus Datum-String: YYYY-MM-DD
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
        title="Delete transaction?"
        message="Are you sure you want to delete this transaction? This cannot be undone."
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

  select,
  input[type="text"],
  input[type="number"],
  input[type="date"] {
    margin-bottom: 0.8rem; // Abstand zw. Blöcken
    border-radius: 0.5rem; // abgerundete Ecken
    border: 0.07rem solid var(--button-hover-color);
    height: 1.5rem;

    // Firefox: wenn Feld angeklickt, kein blauer Rahmen:
    accent-color: var(--button-hover-color);
  }

  select {
    cursor: pointer;
  }

  input[type="date"] {
    margin-bottom: 0; // letztes input-Feld kein Abstand zu ButtonContainer
    cursor: text;
  }
`;

const TypeGroup = styled.div`
  display: flex; // Type & RadioRow in einer Reihe
  flex-wrap: wrap; // Umbruch von Type & RadioRow, wenn nicht genug Platz
  margin-bottom: 1rem; // Abstand zu Category

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
  input {
    cursor: pointer;
    margin-right: 0.35rem; // Abstand zw. radio & label
  }

  input#income {
    accent-color: var(--income-color);
  }
  input#expense {
    accent-color: var(--expense-color);
  }

  label {
    cursor: pointer;
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
