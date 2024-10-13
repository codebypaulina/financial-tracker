import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { useState } from "react";

// hier muss dynamischer Import, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function CategoriesPage() {
  const [filterState, setFilterState] = useState(null);

  const { data: categories, error } = useSWR("/api/categories");
  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading...</h3>;

  // chart
  const totalIncome = categories
    .filter((category) => category.type === "Income")
    .reduce((sum, category) => sum + category.totalAmount, 0);

  const totalExpense = categories
    .filter((category) => category.type === "Expense")
    .reduce((sum, category) => sum + category.totalAmount, 0);

  const remainingIncome = totalIncome - totalExpense;

  // chartData basierend auf filterState
  const filteredChartData = filterState
    ? categories
        .filter(
          (category) =>
            category.totalAmount > 0 && category.type === filterState
        )
        .map((category) => ({
          id: category.id,
          label: category.name,
          value: category.totalAmount,
          color: category.color,
        }))
    : [
        {
          id: "Expenses",
          label: "Expenses",
          value: totalExpense,
          color: "var(--expense-color)",
        },
        {
          id: "Remaining Income",
          label: "Remaining Income",
          value: remainingIncome,
          color: "var(--income-color)",
        },
      ];

  // chart-tooltip (%)
  const totalFilteredValue =
    filterState === "Expense" ? totalExpense : totalIncome;

  // categories gefiltert nach type im filterState
  const filteredCategories = filterState
    ? categories.filter((category) => category.type === filterState)
    : categories;

  function toggleTypeFilter(type) {
    setFilterState((prevFilterState) =>
      prevFilterState === type ? null : type
    );
  }

  return (
    <>
      <h1>Categories</h1>
      <h2>
        Total Balance:{" "}
        {remainingIncome.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        €
      </h2>

      {filteredChartData.length > 0 && (
        <ChartSection>
          <ResponsivePie
            data={filteredChartData}
            colors={{ datum: "data.color" }} // nutzt definierte Kategorienfarben für Segmente
            innerRadius={0.5} // 50 % ausgeschnitten
            padAngle={2} // Abstand zwischen Segmenten
            cornerRadius={3} // rundere Ecken der Segmente
            arcLinkLabelsSkipAngle={360} // ausgeblendete Linien
            animate={false} // Segmente springen nicht
            enableArcLabels={false} // keine Zahlen im Segment
            tooltip={({ datum }) => {
              const percentage = (
                (datum.value / totalFilteredValue) *
                100
              ).toFixed(0);
              return (
                <div>
                  {datum.label}: <strong>{percentage} %</strong>
                </div>
              );
            }}
          />
        </ChartSection>
      )}

      <ButtonContainer>
        <button
          onClick={() => toggleTypeFilter("Income")}
          className={filterState === "Income" ? "active" : ""}
        >
          Incomes
        </button>
        <button
          onClick={() => toggleTypeFilter("Expense")}
          className={filterState === "Expense" ? "active" : ""}
        >
          Expenses
        </button>
      </ButtonContainer>

      <ul>
        {filteredCategories
          .sort((a, b) => b.totalAmount - a.totalAmount) // nach totalAmount absteigend sortiert
          .map((category) => (
            <StyledListItem
              key={category._id}
              $isNull={category.totalAmount <= 0}
            >
              <StyledLink href={`/categories/${category._id}`}>
                <strong>{category.name}</strong> | {category.type} |{" "}
                <span>
                  {category.totalAmount.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </span>
              </StyledLink>
            </StyledListItem>
          ))}
      </ul>

      <Navbar />
    </>
  );
}

const ChartSection = styled.div`
  height: 200px;
  width: 200px;
`;

const ButtonContainer = styled.div`
  margin: 10px 0;

  button {
    margin-right: 10px;
    padding: 5px 10px;
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    border: none;
    cursor: pointer;

    &.active {
      background-color: var(--button-active-color);
      color: var(--button-active-text-color);
    }
  }
`;

const StyledListItem = styled.li`
  color: ${(props) => (props.$isNull ? "#5a5a5a" : "inherit")};
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    font-weight: bold;
  }
`;
