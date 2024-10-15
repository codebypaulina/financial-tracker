import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { useState } from "react";
import DateFilterIcon from "@/public/icons/date-filter.svg";

// dynamisch, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function TransactionsPage() {
  const [filterType, setFilterType] = useState(null);
  const [filterDate, setFilterDate] = useState({ from: null, to: null });
  const [showDateFilter, setShowDateFilter] = useState(false); // Popup date-filter

  const { data: transactions, error: errorTransactions } =
    useSWR("/api/transactions");
  const { data: categories, error: errorCategories } =
    useSWR("/api/categories");

  if (errorTransactions || errorCategories) return <h3>Failed to load data</h3>;
  if (!transactions || !categories) return <h3>Loading...</h3>;

  // *** SORTIERTE transactions ***
  // erst transactions nach Datum absteigend sortieren
  // (Date-Objekt: nimmt sonst aktuelles Datum nicht mit rein)
  const sortedTransactions = transactions.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // *** SORTIERTE & GEFILTERTE transactions ***
  // danach auf sortedTransactions type- & date-filter anwenden
  const filteredTransactions = sortedTransactions.filter((transaction) => {
    const typeMatches = !filterType || transaction.type === filterType; // type-filter

    const transactionDate = new Date(transaction.date);
    const fromDate = filterDate.from ? new Date(filterDate.from) : null;
    const toDate = filterDate.to ? new Date(filterDate.to) : null;

    const dateMatches =
      (!fromDate || transactionDate >= fromDate) &&
      (!toDate || transactionDate <= toDate); // date-filter

    return typeMatches && dateMatches;
  });

  // *** SORTIERTE & GEFILTERTE categories mit totalAmount ***
  // totalAmounts pro category basierend auf filteredTransactions summieren
  const categoriesWithAmounts = categories.map((category) => {
    const totalAmount = filteredTransactions
      .filter(
        (transaction) =>
          transaction.category &&
          transaction.category._id.toString() === category._id.toString() // !!
      ) // nur die ta filtern, die dieser ca zugehören
      .reduce((sum, transaction) => sum + transaction.amount, 0); // amounts dieser ta summieren

    return { ...category, totalAmount }; // ca mit totalAmount
  });

  // chartData basierend auf filterType
  const chartData = filterType
    ? categoriesWithAmounts
        .filter(
          (category) => category.totalAmount > 0 && category.type === filterType
        ) // keine leeren & mit passendem type
        .map((category) => ({
          id: category._id,
          label: category.name,
          value: category.totalAmount,
          color: category.color,
        }))
    : [
        {
          id: "Expenses",
          label: "Expenses",
          value: categoriesWithAmounts
            .filter((category) => category.type === "Expense")
            .reduce((sum, category) => sum + category.totalAmount, 0), // total expenses
          color: "var(--expense-color)",
        },
        {
          id: "Remaining Income",
          label: "Remaining Income",
          value:
            categoriesWithAmounts
              .filter((category) => category.type === "Income")
              .reduce((sum, category) => sum + category.totalAmount, 0) -
            categoriesWithAmounts
              .filter((category) => category.type === "Expense")
              .reduce((sum, category) => sum + category.totalAmount, 0), // remaining income = total incomes - total expenses
          color: "var(--income-color)",
        },
      ];

  // für tooltip %: Basis type
  const totalFilteredValue = chartData.reduce(
    (sum, data) => sum + data.value,
    0
  );

  // für Popup from/to: ungefilterte list
  const earliestDate =
    transactions[transactions.length - 1]?.date.split("T")[0]; // neuste transaction
  const latestDate = transactions[0]?.date.split("T")[0]; // älterste transaction

  function toggleTypeFilter(type) {
    setFilterType((prevFilterType) => (prevFilterType === type ? null : type));
  }

  function toggleDateFilterPopup() {
    setShowDateFilter((prevState) => !prevState);

    // Popup from/to default: falls bereits eingestellte Werte gibt, dann diese, ansonsten ungefilterte list
    if (!showDateFilter) {
      setFilterDate((prev) => ({
        from: prev.from ?? earliestDate,
        to: prev.to ?? latestDate,
      }));
    }
  }

  function handleDateChange(event) {
    const { name, value } = event.target;
    setFilterDate((prev) => ({ ...prev, [name]: value }));
  }

  function clearDateFilter() {
    setFilterDate({ from: null, to: null });
  }

  // Total Balance basierend auf type-filter
  const totalBalanceLabel =
    filterType === "Income"
      ? "Total Incomes"
      : filterType === "Expense"
      ? "Total Expenses"
      : "Total Balance";

  const totalBalanceValue = categoriesWithAmounts
    .filter((category) => (filterType ? category.type === filterType : true))
    .reduce(
      (sum, category) =>
        sum +
        category.totalAmount *
          (category.type === "Expense" && !filterType ? -1 : 1),
      0
    );

  return (
    <PageWrapper>
      <ContentContainer>
        <h1>Transactions</h1>

        {chartData.length > 0 && (
          <ChartContainer>
            <ResponsivePie
              data={chartData}
              colors={{ datum: "data.color" }}
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
          <p>{totalBalanceLabel}</p>
          <p className="value">
            {totalBalanceValue.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </BalanceContainer>

        <ButtonContainer>
          {/* <button
          onClick={toggleDateFilterPopup}
          className={
            (filterDate.from !== earliestDate ||
              filterDate.to !== latestDate) &&
            filterDate.from &&
            filterDate.to
              ? "active"
              : ""
          }
        >
          <DateFilterIcon />
        </button> */}
          <IconWrapper
            onClick={toggleDateFilterPopup}
            className={
              (filterDate.from !== earliestDate ||
                filterDate.to !== latestDate) &&
              filterDate.from &&
              filterDate.to
                ? "active"
                : ""
            }
          >
            <DateFilterIcon />
          </IconWrapper>

          <button
            onClick={() => toggleTypeFilter("Income")}
            className={filterType === "Income" ? "active" : "incomes"}
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

              <button onClick={clearDateFilter}>Clear</button>
            </DateFilterPopup>
          </>
        )}

        <StyledList>
          {filteredTransactions.map((transaction) => (
            <li key={transaction._id}>
              <StyledLink href={`/transactions/${transaction._id}`}>
                <p className="date">
                  {new Date(transaction.date).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>

                <ColorTag
                  $filterType={filterType}
                  $transactionType={transaction.type}
                  $categoryColor={
                    transaction.category ? transaction.category.color : "BLACK"
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
    </PageWrapper>
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

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column; // vertikal angeordnet
  align-items: center; // ContentContainer vertikal zentriert
  width: 100%;
  height: 100vh; // gesamte Höhe von Viewport
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 800px; // wegen list & buttons
  margin: 0 auto; // content horizontal zentriert
  display: flex;
  flex-direction: column; // content untereinander
  align-items: center; // content zentriert
  padding: 20px 20px 75px 20px; // 75px: Nav

  h1 {
    margin-bottom: 20px;
  }
`;

const ChartContainer = styled.div`
  height: 200px;
  width: 200px;

  @media (max-width: 600px) {
    height: 150px;
    width: 150px;
  }
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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

  button:nth-of-type(2) {
    margin-left: 20px; // expenses-button
  }
`;

const IconWrapper = styled.div`
  margin-right: auto; // links von liste
  background-color: var(--button-background-color);
  color: var(--button-text-color);
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    stroke-width: ${(props) => (props.className === "active" ? "2.3" : "1.5")};

    &:hover {
      stroke-width: 2.3;
    }
  }

  &:hover {
    transform: scale(1.07);
  }

  &.active {
    background-color: var(--button-active-color);
    color: var(--button-active-text-color);
  }
`;

const StyledList = styled.ul`
  list-style-type: none;
  width: 100%;
  // max-width: 600px; // ist zu ContentContainer ausgelagert

  li {
    background-color: var(--list-item-background);
    padding: 10px 15px;
    margin: 10px 0;
    border-radius: 20px;

    // min-width: 500px; // wg. content
    min-width: 0;

    @media (max-width: 600px) {
      padding: 8px 10px;
    }
  }
`;

const StyledLink = styled(Link)`
  display: grid;
  grid-template-columns: 90px 20px 1fr 1fr 100px; // Desktop: NICHT mehr ändern!
  gap: 5px;
  align-items: center; // wg. ColorTag
  text-decoration: none;

  @media (max-width: 600px) {
    grid-template-columns:
      minmax(65px, auto) 10px minmax(90px, 1fr) minmax(72px, 1fr)
      70px;
    gap: 2px;

    p {
      font-size: 0.75rem;
    }
  }

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

  background-color: ${(props) =>
    props.$filterType // wenn type-filter aktiv
      ? props.$categoryColor // dann category color
      : props.$transactionType === "Income" // main view: type color
      ? "var(--income-color)"
      : "var(--expense-color)"};

  @media (max-width: 600px) {
    width: 8px;
    height: 8px;
  }
`;
