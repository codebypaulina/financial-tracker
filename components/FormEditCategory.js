import useSWR from "swr";
import { useRouter } from "next/router";
import styled from "styled-components";

export default function FormEditCategory() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. category aus URL extrahiert

  const { data: category, error } = useSWR(id ? `/api/categories/${id}` : null); // category abrufen

  if (error) return <h3>Failed to load category</h3>;
  if (!category) return <h3>Loading...</h3>;

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
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log("UPDATING SUCCESSFUL! (category)");
        router.back(); // nach erfolgreichem Updaten der Kategorie zurück zur vorherigen Seite
      } else {
        throw new Error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category: ", error);
    }
  }

  // Delete-Button
  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category? This cannot be undone."
    );
    if (confirmed) {
      try {
        const response = await fetch(`/api/categories/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          console.log("DELETING SUCCESSFUL! (category)");
          router.back(); // nach Löschen zurück zur vorherigen Seite
        } else {
          throw new Error("Failed to delete category");
        }
      } catch (error) {
        console.error("Error deleting category: ", error);
      }
    }
  }

  return (
    <ContentContainer>
      <form onSubmit={handleSubmit}>
        <h1>Edit Category</h1>

        <label htmlFor="type">Type:</label>
        <RadioGroup>
          <input
            type="radio"
            id="income"
            name="type"
            value="Income"
            defaultChecked={category.type === "Income"}
          />
          <label htmlFor="income">Income</label>
          <input
            type="radio"
            id="expense"
            name="type"
            value="Expense"
            defaultChecked={category.type === "Expense"}
          />
          <label htmlFor="expense">Expense</label>
        </RadioGroup>

        <br />

        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" defaultValue={category.name} />
        <br />

        <label htmlFor="color">Color:</label>
        <input
          type="color"
          id="color"
          name="color"
          defaultValue={category.color}
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
  padding: 70px 70px 75px 70px; // 75px: Nav

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
