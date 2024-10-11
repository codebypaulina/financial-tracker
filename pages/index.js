import LoginSection from "@/components/LoginSection";
import Navbar from "@/components/Navbar";
import useSWR from "swr";

export default function HomePage() {
  const { data: transactions, error } = useSWR("/api/transactions");

  if (error) return <h3>Failed to load transactions</h3>;
  if (!transactions) return <h3>Loading...</h3>;

  return (
    <>
      {/* <LoginSection /> */}
      <h1>Expenses</h1>

      <ul>
        {transactions.map((transaction) => (
          <li key={transaction._id}>
            {transaction.date.slice(0, 10)} |{" "}
            {transaction.category ? transaction.category.name : "No Category"} |{" "}
            {transaction.amount} €
          </li>
        ))}
      </ul>

      <Navbar />
    </>
  );
}
