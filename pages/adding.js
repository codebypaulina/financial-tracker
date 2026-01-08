"use client"; // ganz oben!
import { useState, useEffect } from "react"; // useState für selection; useEffect, um selection automatisch vorauszuwählen, wenn query vorhanden
import { useRouter } from "next/router"; // um query-Parameter aus URL zu lesen

import Navbar from "@/components/Navbar";
import FormAddTransaction from "@/components/FormAddTransaction";
import FormAddCategory from "@/components/FormAddCategory";
import styled from "styled-components";

export default function AddingPage() {
  const [selection, setSelection] = useState(null); // rendering von FormAddTransaction oder FormAddCategory basierend auf Auswahl

  /********* preselection per query + cancel-button *******************************************************************************************************
   
  A: AddingPage -> selection view -> button "transaction" -> FormAddTransaction -> button "Cancel" -> zurück zu selection view auf AddingPage
  B: CategoryDetailsPage -> button "Add Transaction" -> FormAddTransaction -> button "Cancel" -> zurück zu CategoryDetailsPage                           */

  const router = useRouter(); // Zugriff auf router.query
  const hasCategoryQuery = Boolean(router.query.category); // Zugriff auf query-Parameter "category" aus URL (zB /adding?category=123) (deep-link-Indikator)
  // boolean = false (undefined, null, leer) / true
  // hasCategoryQuery = true, wenn category-query-Parameter existiert, ansonsten hasCategoryQuery = false

  // automatische Vorauswahl basierend auf URL:
  useEffect(() => {
    if (hasCategoryQuery) {
      // wenn category-Parameter existiert (hasCategoryQuery = true),
      setSelection("transaction"); // dann direkt FormAddTransaction rendern statt selection view
    }
  }, [hasCategoryQuery]); // effect läuft, sobald hasCategoryQuery von false auf true geht

  /********************************************************************************************************************************************************/

  return (
    <>
      {!selection && (
        <>
          <PageWrapper>
            <h1>Add</h1>

            <button onClick={() => setSelection("transaction")}>
              transaction
            </button>
            <p>or</p>
            <button onClick={() => setSelection("category")}>category</button>
          </PageWrapper>
          <Navbar />
        </>
      )}

      {selection === "transaction" && (
        <FormAddTransaction
          onCancel={hasCategoryQuery ? undefined : () => setSelection(null)}
        /> // wenn hasCategoryQuery = true, dann onCancel = undefined; ansonsten setzt onCancel selection = null (= zurück zur selection view)
      )}
      {selection === "category" && (
        <FormAddCategory onCancel={() => setSelection(null)} />
      )}
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
