import { useRouter } from "next/router";
import styled from "styled-components";

export default function FormAddCategory() {
  const router = useRouter();

  // Cancel-Button
  function handleCancel() {
    router.back(); // zurück zur vorherigen Seite (nochmal überdenken, ob er nicht lieber Formular clearen soll & zustätzl. X-Button dafür implemetieren)
  }

  // Save-Button
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
        console.log("ADDING SUCCESSFULL! (category)");
        router.back(); // nach erfolgreichem Hinzufügen neuer Kategorie zurück zur vorherigen Seite
      } else {
        throw new Error("Failed to add new category");
      }
    } catch (error) {
      console.error("Error adding new category: ", error);
    }
  }

  return (
    <ContentContainer>
      <form onSubmit={handleSubmit}>
        <h1>Add Category</h1>

        <label htmlFor="type">Type:</label>
        <RadioGroup>
          <input type="radio" id="income" name="type" value="Income" />
          <label htmlFor="income">Income</label>
          <input type="radio" id="expense" name="type" value="Expense" />
          <label htmlFor="expense">Expense</label>
        </RadioGroup>
        <br />

        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" placeholder="..." />
        <br />

        <label htmlFor="color">Color:</label>
        <input type="color" id="color" name="color" defaultValue="#ffffff" />
        <br />

        <ButtonContainer>
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </ButtonContainer>
      </form>
    </ContentContainer>
  );
}

const ContentContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px 90px 10px;

  form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h1 {
    text-align: center;
    margin-bottom: 10px;
  }

  label,
  input {
    width: 70%;
    max-width: 400px;
  }

  label {
    font-weight: bold;
    margin: 0 0 5px 0;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  align-items: center;
  width: 70%;

  input[type="radio"] {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 8px;
    cursor: pointer;
    position: relative;
  }

  label {
    margin-right: 20px;
    color: var(--text-color);
    font-size: 0.85rem;
  }
`;

const ButtonContainer = styled.div`
  button {
    border: none;
    border-radius: 20px;
    cursor: pointer;
    width: 70px;
    height: 30px;
    margin: 10px 7px 0 7px;
    padding: 5px 10px;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.07);
      font-weight: bold;
    }
  }
`;
