"use client"; // ganz oben!
import { useState } from "react"; // für selection

import Navbar from "@/components/Navbar";
import FormAddTransaction from "@/components/FormAddTransaction";
import FormAddCategory from "@/components/FormAddCategory";

export default function AddingPage() {
  const [selection, setSelection] = useState(null);

  return (
    <>
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

      {selection === "transaction" && <FormAddTransaction />}
      {selection === "category" && <FormAddCategory />}

      <Navbar />
    </>
  );
}
