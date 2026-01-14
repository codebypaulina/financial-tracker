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
    <>
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

        <Wrapper>
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

          <FilterContainer>
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

            <ButtonContainer>
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
          </FilterContainer>
        </Wrapper>

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
            <Row key={transaction._id}>
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

                <p className="description">{transaction.description}</p>
                <p className="category">
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
            </Row>
          ))}
        </StyledList>
      </ContentContainer>

      <Navbar />
    </>
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

// ******************************************************************************

const ContentContainer = styled.div`
  padding: 20px 20px 83px 20px; // Nav 75px // Abstand Bildschirmrand
  max-width: 500px; // Breite von list
  margin: 0 auto; // content horizontal zentriert

  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
  }
`;

const ChartContainer = styled.div`
  height: 150px;
  width: 150px;
  margin: 0 auto; // horizontal zentriert
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column; // BalanceContainer + FilterContainer untereinander
  max-width: 300px; // schmaler als list
  margin: 0 auto 1.5rem auto; // Abstand list, horizontal zentriert
`;

const BalanceContainer = styled.div`
  align-self: flex-end; // rechts im Wrapper
  text-align: center; // content horizontal zentriert
  margin: 0 0.5rem 1rem 0; // Abstand rechter Rand + FilterContainer

  p.value {
    font-weight: bold;
  }
`;

const FilterContainer = styled.div`
  display: flex; // filter nebeneinander
  justify-content: space-between; // date-filter links, ButtonContainer rechts
`;

const IconWrapper = styled.div`
  background-color: var(--button-background-color);
  color: var(--button-text-color);
  width: 32px;
  height: 30px;
  border-radius: 10px;

  display: flex; // wegen Zentrierung von svg
  align-items: center; // vertikal zentriert
  justify-content: center; // horizontal zentriert

  cursor: pointer;
  box-shadow: 0 0 20px rgba(0, 0, 0, 1);

  svg {
    width: 20px;
    height: 20px;
    stroke-width: ${(props) => (props.className === "active" ? "2.3" : "1.8")};
  }

  &:hover {
    transform: scale(1.07);
    color: var(--primary-text-color);
  }

  &.active {
    background-color: var(--button-active-color);
    color: var(--button-active-text-color);
  }
`;

const ButtonContainer = styled.div`
  display: flex; // für gap
  gap: 1rem;

  button {
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    border: none;
    width: 90px;
    height: 30px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(0, 0, 0, 1);

    &:hover {
      transform: scale(1.04);
      color: var(--primary-text-color);
    }

    &.active {
      background-color: var(--button-active-color);
      color: var(--button-active-text-color);
    }
  }
`;

// ******************************************************************************

const StyledList = styled.ul`
  list-style-type: none;
  display: grid; //    date | ColorTag | description | category | amount
  grid-template-columns:
    minmax(33px, max-content) 5px minmax(60px, 1fr) minmax(0, max-content)
    74px;
  align-items: center; // content in der Zeile vertikal zentriert
  gap: 0.5rem;
`;

const Row = styled.li`
  display: contents; // childs direkte grid-items von StyledList
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  display: contents; // date, ColorTag, description, category, amount -> grid

  p {
    font-size: 0.8rem;
  }

  p.date {
    white-space: nowrap;
    overflow: hidden;
  }

  p.description {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p.category {
    font-size: 0.6rem;
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p.amount {
    text-align: right;
    font-weight: bold;
    white-space: nowrap;
  }

  &:hover {
    p {
      transform: scale(1.03);
      color: var(--primary-text-color);
    }

    p.description {
      transform-origin: left center; // sonst zu arg links
    }

    p.category {
      opacity: 1;
    }

    span {
      transform: scale(1.2);
    }
  }
`;

const ColorTag = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;

  background-color: ${(props) =>
    props.$filterType // wenn type-filter aktiv
      ? props.$categoryColor // dann category color
      : props.$transactionType === "Income" // type color (main view)
      ? "var(--income-color)"
      : "var(--expense-color)"};
`;
