import { useRouter } from "next/router";
import useSWR from "swr";
import styled from "styled-components";
import Link from "next/link";

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
      <button onClick={() => router.back()}>Back</button>

      <h1>Category Details</h1>
      <h2>{category.name}</h2>

      {filteredTransactions.length === 0 ? (
        <p>No transactions in this category yet.</p>
      ) : (
        <ul>
          {filteredTransactions.map((transaction) => (
            <li key={transaction._id}>
              <StyledLink href={`/transactions/${transaction._id}`}>
                {transaction.date.slice(0, 10)} | {transaction.description} |{" "}
                {transaction.amount.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </StyledLink>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => router.push(`/adding?category=${id}`)}>
        Add Transaction
      </button>

      <button onClick={() => router.push(`/categories/${id}/edit`)}>
        Edit Category
      </button>
    </>
  );
}

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    font-weight: bold;
  }
`;
