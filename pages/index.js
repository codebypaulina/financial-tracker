// import LoginSection from "@/components/LoginSection";
import Navbar from "@/components/Navbar";
import useSWR from "swr";
import EyeIcon from "../public/icons/eye.svg";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";

const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function HomePage() {
  const { data: categories, error } = useSWR("/api/categories");

  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading...</h3>;

  const expenseCategories = categories.filter(
    (category) => category.type === "Expense"
  );

  // sortiert Liste absteigend nach totalAmount
  expenseCategories.sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <>
      {/* <LoginSection /> */}
      <h1>Expenses</h1>

      <ul>
        {expenseCategories.map((category) => (
          <li key={category._id}>
            <StyledLink href={`/categories/${category._id}`}>
              {category.name} | {category.totalAmount} €
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
