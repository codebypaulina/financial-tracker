import useSWR from "swr";
import { useRouter } from "next/router";
import { useEffect, useState } from "react"; // für: category-Auswahl -> automatische type-Auswahl
import styled from "styled-components";

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
        <h1>Add Transaction</h1>

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
                checked={selectedType === "Income"} // immer aktueller type-state (selectedType)
                onChange={() => handleTypeSelect("Income")} // Fall D
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
                checked={selectedType === "Expense"} // immer aktueller type-state (selectedType)
                onChange={() => handleTypeSelect("Expense")} // Fall D
              />
              <label htmlFor="expense">Expense</label>
            </RadioOption>
          </RadioRow>
        </TypeGroup>

        <label htmlFor="category">Category:</label>
        <select
          id="category"
          name="category"
          value={selectedCategoryId} // immer aktueller category-state (selectedCategoryId)
          onChange={(event) => setSelectedCategoryId(event.target.value)} // Fall C: bei Auswahl wird category-state gesetzt
          required
        >
          <option value="">Select</option>

          {allCategories.map((category) => (
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
          placeholder=" ..."
          required
        />

        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          name="amount"
          placeholder=" 0,00 €"
          step="any" // Kommazahlen; "any" statt "0.01", weils nur so in FormEditTransaction ging
          min="0.01"
          required
        />

        <label htmlFor="date">Date:</label>
        <input type="date" id="date" name="date" required />

        <ButtonContainer>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </ButtonContainer>
      </FormContainer>
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  min-height: 100vh; // wrapper mind. wie viewport
  padding: 2rem; // Abstand zum Bildschirmrand
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
  gap: 1rem; // Abstand zw. buttons

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
