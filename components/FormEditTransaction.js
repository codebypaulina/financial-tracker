import useSWR from "swr";

export default function FormEditTransaction() {
  const { data: categories, error } = useSWR("/api/categories"); // für Dropdown, damit Kategorien zur Auswahl abgerufen werden

  if (error) return <div>Failed to load categories</div>;
  if (!categories) return <div>Loading...</div>;

  return (
    <form>
      <h2>Edit Transaction</h2>

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

      <button type="button">Delete</button>
      <button type="button">Cancel</button>
      <button type="submit">Save</button>
    </form>
  );
}
