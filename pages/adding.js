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
    <PageWrapper>
      {!selection && (
        <h1>
          Do you want to add a{" "}
          <button onClick={() => setSelection("transaction")}>
            transaction
          </button>{" "}
          or a{" "}
          <button onClick={() => setSelection("category")}>category</button>?
        </h1>
      )}

      {selection === "transaction" && (
        <FormAddTransaction
          onCancel={hasCategoryQuery ? undefined : () => setSelection(null)}
        /> // wenn hasCategoryQuery = true, dann onCancel = undefined; ansonsten setzt onCancel selection = null (= zurück zur selection view)
      )}
      {selection === "category" && (
        <FormAddCategory onCancel={() => setSelection(null)} />
      )}

      <Navbar />
    </PageWrapper>
  );
}

const PageWrapper = styled.div`
  min-height: 100vh; // Wrapper nimmt mind. volle Bildschirmhöhe ein
  display: flex; // zentriert Inhalt
  justify-content: center; // h1 horizontal zentriert
  align-items: center; // h1 vertikal zentriert
  padding: 2rem; // Abstand zum Bildschirmrand

  button {
    border: none;
    border-radius: 20px;
    min-width: 90px;
    min-height: 30px;
    cursor: pointer;

    &:hover {
      transform: scale(1.07);
      font-weight: bold;
    }
  }
`;
