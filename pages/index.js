// import LoginSection from "@/components/LoginSection";
import Navbar from "@/components/Navbar";
import useSWR from "swr";
import EyeIcon from "../public/icons/eye.svg";
import Link from "next/link";
import styled from "styled-components";
import dynamic from "next/dynamic";

// hier muss dynamischer Import, sonst ES Module error (auch bei aktuellster next.js-Version)
const ResponsivePie = dynamic(
  () => import("@nivo/pie").then((mod) => mod.ResponsivePie),
  { ssr: false }
);

export default function HomePage() {
  const { data: categories, error } = useSWR("/api/categories");

  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading...</h3>;

  const expenseCategories = categories.filter(
    (category) => category.type === "Expense"
  );

  // sortiert Liste absteigend nach totalAmount
  expenseCategories.sort((a, b) => b.totalAmount - a.totalAmount);

  // chart
  const chartData = expenseCategories.map((category) => ({
    id: category.id,
    label: category.name,
    value: category.totalAmount,
    color: category.color,
  }));

  return (
    <>
      {/* <LoginSection /> */}
      <h1>Expenses</h1>

      <ChartSection>
        <ResponsivePie
          data={chartData}
          colors={{ datum: "data.color" }} // nutzt definierte Kategorienfarben fpr Segmente
          innerRadius={0.5} // 50 % ausgeschnitten
          padAngle={5} // Abstand zw. Segmenten
          cornerRadius={3} // rundere Ecken von Segmenten
          arcLinkLabelsSkipAngle={360} // ausgeblendete Linien
          // isInteractive={false} // alle Interaktionen weg
          animate={false} // Segmente springen nicht
          enableArcLabels={false} // keine Zahlen im Segment
          tooltip={({ datum }) => (
            <div>
              <strong>{datum.label}</strong>: {datum.value}
            </div>
          )} // zeigt Name & Summe von Kategorie beim Hovern über Segment (auf Touch-Geräten beim Klicken)
        />
      </ChartSection>

      <ul>
        {expenseCategories.map((category) => (
          <li key={category._id}>
            <StyledLink href={`/categories/${category._id}`}>
              {category.name} | {category.totalAmount} €
            </StyledLink>{" "}
            <EyeIcon width={17} height={17} />
          </li>
        ))}
      </ul>

      <Navbar />
    </>
  );
}

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;

  &:hover {
    font-weight: bold;
  }
`;

const ChartSection = styled.div`
  height: 200px;
  width: 200px;
`;
