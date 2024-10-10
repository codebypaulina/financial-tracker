import useSWR from "swr";
import { useRouter } from "next/router";

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

  console.log("TRANSACTION: ", transaction);

  return (
    <form>
      <h2>Edit Transaction</h2>

      <label htmlFor="type">Type:</label>
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
      <input type="date" id="date" name="date" />
      <br />

      <button type="button">Delete</button>
      <button type="button" onClick={handleCancel}>
        Cancel
      </button>
      <button type="submit">Save</button>
    </form>
  );
}
