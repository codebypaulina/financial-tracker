import { useRouter } from "next/router";

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
    <form onSubmit={handleSubmit}>
      <h2>Add Category</h2>

      <label htmlFor="type">Type:</label>
      <input type="radio" id="income" name="type" value="Income" />
      <label htmlFor="income">Income</label>
      <input type="radio" id="expense" name="type" value="Expense" />
      <label htmlFor="expense">Expense</label>
      <br />

      <label htmlFor="name">Name:</label>
      <input type="text" id="name" name="name" placeholder="..." />
      <br />

      <label htmlFor="color">Color:</label>
      <input type="color" id="color" name="color" defaultValue="#ffffff" />
      <br />

      <button type="button" onClick={handleCancel}>
        Cancel
      </button>
      <button type="submit">Save</button>
    </form>
  );
}
