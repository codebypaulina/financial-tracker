// import LoginSection from "@/components/LoginSection";
import Navbar from "@/components/Navbar";
import useSWR from "swr";
import EyeIcon from "../public/icons/eye.svg";
import Link from "next/link";
import styled from "styled-components";

export default function HomePage() {
  const { data: transactions, error } = useSWR("/api/transactions");

  if (error) return <h3>Failed to load transactions</h3>;
  if (!transactions) return <h3>Loading...</h3>;

  const expenses = transactions.filter(
    (transaction) => transaction.type === "Expense"
  );

  return (
    <>
      {/* <LoginSection /> */}
      <h1>Expenses</h1>

      <ul>
        {expenses.map((expense) => (
          <li key={expense._id}>
            <StyledLink href={`/categories/${expense.category?._id}`}>
              {expense.category ? expense.category.name : "No Category"} |{" "}
              {expense.amount} €
            </StyledLink>{" "}
            <EyeIcon width={17} height={17} />
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
