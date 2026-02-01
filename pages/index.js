import useSWR from "swr";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import styled from "styled-components";
import Navbar from "@/components/Navbar";
import EyeIcon from "@/public/icons/eye.svg";
import EyeSlashIcon from "@/public/icons/eye-slash.svg";

// hier muss dynamischer Import, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function HomePage() {
  const [hiddenCategories, setHiddenCategories] = useState([]);

  // *** [ LOCAL STORAGE ] hidden categories ***********************************************
  // *** [abrufen]
  useEffect(() => {
    const storedHiddenCategories = localStorage.getItem("hiddenCategories");
    if (!storedHiddenCategories) return;

    try {
      const parsedHiddenCategories = JSON.parse(storedHiddenCategories);
      if (Array.isArray(parsedHiddenCategories)) {
        setHiddenCategories(parsedHiddenCategories);
      } // state setzen, nur wenn array okay
    } catch {
      // ignorieren -> default []
    }
  }, []);

  // *** [speichern]: nur wenn array nicht leer
  useEffect(() => {
    if (hiddenCategories.length !== 0) {
      localStorage.setItem(
        "hiddenCategories",
        JSON.stringify(hiddenCategories)
      );
    } else {
      localStorage.removeItem("hiddenCategories");
    }
  }, [hiddenCategories]);

  // ***************************************************************************************

  // *** [ fetch ]
  const { data: categories, error } = useSWR("/api/categories");

  // *** [ guards ]
  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading ...</h3>;

  // *** [ ABGELEITETE DATEN ] *************************************************************
  // *** [ 1. categories ] filtern + sortieren *********************************************
  // *** [filtern]: alle expense + nicht leer
  const expenseCategories = categories.filter(
    (category) => category.type === "Expense" && category.totalAmount > 0
  );

  // *** [sortieren]: visibility
  const sortedCategories = [...expenseCategories].sort((a, b) => {
    const isHiddenA = hiddenCategories.includes(a._id);
    const isHiddenB = hiddenCategories.includes(b._id);

    if (isHiddenA === isHiddenB) return b.totalAmount - a.totalAmount; // visibility gleich: total amount absteigend
    return isHiddenA - isHiddenB; // visibility ungleich: hidden nach unten
  });

  // *** [filtern]: nur visible expense (für chart + total expense)
  const visibleCategories = sortedCategories.filter(
    (category) => !hiddenCategories.includes(category._id)
  );

  // *** [ 2. chart ] **********************************************************************
  // *** [chart-data]
  const chartData = visibleCategories.map((category) => ({
    id: category._id,
    label: category.name,
    value: category.totalAmount,
    color: category.color,
  }));

  // *** [total-container]: Summe angezeigter categories
  const totalExpense = visibleCategories.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );

  // *** [tooltip %]
  function getChartPercentage(value) {
    if (!totalExpense) return 0;
    return Math.round((value / totalExpense) * 100);
  }

  // ***************************************************************************************

  function toggleVisibility(categoryId) {
    setHiddenCategories(
      (prevState) =>
        prevState.includes(categoryId)
          ? prevState.filter((id) => id !== categoryId) // in state -> neues array: ohne diese
          : [...prevState, categoryId] // nicht in state -> neues array: bestehende list + diese
    );
  }

  return (
    <>
      <ContentContainer>
        {/* <LoginSection /> */}
        <h1>Expenses</h1>

        {chartData.length > 0 && (
          <PieWrapper>
            <ResponsivePie
              data={chartData}
              colors={{ datum: "data.color" }}
              innerRadius={0.5} // 50 % ausgeschnitten
              startAngle={0} // Start: oben auf 12 Uhr
              endAngle={-360} // Ende: volle Runde gegen Uhrzeigersinn
              padAngle={2} // Abstand zw. Segmenten
              cornerRadius={3} // rundere Ecken von Segmenten
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
        )}

        <BalanceContainer>
          <p>Total Expense</p>
          <p className="value">
            {totalExpense.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </BalanceContainer>

        <StyledList>
          {sortedCategories.map((category) => (
            <ListItem
              key={category._id}
              $isHidden={hiddenCategories.includes(category._id)}
            >
              <StyledLink
                href={`/categories/${category._id}?from=/`} // Eintrittspunkt CategoryDetailsPage  ;  "?from/": HomePage als Herkunft merken, um nach delete von category wieder hierhin zurück (anstatt zur jetzt gelöschten CategoryDetailsPage)
                $isHidden={hiddenCategories.includes(category._id)}
              >
                <ColorTag
                  $categoryColor={category.color}
                  $isHidden={hiddenCategories.includes(category._id)}
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

              {hiddenCategories.includes(category._id) ? (
                <IconWrapper onClick={() => toggleVisibility(category._id)}>
                  <EyeSlashIcon />
                </IconWrapper>
              ) : (
                <IconWrapper onClick={() => toggleVisibility(category._id)}>
                  <EyeIcon />
                </IconWrapper>
              )}
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
  display: flex;
  flex-direction: column; // content untereinander
  align-items: center; // content horizontal zentriert

  h1 {
    margin-bottom: 1.5rem;
  }
`;

const PieWrapper = styled.div`
  height: 150px;
  width: 150px;
`;

const BalanceContainer = styled.div`
  align-self: flex-end; // rechts im ContentContainer
  text-align: center; // content horizontal zentriert
  margin-bottom: 1.5rem; // Abstand list

  p.value {
    font-weight: bold;
  }
`;

const StyledList = styled.ul`
  list-style-type: none;
`;

const ListItem = styled.li`
  display: flex; // link + icon nebeneinander
  justify-content: center; // horizontal zentriert
  margin-bottom: 0.75rem; // Abstand zw. ListItems
  gap: 1rem; // Abstand link + icon

  opacity: ${(props) => (props.$isHidden ? 0.2 : 1)};
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  display: flex; // items nebeneinander
  align-items: center; // items vertikal zentriert
  gap: 0.5rem; // Abstand items

  background-color: var(--list-item-background);
  height: 2rem;
  width: 100%; // alle so breit wie der breiteste link
  border-radius: 20px;
  padding: 0 1rem; // Abstand Rand

  p {
    font-size: 1rem;
  }

  p.amount {
    margin-left: auto; // rechts
    font-weight: bold;
    white-space: nowrap;
  }

  &:hover {
    transform: scale(1.02);

    p {
      color: var(--primary-text-color);
    }
  }
`;

const IconWrapper = styled.div`
  display: flex; // wegen Zentrierung von svg
  align-items: center; // vertikal zentriert
  justify-content: center; // horizontal zentriert
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;

    &:hover {
      transform: scale(1.2);
    }
  }
`;

const ColorTag = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;

  background-color: ${(props) =>
    props.$isHidden ? "#5a5a5a" : props.$categoryColor};
`;
