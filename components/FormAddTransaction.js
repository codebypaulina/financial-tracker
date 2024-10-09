export default function FormAddTransaction() {
  return (
    <form>
      <label htmlFor="type">Type:</label>
      <input type="radio" id="income" name="type" value="Income" />
      <label htmlFor="income">Income</label>
      <input type="radio" id="expense" name="type" value="Expense" />
      <label htmlFor="expense">Expense</label>
      <br />

      <label htmlFor="category">Category:</label>
      <select id="category" name="category">
        <option value="">Select</option>
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

      <button type="button" name="cancel">
        Cancel
      </button>
      <button type="submit">Save</button>
    </form>
  );
}
