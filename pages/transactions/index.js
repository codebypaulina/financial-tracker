import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";

// dynamisch, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function TransactionsPage() {
  const { data: transactions, error: errorTransactions } =
    useSWR("/api/transactions");
  const { data: categories, error: errorCategories } =
    useSWR("/api/categories");

  if (errorTransactions || errorCategories) return <h3>Failed to load data</h3>;
  if (!transactions || !categories) return <h3>Loading...</h3>;

  // chart
  const totalIncome = categories
    .filter((category) => category.type === "Income")
    .reduce((sum, category) => sum + category.totalAmount, 0);

  const totalExpense = categories
    .filter((category) => category.type === "Expense")
    .reduce((sum, category) => sum + category.totalAmount, 0);

  const remainingIncome = totalIncome - totalExpense;

  const chartData = [
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

  return (
    <>
      <h1>Transactions</h1>
      <h2>
        Total Balance:{" "}
        {remainingIncome.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        €
      </h2>

      {chartData.length > 0 && (
        <ChartSection>
          <ResponsivePie
            data={chartData}
            colors={{ datum: "data.color" }} // nutzt definierte Farben für Segmente
            innerRadius={0.5} // 50 % ausgeschnitten
            padAngle={2} // Abstand zwischen Segmenten
            cornerRadius={3} // rundere Ecken der Segmente
            arcLinkLabelsSkipAngle={360} // ausgeblendete Linien
            animate={false} // Segmente springen nicht
            enableArcLabels={false} // keine Zahlen im Segment
            tooltip={({ datum }) => {
              const percentage = ((datum.value / totalIncome) * 100).toFixed(0);
              return (
                <div>
                  {datum.label}: <strong>{percentage} %</strong>
                </div>
              );
            }}
          />
        </ChartSection>
      )}

      <ul>
        {transactions.map((transaction) => (
          <li key={transaction._id}>
            <StyledLink href={`/transactions/${transaction._id}`}>
              {transaction.date.slice(0, 10)} |{" "}
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

const ChartSection = styled.div`
  height: 200px;
  width: 200px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    font-weight: bold;
  }
`;
