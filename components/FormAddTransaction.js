import useSWR from "swr";
import { useRouter } from "next/router";
import styled from "styled-components";

export default function FormAddTransaction({ onCancel }) {
  // onCancel von AddingPage für cancel-button
  const router = useRouter();
  const { category: categoryId, type: preselectedType } = router.query; //

  const { data: categories, error } = useSWR("/api/categories"); // für Dropdown, damit Kategorien zur Auswahl abgerufen werden

  if (error) return <div>Failed to load categories</div>;
  if (!categories) return <div>Loading...</div>;

  // Cancel-Button
  function handleCancel() {
    if (onCancel)
      onCancel(); // wenn onCancel von AddingPage übergeben wird, zurück zur selection view in AddingPage,
    else router.back(); // ansonsten zurück zur vorherigen page (= CategoryDetailsPage)
  }

  // Save-Button
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
        console.log("ADDING SUCCESSFULL! (transaction)");
        router.back(); // nach erfolgreichem Hinzufügen neuer Transaktion zurück zur vorherigen Seite
      } else {
        throw new Error("Failed to add new transaction");
      }
    } catch (error) {
      console.error("Error adding new transaction: ", error);
    }
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
                defaultChecked={preselectedType === "Income"}
                required // reicht nur bei der 1. Option für Fehlermeldung
              />
              <label htmlFor="income">Income</label>
            </RadioOption>

            <RadioOption>
              <input
                type="radio"
                id="expense"
                name="type"
                value="Expense"
                defaultChecked={preselectedType === "Expense"}
              />
              <label htmlFor="expense">Expense</label>
            </RadioOption>
          </RadioRow>
        </TypeGroup>

        <label htmlFor="category">Category:</label>
        <select
          id="category"
          name="category"
          defaultValue={categoryId || ""}
          required
        >
          <option value="">Select</option>

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
    cursor: pointer;
    margin-bottom: 0.8rem; // Abstand zw. Blöcken
    border-radius: 0.5rem; // abgerundete Ecken
    border: 0.07rem solid var(--button-hover-color);
    height: 1.5rem;

    // Firefox: wenn Feld angeklickt, kein blauer Rahmen:
    accent-color: var(--button-hover-color);
  }

  input[type="date"] {
    margin-bottom: 0; // letztes input-Feld kein Abstand zu ButtonContainer
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

  #income {
    accent-color: var(--income-color);
  }
  #expense {
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
