import useSWR from "swr";
import { useRouter } from "next/router";

export default function FormAddTransaction() {
  const router = useRouter();
  const { data: categories, error } = useSWR("/api/categories");

  if (error) return <div>Failed to load categories</div>;
  if (!categories) return <div>Loading...</div>;

  function handleCancel() {
    router.back(); // zurück zur vorherigen Seite
  }

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
        console.log("Added new transaction successfully");
      } else {
        throw new Error("Failed to add new transaction");
      }

      router.back(); // nach erfolgreichem Erstellen neuer Transaktion zurück zur vorherigen Seite
    } catch (error) {
      console.error("Error adding new transaction: ", error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Add Transaction</h1>

      <label htmlFor="type">Type:</label>
      <input type="radio" id="income" name="type" value="Income" />
      <label htmlFor="income">Income</label>
      <input type="radio" id="expense" name="type" value="Expense" />
      <label htmlFor="expense">Expense</label>
      <br />

      <label htmlFor="category">Category:</label>
      <select id="category" name="category">
        <option value="">Select</option>

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
        placeholder="..."
      />
      <br />

      <label htmlFor="amount">Amount:</label>
      <input type="number" id="amount" name="amount" placeholder="0,00 €" />
      <br />

      <label htmlFor="date">Date:</label>
      <input type="date" id="date" name="date" />
      <br />

      <button type="button" onClick={handleCancel}>
        Cancel
      </button>
      <button type="submit">Save</button>
    </form>
  );
}
