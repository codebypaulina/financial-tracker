import useSWR from "swr";
import { useRouter } from "next/router";
import { useEffect, useState } from "react"; // effect + state: category-Änderung -> type-Änderung // state: ConfirmModal open/!open
import styled from "styled-components";
import ConfirmModal from "./ConfirmModal";
import CloseIcon from "@/public/icons/close.svg";

export default function FormEditTransaction() {
  const router = useRouter();
  const { id } = router.query; // transaction-ID aus URL

  // *** [ fetch ]
  const { data: transaction, error: errorTransaction } = useSWR(
    id ? `/api/transactions/${id}` : null
  );
  const { data: categories, error: errorCategories } =
    useSWR("/api/categories");

  // *** [ states ]
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // für ConfirmModal
  const [currentCategoryId, setCurrentCategoryId] = useState(""); // für dropdown in CategoryGroup

  // *** [ sync category-state ]
  useEffect(() => {
    if (!transaction?.category?._id) return;
    setCurrentCategoryId(transaction.category._id);
  }, [transaction?.category?._id]);

  // *** [ guards ]
  if (errorTransaction || errorCategories) return <h3>Failed to load data</h3>;
  if (!transaction || !categories) return <h3>Loading ...</h3>;

  // *** [ abgeleitete Daten ] *************************************************************
  // *** [ type ]: aus aktuellem category-state (für ColorTag)
  const currentType = categories.find(
    (category) => category._id === currentCategoryId
  )?.type;

  // *** [ categories A-Z ]: für dropdown
  // undefined: user-locale // sensitivity: case- & accent-insensitive
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // ***************************************************************************************
  // *** [ X-button ]: zurück zur vorherigen page
  function handleCancel() {
    router.back();
  }

  // *** [ save-button ]
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
        router.back(); // zurück zur vorherigen page
      } else {
        throw new Error(
          `Failed to update transaction (status: ${response.status})`
        );
      }
    } catch (error) {
      console.error("Error updating transaction: ", error);
    }
  }

  // *** [ delete ]
  // *** [1. button]: ConfirmModal öffnen
  function handleDelete() {
    setIsConfirmOpen(true);
  }

  // *** [2. confirm-button]: transaction löschen
  async function handleConfirmDelete() {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        console.log("DELETING SUCCESSFUL! (transaction)");
        setIsConfirmOpen(false); //  Modal schließen
        router.back(); // zurück zur vorherigen page
      } else {
        throw new Error(
          `Failed to delete transaction (status: ${response.status})`
        );
      }
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      setIsConfirmOpen(false); // Modal schließen, damit user nicht festhängt
    }
  }

  return (
    <PageWrapper>
      <FormContainer onSubmit={handleSubmit}>
        <FormHeader>
          <h1>Edit</h1>

          <CloseButton type="button" onClick={handleCancel}>
            <CloseIcon />
          </CloseButton>
        </FormHeader>

        <label htmlFor="category">Category</label>
        <CategoryGroup>
          <select
            id="category"
            name="category"
            value={currentCategoryId} // category-state
            onChange={(event) => setCurrentCategoryId(event.target.value)}
            required
          >
            {sortedCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <ColorTag $categoryType={currentType} />
        </CategoryGroup>

        <label htmlFor="description">Description</label>
        <input
          type="text"
          id="description"
          name="description"
          defaultValue={transaction.description}
          required
        />

        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          name="amount"
          defaultValue={transaction.amount}
          step="any" // hier Kommazahlen nur so (nicht "0.01")
          min="0.01"
          required
        />

        <label htmlFor="date">Date</label>
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

          <button type="submit">Save</button>
        </ButtonContainer>
      </FormContainer>

      <ConfirmModal
        open={isConfirmOpen} // state
        title="Delete transaction?"
        message="Are you sure you want to delete this transaction? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete} // transaction löschen
        onCancel={() => setIsConfirmOpen(false)} // schließen (X / ESC / Overlay)
      />
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  min-height: 100vh; // wrapper mind. wie viewport
  display: flex; // wegen Zentrierung von form
  align-items: center; // form vertikal zentriert
  justify-content: center; // form horizontal zentriert
`;

const FormContainer = styled.form`
  max-width: 250px;
  background-color: var(--background-color);
  padding: 1.5rem 2rem 2rem 2rem;
  border-radius: 1.5rem; // abgerundete Ecken

  display: flex;
  flex-direction: column; // content untereinander
  box-shadow: 0 0 20px rgba(0, 0, 0, 1);

  label {
    font-weight: bold;
    margin-bottom: 0.5rem; // Abstand zw. label & jeweiligem input
  }

  select,
  input[type="text"],
  input[type="number"],
  input[type="date"] {
    border-radius: 0.5rem; // abgerundete Ecken
    border: 0.07rem solid var(--button-hover-color);
    height: 1.5rem;

    // Firefox: wenn Feld angeklickt, kein blauer Rahmen:
    accent-color: var(--button-hover-color);
  }

  input[type="text"],
  input[type="number"] {
    margin-bottom: 0.8rem; // Abstand zw. Blöcken
  }

  input[type="date"] {
    cursor: text;
  }
`;

const FormHeader = styled.div`
  display: flex; // h1 + CloseButton nebeneinander
  align-items: center; // h1 + CloseButton vetikal zentriert
  margin-bottom: 1rem; // Abstand zum ersten label

  h1 {
    font-size: 1.5rem;
    flex: 1; // nimmt restlichen Platz in FormHeader
    text-align: center;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;

  svg {
    width: 22px;
    height: 22px;
    filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.9)); // ohne Ecken
  }
  svg path[class*="circle"] {
    fill: var(--button-background-color);
  }
  svg path[class*="X"] {
    fill: var(--button-text-color);
  }

  &:hover {
    transform: scale(1.07);

    svg path[class*="X"] {
      fill: var(--primary-text-color);
    }
  }
`;

const CategoryGroup = styled.div`
  display: flex; // select + ColorTag nebeneinander
  align-items: center; // ColorTag vertikal zentriert
  gap: 0.75rem; // Abstand select + ColorTag
  margin-bottom: 0.8rem; // Abstand Block Description

  select {
    flex: 1; // nimmt restlichen Platz in CategoryGroup
    cursor: pointer;
  }
`;

const ColorTag = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;

  background-color: ${({ $categoryType }) =>
    $categoryType === "Expense"
      ? "var(--expense-color)"
      : "var(--income-color)"};
`;

const ButtonContainer = styled.div`
  margin-top: 2rem; // Abstand zum letzten input
  display: flex; // wegen Zentrierung
  justify-content: center; // buttons zentriert
  gap: 0.8rem;

  button {
    border: none;
    border-radius: 20px;
    min-width: 70px;
    min-height: 30px;
    cursor: pointer;
    font-weight: bold;
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    box-shadow: 0 0 20px rgba(0, 0, 0, 1);

    &:hover {
      transform: scale(1.07);
      color: var(--primary-text-color);
    }
  }
`;
