import { useRouter } from "next/router";
import useSWR from "swr";
import Navbar from "@/components/Navbar";

export default function CategoryDetailsPage() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. category aus URL extrahiert

  const { data: category, error: errorCategory } = useSWR(
    id ? `/api/categories/${id}` : null
  );
  const { data: transactions, error: errorTransactions } =
    useSWR("/api/transactions");

  if (errorCategory || errorTransactions) return <h3>Failed to load data</h3>;
  if (!category || !transactions) return <h3>Loading...</h3>;

  const filteredTransactions = transactions.filter(
    (transaction) => transaction.category?._id === id
  );

  return (
    <>
      <h2>Category Details: {category.name}</h2>

      <ul>
        {filteredTransactions.map((transaction) => (
          <li key={transaction._id}>
            {transaction.date.slice(0, 10)} | {transaction.description} |{" "}
            {transaction.amount} €
          </li>
        ))}
      </ul>

      <Navbar />
    </>
  );
}
