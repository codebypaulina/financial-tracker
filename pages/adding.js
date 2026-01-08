"use client"; // ganz oben!
import { useState, useEffect } from "react"; // useState für selection; useEffect für preselection per query
import { useRouter } from "next/router"; // für preselection per query: um query-param "category" aus URL zu lesen (wenn von CategoryDetailsPage kommend)

import Navbar from "@/components/Navbar";
import FormAddTransaction from "@/components/FormAddTransaction";
import FormAddCategory from "@/components/FormAddCategory";
import styled from "styled-components";

/******************* [ preselection per query + cancel-button ] *****************************************************************************
  A: AddingPage -> selection view -> button "transaction" -> FormAddTransaction -> button "Cancel" -> zurück zu selection view auf AddingPage
  B: CategoryDetailsPage -> button "Add Transaction" -> FormAddTransaction -> button "Cancel" -> zurück zu CategoryDetailsPage                           
/********************************************************************************************************************************************/

export default function AddingPage() {
  const [selection, setSelection] = useState(null); // rendering von FormAddTransaction ODER FormAddCategory basierend auf selection

  const router = useRouter(); // Zugriff auf router.query
  const hasCategoryQuery = Boolean(router.query.category); // Zugriff auf query-param "category" aus URL (zB /adding?category=123 -> deep-link von CategoryDetailsPage)
  /* boolean = false (undefined, null, leer) / true
     hasCategoryQuery = true, wenn "category"-param existiert, ansonsten hasCategoryQuery = false */
  const resetSelection = () => setSelection(null); // für onCancel = zurück zu selection view

  // "transaction"-preselection per query, wenn von CategoryDetailsPage kommend:
  useEffect(() => {
    if (hasCategoryQuery && !selection) {
      // wenn category-query existiert (hasCategoryQuery = true) && keine selection,
      setSelection("transaction"); // dann direkt FormAddTransaction rendern statt selection view
    }
  }, [hasCategoryQuery, selection]);

  /********************************************************************************************************************************************/

  // FormAddTransaction:
  // selection view -> button "transaction" -> FormAddTransaction
  // onCancel: wenn hasCategoryQuery = true, dann onCancel = undefined (zurück zu CategoryDetailsPage); ansonsten resettet selection (zurück zu selection view)
  if (selection === "transaction") {
    return (
      <FormAddTransaction
        onCancel={hasCategoryQuery ? undefined : resetSelection}
      />
    );
  }

  // FormAddCategory:
  // selection view -> button "category" -> FormAddCategory
  // onCancel: resettet selection = null (= zurück zu selection view)
  if (selection === "category") {
    return <FormAddCategory onCancel={resetSelection} />;
  }

  // default: selection view
  return (
    <>
      <PageWrapper>
        <h1>Add</h1>

        <button onClick={() => setSelection("transaction")}>transaction</button>
        <p>or</p>
        <button onClick={() => setSelection("category")}>category</button>
      </PageWrapper>
      <Navbar />
    </>
  );
}

const PageWrapper = styled.div`
  height: calc(100vh - var(--navbar-height, 65px)); // wrapper wie viewport
  display: flex; // wegen Zentrierung
  flex-direction: column; // content untereinander
  align-items: center; // content vertikal zentriert
  justify-content: center; // content horizontal zentriert

  h1 {
    margin-bottom: 2rem;
  }

  p {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary-text-color);
    margin: 0.2rem 0 0.7rem 0;
  }

  button {
    border: none;
    border-radius: 20px;
    width: 115px;
    height: 30px;
    cursor: pointer;
    background-color: var(--secondary-text-color);
    font-weight: bold;
    font-size: 1rem;

    &:hover {
      transform: scale(1.07);
    }
  }
`;
