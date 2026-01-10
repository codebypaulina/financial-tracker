import { useRouter } from "next/router";
import styled from "styled-components";

export default function FormAddCategory({ onCancel }) {
  const router = useRouter();

  // cancel-button
  function handleCancel() {
    onCancel(); // zurück zu AddingPage (selection view)
  }

  // save-button
  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("ADDING SUCCESSFUL! (category)");
        router.back(); // nach erfolgreichem Hinzufügen neuer category zurück zur vorherigen page
      } else {
        throw new Error(
          `Failed to add new category (status: ${response.status})`
        );
      }
    } catch (error) {
      console.error("Error adding new category: ", error);
    }
  }

  return (
    <PageWrapper>
      <FormContainer onSubmit={handleSubmit}>
        <h1>Add Category</h1>

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
                required
              />
              <label htmlFor="income">Income</label>
            </RadioOption>

            <RadioOption>
              <input type="radio" id="expense" name="type" value="Expense" />
              <label htmlFor="expense">Expense</label>
            </RadioOption>
          </RadioRow>
        </TypeGroup>

        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" placeholder=" ..." required />

        <label htmlFor="color">Color:</label>
        <input
          type="color"
          id="color"
          name="color"
          defaultValue="#ffffff"
          required
        />

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

  input[type="text"],
  input[type="color"] {
    border-radius: 0.5rem; // abgerundete Ecken
    border: 0.07rem solid var(--button-hover-color);
    height: 1.5rem;
  }

  input[type="text"] {
    margin-bottom: 0.8rem; // Abstand zu Color

    // Firefox: wenn Feld angeklickt, kein blauer Rahmen:
    accent-color: var(--button-hover-color);
  }

  input[type="color"] {
    cursor: pointer;
    width: 100%; // auch so breit wie container
  }

  /*********************** Chrome ***********************/

  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0; // hässliches weißes padding weg
  }

  input[type="color"]::-webkit-color-swatch {
    border: none; // grauer innerer Rahmen weg
  }

  /******************************************************/
`;

const TypeGroup = styled.div`
  display: flex; // Type & RadioRow in einer Reihe
  flex-wrap: wrap; // Umbruch von Type & RadioRow, wenn nicht genug Platz
  margin-bottom: 1rem; // Abstand zu Name

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
