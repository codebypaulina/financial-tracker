import useSWR from "swr";
import { useRouter } from "next/router";
import styled from "styled-components";

export default function FormEditTransaction() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. transaction aus URL extrahiert

  const { data: transaction, error: errorTransaction } = useSWR(
    id ? `/api/transactions/${id}` : null
  ); // transaction abrufen
  const { data: categories, error: errorCategories } =
    useSWR("/api/categories"); // für Dropdown, damit Kategorien zur Auswahl abgerufen werden

  if (errorTransaction || errorCategories) return <h3>Failed to load data</h3>;
  if (!transaction || !categories) return <h3>Loading...</h3>;

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
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("UPDATING SUCCESSFUL! (transaction)");
        router.back(); // nach erfolgreichem Updaten der Transaktion zurück zur vorherigen Seite
      } else {
        throw new Error("Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction: ", error);
    }
  }

  // Delete-Button
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction? This cannot be undone."
    );
    if (confirmed) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          console.log("DELETING SUCCESSFUL! (transaction)!");
          router.back(); // nach Löschen zurück zur vorherigen Seite
        } else {
          throw new Error("Failed to delete transaction");
        }
      } catch (error) {
        console.error("Error deleting transaction: ", error);
      }
    }
  }

  return (
    <ContentContainer>
      <form onSubmit={handleSubmit}>
        <h1>Edit Transaction</h1>

        <label htmlFor="type">Type:</label>
        <RadioGroup>
          <input
            type="radio"
            id="income"
            name="type"
            value="Income"
            defaultChecked={transaction.type === "Income"}
          />
          <label htmlFor="income">Income</label>
          <input
            type="radio"
            id="expense"
            name="type"
            value="Expense"
            defaultChecked={transaction.type === "Expense"}
          />
          <label htmlFor="expense">Expense</label>
        </RadioGroup>
        <br />

        <label htmlFor="category">Category:</label>
        <select
          id="category"
          name="category"
          defaultValue={transaction.category._id}
        >
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <br />

        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          name="description"
          defaultValue={transaction.description}
        />
        <br />

        <label htmlFor="amount">Amount:</label>
        <input
          type="number"
          id="amount"
          name="amount"
          defaultValue={transaction.amount}
        />
        <br />

        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          defaultValue={transaction.date.slice(0, 10)} // nimmt nur erste 10 Zeichen aus Datum-String: YYYY-MM-DD
        />
        <br />

        <ButtonContainer>
          <button type="button" onClick={handleDelete}>
            Delete
          </button>
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
  padding: 70px 20px 75px 20px;

  form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  h1 {
    text-align: center;
    margin-bottom: 20px;
  }

  label,
  input {
    width: 70%;
    max-width: 400px;
  }

  label {
    font-weight: bold;
    margin: 5px 0 5px 0;
  }

  select {
    width: 70%;
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
    margin: 30px 5px;
    padding: 5px 10px;
    transition: transform 0.2s;
    background-color: var(--button-text-color);
    color: var(--button-background-color);

    &:hover {
      transform: scale(1.07);
      font-weight: bold;
    }
  }
`;
