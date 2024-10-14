import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { useState } from "react";

// dynamisch, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState(null);
  const [filterDate, setFilterDate] = useState({ from: null, to: null });
  const [showDateFilter, setShowDateFilter] = useState(false); // für Popup

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

  // tooltip (%)
  const totalFilteredValue =
    filterType === "Expense" ? totalExpense : totalIncome;

  // chartData basierend auf filterType
  const chartData = filterType
    ? categories
        .filter(
          (category) => category.totalAmount > 0 && category.type === filterType
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

  // transactions gefiltert nach filterType & filterDate
  const filteredTransactions = transactions.filter(
    (transaction) =>
      (!filterType || transaction.type === filterType) &&
      (!filterDate.from ||
        new Date(transaction.date) >= new Date(filterDate.from)) &&
      (!filterDate.to || new Date(transaction.date) <= new Date(filterDate.to))
  );

  function toggleTypeFilter(type) {
    setFilterType((prevFilterType) => (prevFilterType === type ? null : type));
  }

  function toggleDateFilterPopup() {
    setShowDateFilter((prevState) => !prevState);
    // wenn Popup geöffnet, from/to aktuelles Datum, falls leer
    if (!showDateFilter && (!filterDate.from || !filterDate.to)) {
      const today = new Date().toISOString().split("T")[0];
      setFilterDate({ from: today, to: today }); // direkt zu filterDate
    }
  }

  function handleDateChange(event) {
    const { name, value } = event.target;
    setFilterDate((prev) => ({ ...prev, [name]: value })); // filterDate ändern
  }

  function applyDateFilter() {
    setShowDateFilter(false); // Popup nach "OK" zu
  }

  function clearDateFilter() {
    setFilterDate({ from: null, to: null }); // from/to zurück
  }

  return (
    <ContentContainer>
      <h1>Transactions</h1>

      {chartData.length > 0 && (
        <ChartContainer>
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
        </ChartContainer>
      )}

      <BalanceContainer>
        <p>Total Balance</p>
        <p className="value">
          {remainingIncome.toLocaleString("de-DE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          €
        </p>
      </BalanceContainer>

      <ButtonContainer>
        <button onClick={toggleDateFilterPopup}>Date</button>

        <button
          onClick={() => toggleTypeFilter("Income")}
          className={filterType === "Income" ? "active" : ""}
        >
          Incomes
        </button>
        <button
          onClick={() => toggleTypeFilter("Expense")}
          className={filterType === "Expense" ? "active" : ""}
        >
          Expenses
        </button>
      </ButtonContainer>

      {showDateFilter && (
        <>
          <Overlay onClick={toggleDateFilterPopup} />

          <DateFilterPopup>
            <label htmlFor="from">From:</label>
            <input
              type="date"
              id="from"
              name="from"
              value={filterDate.from || ""} // vorherige Auswahl oder leer
              onChange={handleDateChange}
            />
            <label htmlFor="to">To:</label>
            <input
              type="date"
              id="to"
              name="to"
              value={filterDate.to || ""} // vorherige Auswahl oder leer
              onChange={handleDateChange}
            />

            {/* <button onClick={applyDateFilter}>OK</button> */}
            <button onClick={clearDateFilter}>Clear</button>
          </DateFilterPopup>
        </>
      )}

      <StyledList>
        {filteredTransactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((transaction) => (
            <li key={transaction._id}>
              <StyledLink href={`/transactions/${transaction._id}`}>
                <p>{transaction.date.slice(0, 10)}</p>
                <ColorTag
                  color={
                    filterType
                      ? transaction.category
                        ? transaction.category.color // prüft, ob Kategorie existiert (Fehlervermeidug!)
                        : "#RED" // Fallback-Farbe, wenn keine
                      : transaction.type === "Income"
                      ? "var(--income-color)"
                      : "var(--expense-color)"
                  }
                />
                <p>{transaction.description}</p>
                <p>
                  {transaction.category
                    ? transaction.category.name
                    : "No Category"}
                </p>
                <p className="amount">
                  {transaction.amount.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </p>
              </StyledLink>
            </li>
          ))}
      </StyledList>

      <Navbar />
    </ContentContainer>
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6); // abgedunkelt
  z-index: 9; // Popup über content
`;

const DateFilterPopup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--button-background-color);
  color: var(--button-text-color);
  padding: 20px;
  border-radius: 15px;
  z-index: 10; // Popup über Overlay
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;

  button {
    background-color: var(--button-active-color);
    color: var(--button-active-text-color);
    width: 50px;
    height: 30px;
    padding: 5px 10px;
    border-radius: 10px;
    border: none;
    cursor: pointer;

    &:hover {
      transform: scale(1.07);
      font-weight: bold;
    }
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column; // untereinander
  align-items: center; // content zentriert
  padding: 20px 20px 75px 20px; // 75px: Nav
  // margin: 0 auto;

  h1 {
    margin-bottom: 20px;
  }
`;

const ChartContainer = styled.div`
  height: 200px;
  width: 200px;
`;

const BalanceContainer = styled.div`
  align-self: flex-end; // rechts im ContentContainer, nicht zentriert
  display: flex;
  flex-direction: column;
  align-items: center;

  p.value {
    font-weight: bold;
  }
`;

const ButtonContainer = styled.div`
  align-self: flex-end; // rechts im ContentContainer, nicht zentriert
  margin: 20px 0;

  button {
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    border: none;
    border-radius: 20px;
    cursor: pointer;
    width: 90px;
    height: 30px;
    padding: 5px 10px;

    &:hover {
      transform: scale(1.07);
      font-weight: bold;
    }

    &.active {
      background-color: var(--button-active-color);
      color: var(--button-active-text-color);
      font-weight: bold;
    }
  }

  button:first-child {
    margin-right: 10px;
  }
`;

const StyledList = styled.ul`
  list-style-type: none;
  width: 100%;
  max-width: 800px;

  li {
    background-color: var(--list-item-background);
    min-width: 500px; // wg. content
    padding: 10px 15px;
    margin: 10px 0;
    border-radius: 20px;
  }
`;

const StyledLink = styled(Link)`
  display: grid;
  grid-template-columns: 90px 20px 1fr 1fr 100px; // NICHT mehr ändern!
  gap: 10px;
  align-items: center; // wg. ColorTag
  text-decoration: none;

  p.amount {
    text-align: right;
    font-weight: bold;
  }

  &:hover {
    font-weight: bold;

    span,
    p.amount {
      transform: scale(1.07);
    }
  }
`;

const ColorTag = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  justify-self: center;
  margin-right: 7px;

  background-color: ${(props) => props.color};
`;
