import useSWR from "swr";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import styled from "styled-components";
import Navbar from "@/components/Navbar";
import ChartIcon from "@/public/icons/chart.svg";

// hier muss dynamischer Import, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function CategoriesPage() {
  const [typeFilter, setTypeFilter] = useState(null);
  const [isChartOpen, setIsChartOpen] = useState(false);

  // *** [ session storage ] ***************************************************************
  // *** [ 1. CHART-state ] ****************************************************************
  // *** [abrufen]
  useEffect(() => {
    // holt gespeicherten key aus storage (state = true / null)
    const storedChartState = sessionStorage.getItem("categories:isChartOpen");

    // wenn key existiert -> state = true
    if (storedChartState) setIsChartOpen(true);
  }, []); // läuft nur 1x bei 1. render

  // *** [speichern]: bei Änderung
  useEffect(() => {
    // (nur) wenn state = true -> key in storage speichern
    if (isChartOpen) {
      sessionStorage.setItem("categories:isChartOpen", "true");
    } else {
      // ansonsten key löschen (damit default = false)
      sessionStorage.removeItem("categories:isChartOpen");
    }
  }, [isChartOpen]); // läuft nur, wenn sich state ändert (= true)

  // *** [ 2. TYPE-filter ] ****************************************************************
  // *** [abrufen]
  useEffect(() => {
    const storedTypeFilter = sessionStorage.getItem("categories:typeFilter");
    if (storedTypeFilter !== "Income" && storedTypeFilter !== "Expense") return;

    setTypeFilter(storedTypeFilter);
  }, []);

  // *** [speichern]
  useEffect(() => {
    if (typeFilter) {
      sessionStorage.setItem("categories:typeFilter", typeFilter);
    } else {
      sessionStorage.removeItem("categories:typeFilter");
    }
  }, [typeFilter]);

  // ***************************************************************************************

  // *** [ fetch ]
  const { data: categories, error } = useSWR("/api/categories");

  // *** [ guards ]
  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading ...</h3>;

  // *** [ abgeleitete Daten ] *************************************************************
  // *** [ 1. CATEGORIES ] sortieren & filtern *********************************************
  // *** [sortieren]: nach total amount absteigend
  const sortedCategories = [...categories].sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  // *** [filtern]: type-filter auf sortedCategories
  const filteredCategories = typeFilter
    ? sortedCategories.filter((category) => category.type === typeFilter)
    : sortedCategories;

  // *** [ 2. CHART ] **********************************************************************
  // *** [totals]
  const totalIncome = sortedCategories
    .filter((category) => category.type === "Income")
    .reduce((sum, category) => sum + category.totalAmount, 0);

  const totalExpense = sortedCategories
    .filter((category) => category.type === "Expense")
    .reduce((sum, category) => sum + category.totalAmount, 0);

  const remainingIncome = totalIncome - totalExpense;

  // *** [chart-data] values aus totals
  const chartData = typeFilter
    ? filteredCategories
        .filter((category) => category.totalAmount > 0)
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

  // *** [tooltip %] aus chart-data
  const chartTotalValue = chartData.reduce(
    (sum, segment) => sum + segment.value,
    0
  );

  function getChartPercentage(value) {
    if (!chartTotalValue) return 0;
    return Math.round((value / chartTotalValue) * 100);
  }

  // ***************************************************************************************

  function toggleChart() {
    setIsChartOpen((prevState) => !prevState);
  }

  function toggleTypeFilter(type) {
    setTypeFilter((prevState) => (prevState === type ? null : type));
  }

  return (
    <>
      <ContentContainer>
        <h1>Categories</h1>

        {isChartOpen && chartData.length > 0 && (
          <ChartSection>
            <PieWrapper>
              <ResponsivePie
                data={chartData}
                colors={{ datum: "data.color" }} // nutzt definierte Kategorienfarben für Segmente
                innerRadius={0.5} // 50 % ausgeschnitten
                padAngle={2} // Abstand zwischen Segmenten
                cornerRadius={3} // rundere Ecken der Segmente
                arcLinkLabelsSkipAngle={360} // ausgeblendete Linien
                animate={false} // Segmente springen nicht
                enableArcLabels={false} // keine Zahlen im Segment
                tooltip={({ datum }) => (
                  <div>
                    {datum.label}:{" "}
                    <strong>{getChartPercentage(datum.value)} %</strong>
                  </div>
                )}
              />
            </PieWrapper>

            <BalanceContainer>
              <p>Total Balance</p>
              <p className={`value ${remainingIncome < 0 ? "negative" : ""}`}>
                {remainingIncome.toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </p>
            </BalanceContainer>
          </ChartSection>
        )}

        <FilterSection>
          <IconWrapper
            onClick={toggleChart}
            className={isChartOpen ? "active" : ""}
          >
            <ChartIcon />
          </IconWrapper>

          <ButtonContainer>
            <button
              onClick={() => toggleTypeFilter("Income")}
              className={typeFilter === "Income" ? "active" : ""}
            >
              Incomes
            </button>

            <button
              onClick={() => toggleTypeFilter("Expense")}
              className={typeFilter === "Expense" ? "active" : ""}
            >
              Expenses
            </button>
          </ButtonContainer>
        </FilterSection>

        <StyledList>
          {filteredCategories.map((category) => (
            <ListItem key={category._id} $empty={category.totalAmount <= 0}>
              <StyledLink
                href={`/categories/${category._id}?from=/categories`} // Eintrittspunkt CategoryDetailsPage  ;  "?from/categories": CategoriesPage als Herkunft merken, um nach delete von category wieder hierhin zurück (anstatt zur jetzt gelöschten CategoryDetailsPage)
              >
                <ColorTag
                  $typeFilter={typeFilter}
                  $categoryType={category.type}
                  $categoryColor={category.color}
                />

                <p>{category.name}</p>
                <p className="amount">
                  {category.totalAmount.toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </p>
              </StyledLink>
            </ListItem>
          ))}
        </StyledList>
      </ContentContainer>

      <Navbar />
    </>
  );
}

const ContentContainer = styled.div`
  padding: 20px 20px 83px 20px; // Nav 75px // Abstand Bildschirmrand
  max-width: 500px; // Breite von list
  margin: 0 auto; // content horizontal zentriert

  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
  }
`;

const ChartSection = styled.div`
  display: flex;
  flex-direction: column; // PieWrapper + BalanceContainer untereinander
  max-width: 275px; // schmaler als FilterSection
  margin: 0 auto 1.5rem auto; // Abstand FilterSection, horizontal zentriert
`;

const PieWrapper = styled.div`
  height: 150px;
  width: 150px;
  margin: 0 auto; // horizontal zentriert
`;

const BalanceContainer = styled.div`
  align-self: flex-end; // rechts in ChartSection
  text-align: center; // content horizontal zentriert

  p.value {
    font-weight: bold;
  }

  p.value.negative {
    color: var(--expense-color);
  }
`;

const FilterSection = styled.div`
  display: flex; // IconWrapper + ButtonContainer nebeneinander
  justify-content: space-between; // icon links, buttons rechts

  max-width: 400px; // schmaler als list
  margin: 0 auto 1.5rem auto; // Abstand list, horizontal zentriert
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
  display: flex;
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
`;

const ListItem = styled.li`
  background-color: var(--list-item-background);
  border-radius: 20px;
  margin-bottom: 0.5rem; // Abstand zw. ListItems

  opacity: ${(props) =>
    props.$empty ? 0.3 : 1}; // dunkler bei totalAmount <= 0

  &:hover {
    transform: scale(1.02);

    p {
      color: var(--primary-text-color);
    }
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  display: flex; // items nebeneinander
  align-items: center; // items vertikal zentriert
  gap: 0.5rem; // Abstand items

  height: 2rem;
  padding: 0 1rem; // Abstand Rand

  p {
    font-size: 0.8rem;
  }

  p.amount {
    margin-left: auto; // rechts
    font-weight: bold;
    white-space: nowrap;
  }
`;

const ColorTag = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;

  background-color: ${(props) =>
    props.$typeFilter // wenn type-filter aktiv
      ? props.$categoryColor // dann category color
      : props.$categoryType === "Income" // type color (main view)
        ? "var(--income-color)"
        : "var(--expense-color)"};
`;
