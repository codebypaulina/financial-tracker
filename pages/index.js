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
    <PageWrapper>
      <ContentContainer>
        {/* <LoginSection /> */}
        <h1>Expenses</h1>

        {chartData.length > 0 && (
          <ChartContainer>
            <ResponsivePie
              data={chartData}
              colors={{ datum: "data.color" }}
              innerRadius={0.5} // 50 % ausgeschnitten
              padAngle={2} // Abstand zw. Segmenten
              cornerRadius={3} // rundere Ecken von Segmenten
              arcLinkLabelsSkipAngle={360} // ausgeblendete Linien
              // isInteractive={false} // alle Interaktionen weg
              animate={false} // Segmente springen nicht
              enableArcLabels={false} // keine Zahlen im Segment
              tooltip={({ datum }) => (
                <div>
                  {datum.label}:{" "}
                  <strong>{getChartPercentage(datum.value)} %</strong>
                </div>
              )}
            />
          </ChartContainer>
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
            <StyledListItem
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
            </StyledListItem>
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
  // padding: 20px 20px 75px 20px; // 75px: Nav
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
  margin: 0 0 20px 0;

  p.value {
    font-weight: bold;
  }
`;

const StyledList = styled.ul`
  // list-style-type: none;
  width: 100%;
`;

const StyledListItem = styled.li`
  display: grid;
  grid-template-columns: 1fr auto; // StyledLink | EyeIcon
  gap: 10px;
  align-items: center; // wg. ColorTag & EyeIcon
  color: ${(props) => (props.$isHidden ? "#5a5a5a" : "inherit")};
  
  @media (max-width: 600px) {
    p {
      font-size: 0.95rem;
    }
`;

const StyledLink = styled(Link)`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  text-decoration: none;
  padding: 0 15px 0 15px;
  height: 40px;
  width: 100%;
  margin: 7px 0 7px 0;
  border-radius: 30px;
  background-color: var(--list-item-background);
  opacity: ${(props) => (props.$isHidden ? 0.5 : 1)}; //

  p {
    color: ${(props) =>
      props.$isHidden ? "#5a5a5a" : "var(--secondary-text-color)"};
  }

  p.amount {
    text-align: right;
    font-weight: bold;
  }

  &:hover {
    font-weight: bold;

    p.amount {
      transform: scale(1.07);
    }
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;

    &:hover {
      transform: scale(1.2);
    }
  }
`;

const ColorTag = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 10px;

  background-color: ${(props) =>
    props.$isHidden ? "#5a5a5a" : props.$categoryColor};

  @media (max-width: 600px) {
    width: 10px;
    height: 10px;
  }
`;
