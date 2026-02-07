import useSWR from "swr";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import CloseIcon from "@/public/icons/close.svg";

/*** [ Auswahl category(-ID) + category-type ]**************************************************************************
 
  Fall A (preselection: URL enthält query-params):
  CategoryDetailsPage -> FormAddTransaction: category & type aus URL

  Fall B (keine preselection: URL ohne query):
  AddingPage -> FormAddTransaction: category & type leer

  Fall C (manuelle category-Auswahl):
  Fall C1: Auswahl "Select" (= category-ID leer): type wieder unselected
  Fall C2: Auswahl category (= category-ID vorhanden): type automatisch passend

  Fall D (manuelle type-Auswahl):
  -> nur solange keine category ausgewählt ist
  -> sobald Auswahl von category: Fall C

  ***********************************************************************************************************************/

export default function FormAddTransaction({ onCancel }) {
  // onCancel von AddingPage für cancel-button
  const router = useRouter();
  const { category: queryCategoryId, type: queryType } = router.query; // für preselection (Fall A)

  const { data: allCategories, error } = useSWR("/api/categories"); // für dropdown, um categories abzurufen

  // *********************************************************************************************************************
  // states für category(-ID) + category-type:
  const [selectedCategoryId, setSelectedCategoryId] = useState(""); // aktuell gewählte category im dropdown
  const [selectedType, setSelectedType] = useState(""); // aktuell gewählter type

  // Fall A + B:
  useEffect(() => {
    if (!router.isReady) return; // falls router noch nicht rdy (keine query-params)

    setSelectedCategoryId(queryCategoryId || ""); // category-ID aus URL (Fall A) oder leer (Fall B)
    setSelectedType(queryType || ""); // type aus URL (Fall A) oder leer (Fall B)
  }, [router.isReady, queryCategoryId, queryType]); // wenn query verfügbar / aktualisiert wird

  // Fall C:
  useEffect(() => {
    if (!allCategories) return; // falls categories noch nicht geladen

    // Fall C1: wenn keine category-ID, dann type leer
    if (!selectedCategoryId) {
      setSelectedType("");
      return;
    }

    // Fall C2:
    const selectedCategory = allCategories.find(
      (category) => category._id === selectedCategoryId // sucht category-object mit ausgewählter category(-ID)
    );

    // wenn category-object gefunden, dann type aus category-object
    if (selectedCategory) {
      setSelectedType(selectedCategory.type);
    }
  }, [selectedCategoryId, allCategories]); // bei category-Wechsel / wenn categories (neu) geladen werden

  // *********************************************************************************************************************

  // verhindert Laufzeitfehler bis categories über SWR abgerufen werden:
  if (error) return <h3>Failed to load data</h3>;
  if (!allCategories) return <h3>Loading ...</h3>;

  // cancel-button:
  // wenn onCancel von AddingPage übergeben wird, dann dorthin zurück (selection view), sonst zurück zu CategoryDetailsPage
  function handleCancel() {
    return onCancel ? onCancel() : router.back();
  }

  // save-button
  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("ADDING SUCCESSFUL! (transaction)");
        router.back(); // nach erfolgreichem Hinzufügen neuer transaction zurück zur vorherigen page
      } else {
        throw new Error(
          `Failed to add new transaction (status: ${response.status})`
        );
      }
    } catch (error) {
      console.error("Error adding new transaction: ", error);
    }
  }

  // Fall D: type-radio
  function handleTypeSelect(type) {
    if (!selectedCategoryId) setSelectedType(type); // wenn category-state leer, manuelle type-Auswahl
  }

  return (
    <PageWrapper>
      <FormContainer onSubmit={handleSubmit}>
        <FormHeader>
          <h1>Add</h1>

          <CloseButton type="button" onClick={handleCancel}>
            <CloseIcon />
          </CloseButton>
        </FormHeader>

        <label htmlFor="category">Category</label>
        <CategoryGroup>
          <select
            id="category"
            name="category"
            value={selectedCategoryId} // immer aktueller category-state (selectedCategoryId)
            onChange={(event) => setSelectedCategoryId(event.target.value)} // Fall C: bei Auswahl wird category-state gesetzt
            required
          >
            <option value="" disabled>
              Select
            </option>

            {allCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <ColorTag />
        </CategoryGroup>

        <label htmlFor="description">Description</label>
        <input
          type="text"
          id="description"
          name="description"
          placeholder=" ..."
          required
        />

        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          name="amount"
          placeholder=" 0,00 €"
          step="any" // Kommazahlen; "any" statt "0.01", weils nur so in FormEditTransaction ging
          min="0.01"
          required
        />

        <label htmlFor="date">Date</label>
        <input type="date" id="date" name="date" required />

        <button type="submit">Save</button>
      </FormContainer>
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

  display: flex; // content vertikal
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

  button[type="submit"] {
    margin-top: 2rem; // Abstand zum letzten input
    align-self: center;

    border: none;
    border-radius: 20px;
    width: 70px;
    height: 30px;
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
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(0, 0, 0, 1);

  background-color: ${({ $categoryType }) =>
    $categoryType === "Expense"
      ? "var(--expense-color)"
      : "var(--income-color)"};

  &:hover {
    transform: scale(1.07);
  }
`;
