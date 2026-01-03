"use client"; // ganz oben!
import { useState } from "react"; // für selection

import Navbar from "@/components/Navbar";
import FormAddTransaction from "@/components/FormAddTransaction";
import FormAddCategory from "@/components/FormAddCategory";
import styled from "styled-components";

export default function AddingPage() {
  const [selection, setSelection] = useState(null); // rendering von FormAddTransaction oder FormAddCategory basierend auf Auswahl

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
        <FormAddTransaction onCancel={() => setSelection(null)} /> // onCancel für cancel-button als prop an forms übergeben (selection null = zur Frage zurück)
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
