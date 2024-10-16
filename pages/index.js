// import LoginSection from "@/components/LoginSection";
import Navbar from "@/components/Navbar";
import useSWR from "swr";
import EyeIcon from "@/public/icons/eye.svg";
import EyeSlashIcon from "@/public/icons/eye-slash.svg";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// hier muss dynamischer Import, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function HomePage() {
  // Initialwert von Zustand von hiddenCategories = aus localStorage
  // -> NUR, wenn Code im Browser ausgeführt wird, sonst Server Error (localStorage serverseitig nicht verfügbar)
  const [hiddenCategories, setHiddenCategories] = useState(() => {
    if (typeof window !== "undefined") {
      const storedHiddenCategories = localStorage.getItem("hiddenCategories");
      return storedHiddenCategories ? JSON.parse(storedHiddenCategories) : [];
    }
    return [];
  });

  // Zustand von hiddenCategories bei Änderung im localStorage speichern
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "hiddenCategories",
        JSON.stringify(hiddenCategories)
      );
    }
  }, [hiddenCategories]);

  const { data: categories, error } = useSWR("/api/categories");
  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading...</h3>;

  const expenseCategories = categories.filter(
    (category) => category.type === "Expense" && category.totalAmount > 0
  );

  // erst nach visibility & dann nach totalAmount (absteigend) sortieren
  expenseCategories.sort((a, b) => {
    const isHiddenA = hiddenCategories.includes(a._id);
    const isHiddenB = hiddenCategories.includes(b._id);

    // wenn beide gleiche visibility haben, nach totalAmount
    if (isHiddenA === isHiddenB) return b.totalAmount - a.totalAmount;

    // hiddenCategories nach unten
    return isHiddenA - isHiddenB;
  });

  // chart
  const chartData = expenseCategories
    .filter(
      (category) =>
        category.totalAmount > 0 && !hiddenCategories.includes(category._id)
    )
    .map((category) => ({
      id: category.id,
      label: category.name,
      value: category.totalAmount,
      color: category.color,
    }));

  // Summe aller aktiven Kategorien
  const totalVisibleAmount = expenseCategories
    .filter((category) => !hiddenCategories.includes(category._id))
    .reduce((sum, category) => sum + category.totalAmount, 0);

  // EyeIcon
  function toggleVisibility(categoryId) {
    setHiddenCategories((prevHiddenCategories) => {
      const updatedCategories = prevHiddenCategories.includes(categoryId)
        ? prevHiddenCategories.filter((id) => id !== categoryId) // wenn ID schon in hiddenCategories enthalten, dann entfernen (= neues Array ohne diese ID)
        : [...prevHiddenCategories, categoryId]; // wenn ID noch nicht in hiddenCategories enthalten, dann hinzufügen (= neues Array mit bestehender Liste + dieser ID)

      return updatedCategories;
    });
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
              tooltip={({ datum }) => {
                const percentage = (
                  (datum.value / totalVisibleAmount) *
                  100
                ).toFixed(0);
                return (
                  <div>
                    {datum.label}: <strong>{percentage} %</strong>
                  </div>
                );
              }} // zeigt Name & Summe (%) von Kategorie beim Hovern über Segment (auf Touch-Geräten beim Klicken)
            />
          </ChartContainer>
        )}

        <BalanceContainer>
          <p>Total Expenses</p>
          <p className="value">
            {totalVisibleAmount.toLocaleString("de-DE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            €
          </p>
        </BalanceContainer>

        <StyledList>
          {expenseCategories.map((category) => (
            <StyledListItem
              key={category._id}
              $isHidden={hiddenCategories.includes(category._id)}
            >
              <StyledLink
                href={`/categories/${category._id}`}
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
