import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";

export default function TransactionsPage() {
  const { data: transactions, error } = useSWR("/api/transactions");

  if (error) return <h3>Failed to load transactions</h3>;
  if (!transactions) return <h3>Loading...</h3>;

  return (
    <>
      <h1>Transactions</h1>

      <ul>
        {transactions.map((transaction) => (
          <li key={transaction._id}>
            <StyledLink href={`/transactions/${transaction._id}`}>
              <strong>{transaction.type}</strong> | {transaction.amount} € |{" "}
              {transaction.description} |{" "}
              <span>
                {transaction.category
                  ? transaction.category.name
                  : "No Category"}
              </span>
            </StyledLink>
          </li>
        ))}
      </ul>

      <Navbar />
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
