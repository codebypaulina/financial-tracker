import useSWR from "swr";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";
import CloseIcon from "@/public/icons/close.svg";

export default function FormAddTransaction({ onCancel }) {
  // onCancel von AddingPage für cancel-button
  const router = useRouter();
  const { category: queryCategoryId } = router.query;

  const { data: categories, error } = useSWR("/api/categories");

  // *********************************************************************************************************************
  // states für category(-ID) + category-type:
  const [currentCategoryId, setCurrentCategoryId] = useState(""); // ID für dropdown
  const [typeFilter, setTypeFilter] = useState("Expense"); // type für dropdown-filter + ColorTag

  // *** [ sync states ] *******************************************************************
  // *** [1. aktuelle category]: aus url (ID preselected aus CategoryDetailsPage)
  useEffect(() => {
    if (router.isReady) setCurrentCategoryId(queryCategoryId || "");
  }, [router.isReady, queryCategoryId]);

  // *** [2. type-filter]: aus aktueller category (filter preselected aus CategoryDetailsPage)
  useEffect(() => {
    if (!categories) return;
    if (!currentCategoryId) return;

    const currentCategory = categories.find(
      (category) => category._id === currentCategoryId
    );

    if (currentCategory) {
      setTypeFilter(currentCategory.type);
    }
  }, [categories, currentCategoryId]);

  // ***************************************************************************************

  // verhindert Laufzeitfehler bis categories über SWR abgerufen werden:
  if (error) return <h3>Failed to load data</h3>;
  if (!categories) return <h3>Loading ...</h3>;

  // *** [ abgeleitete Daten ] *************************************************************
  // *** [categories sortieren]: A-Z (für dropdown)
  // undefined: user-locale // sensitivity: case- & accent-insensitive
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // *** [categories filtern]: nach type (für dropdown)
  const filteredCategories = sortedCategories.filter(
    (category) => category.type === typeFilter
  );

  // ***************************************************************************************
  // *** [ type-filter-button ]
  function toggleTypeFilter() {
    setTypeFilter((prev) => (prev === "Expense" ? "Income" : "Expense"));
    setCurrentCategoryId(""); // dropdown: "Select"
  }

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
            value={currentCategoryId} // state
            onChange={(event) => setCurrentCategoryId(event.target.value)}
            required
          >
            <option value="" disabled>
              Select
            </option>

            {filteredCategories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <ColorTag
            type="button"
            aria-label="Switch between income and expense categories"
            title={`${typeFilter} (click to switch)`}
            onClick={toggleTypeFilter}
            $categoryType={typeFilter}
          />
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

const ColorTag = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
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
