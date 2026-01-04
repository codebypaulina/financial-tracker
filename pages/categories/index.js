import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// hier muss dynamischer Import, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function CategoriesPage() {
  const [filterState, setFilterState] = useState(null);

  useEffect(() => {
    const storedFilterState = sessionStorage.getItem("filterState");
    if (storedFilterState) {
      setFilterState(storedFilterState);
    }
  }, []);

  useEffect(() => {
    if (filterState) {
      sessionStorage.setItem("filterState", filterState);
    } else {
      sessionStorage.removeItem("filterState"); // vermeidet Probleme durch veraltete/leere Daten
    }
  }, [filterState]);

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

  // tooltip (%)
  const totalFilteredValue =
    filterState === "Expense" ? totalExpense : totalIncome;

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
    <PageWrapper>
      <ContentContainer>
        <h1>Categories</h1>

        {filteredChartData.length > 0 && (
          <ChartContainer>
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

        <StyledList>
          {filteredCategories
            .sort((a, b) => b.totalAmount - a.totalAmount) // nach totalAmount absteigend sortiert
            .map((category) => (
              <li
                key={category._id}
                $isNull={category.totalAmount <= 0}
                style={{
                  backgroundColor:
                    category.totalAmount <= 0
                      ? "#242424"
                      : "var(--list-item-background)",
                }}
              >
                <ColorTag
                  color={
                    filterState
                      ? category.color
                      : category.type === "Income"
                      ? "var(--income-color)"
                      : "var(--expense-color)"
                  }
                  $isNull={category.totalAmount <= 0}
                />

                <StyledLink
                  href={`/categories/${category._id}?from=/categories`} // Eintrittspunkt CategoryDetailsPage  ;  "?from/categories": CategoriesPage als Herkunft merken, um nach delete von category wieder hierhin zurück (anstatt zur jetzt gelöschten CategoryDetailsPage)
                  $isNull={category.totalAmount <= 0}
                >
                  <p>{category.name}</p>
                  <p className="amount">
                    {category.totalAmount.toLocaleString("de-DE", {
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
  padding: 20px 70px 75px 70px; // 75px: Nav

  h1 {
    margin-bottom: 20px;
  }

  @media (max-width: 600px) {
    padding: 20px 60px 75px 20px;
  }

  @media (max-width: 400px) {
    padding: 20px 40px 75px 40px;
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
  margin: 0 30px 0 0;

  @media (max-width: 600px) {
    margin: 0;
  }

  p.value {
    font-weight: bold;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  margin: 20px 0; // OK

  button {
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    border: none;
    border-radius: 20px;
    cursor: pointer;
    width: 90px;
    height: 30px;
    padding: 5px 10px; // OK

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

const StyledList = styled.ul`
  list-style-type: none;
  width: 100%;

  li {
    display: flex;
    align-items: center; // caontent vertikal zentriert
    justify-content: space-between;
    height: 40px;
    padding: 0 15px 0 15px;
    margin: 0 0 10px 0; // OK
    border-radius: 20px; // OK

    background-color: ${(props) =>
      props.$isNull ? "#5a5a5a" : "var(--list-item-background)"};

    @media (max-width: 400px) {
      padding: 8px 10px;
      height: 30px;
    }
  }
`;

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  width: 100%;
  border-radius: 30px;

  p {
    color: ${(props) =>
      props.$isNull ? "#5a5a5a" : "var(--secondary-text-color)"};
    // font-size: 0.75rem;

    @media (max-width: 400px) {
      font-size: 0.75rem;
    }
  }

  p.amount {
    text-align: right;
    font-weight: bold;
    margin-left: auto;
  }

  &:hover {
    font-weight: bold;

    p.amount {
      transform: scale(1.07);
    }
  }
`;

const ColorTag = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;

  background-color: ${(props) => props.color};
  opacity: ${(props) =>
    props.$isNull ? 0.15 : 1}; // geringere Deckkraft bei totalAmount <= 0

  @media (max-width: 600px) {
    width: 8px;
    height: 8px;
  }
`;
