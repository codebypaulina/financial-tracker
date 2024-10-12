import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";

// hier muss dynamischer Import, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function CategoriesPage() {
  const { data: categories, error } = useSWR("/api/categories");

  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading...</h3>;

  // chart
  const totalIncome = categories
    .filter((category) => category.type === "Income")
    .reduce((sum, category) => sum + (category.totalAmount || 0), 0);

  const totalExpense = categories
    .filter((category) => category.type === "Expense")
    .reduce((sum, category) => sum + (category.totalAmount || 0), 0);

  const chartData = [
    {
      id: "Income",
      label: "Income",
      value: totalIncome,
      color: "#B4E5A2",
    },
    {
      id: "Expense",
      label: "Expense",
      value: totalExpense,
      color: "#FF9393",
    },
  ];

  return (
    <>
      <h1>Categories</h1>

      <ul>
        {categories.map((category) => (
          <li key={category._id}>
            <StyledLink href={`/categories/${category._id}`}>
              <strong>{category.name}</strong> | {category.type} |{" "}
              <span>{category.totalAmount || 0} €</span>
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
