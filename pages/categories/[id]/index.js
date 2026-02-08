import { useRouter } from "next/router";
import useSWR from "swr";
import styled from "styled-components";
import Link from "next/link";
import SettingsIcon from "/public/icons/settings.svg";
import BackIcon from "/public/icons/back.svg";
import AddIcon from "/public/icons/add.svg";

export default function CategoryDetailsPage() {
  const router = useRouter();
  const { id, from } = router.query; // ID der entspr. category aus URL extrahiert // "from" auslesen, um an FormEditCategory weiterzugeben (für back navigation nach delete von category)

  const { data: category, error: errorCategory } = useSWR(
    id ? `/api/categories/${id}` : null
  );
  const { data: transactions, error: errorTransactions } =
    useSWR("/api/transactions");

  if (errorCategory || errorTransactions) return <h3>Failed to load data</h3>;
  if (!category || !transactions) return <h3>Loading...</h3>;

  const filteredTransactions = transactions.filter(
    (transaction) => transaction.category?._id === id
  );

  return (
    <ContentContainer>
      <h1>Category Details</h1>

      <CategoryContainer>
        <ColorTag
          color={
            category.type === "Income"
              ? "var(--income-color)"
              : "var(--expense-color)"
          }
        />
        <ColorTag color={category.color} />

        <h2>{category.name}</h2>

        <SettingsButton
          onClick={() =>
            router.push(
              `/categories/${id}/edit${
                from ? `?from=${encodeURIComponent(from)}` : ""
              }`
              //  ${from ? `?from=${encodeURIComponent(from)}` : ""} übernimmt Herkunft (= from) in FormEditCategory, um nach delete dorthin zurück
              // (ansonsten weiß in FormEditCategory nicht, ob davor auf pages/index.js oder pages/categories/index.js gewesen)
            )
          }
        >
          <SettingsIcon />
        </SettingsButton>
      </CategoryContainer>

      <BackButton onClick={() => router.back()}>
        <BackIcon />
      </BackButton>

      {filteredTransactions.length === 0 ? (
        <p className="no-transaction">No transactions in this category yet.</p>
      ) : (
        <ul>
          {filteredTransactions.map((transaction) => (
            <li key={transaction._id}>
              <StyledLink href={`/transactions/${transaction._id}`}>
                <p>
                  {new Date(transaction.date).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>

                <p>{transaction.description}</p>

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
        </ul>
      )}

      <AddButton onClick={() => router.push(`/adding?category=${id}`)}>
        <AddIcon />
      </AddButton>
    </ContentContainer>
  );
}

const ContentContainer = styled.div`
  padding: 2rem; // Abstand Bildschirmrand
  margin: 0 auto; // container mittig
  max-width: 450px;

  h1,
  .no-transaction {
    text-align: center;
  }

  h1 {
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
  }
`;

const CategoryContainer = styled.div`
  display: flex;
  justify-content: center; // ColorTags + {category.name} zentriert
  align-items: center; // ColorTags + {category.name} mittig in der Zeile
  gap: 0.5rem;
`;

const ColorTag = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%; // rund
  background-color: ${(props) => props.color};
`;

const SettingsButton = styled.button`
  border: none;
  width: 25px;
  height: 25px;
  cursor: pointer;
  background: transparent;

  display: flex; // SettingsIcon zentriert & mittig
  justify-content: center;
  align-items: center;

  svg {
    width: 20px;
    height: 20px;
    color: var(--secondary-text-color);
  }

  &:hover {
    transform: scale(1.07);
  }
`;

const BackButton = styled.button`
  border: none;
  border-radius: 10px;
  width: 26px;
  height: 19px;
  cursor: pointer;
  background-color: var(--secondary-text-color);
  margin-bottom: 1rem; // Abstand zur list / no-transaction

  display: flex; // BackIcon zentriert & mittig
  justify-content: center;
  align-items: center;

  svg {
    width: 14px;
    height: 14px;
    color: "var(--background-color)";
  }

  &:hover {
    transform: scale(1.07);
  }
`;

const AddButton = styled.button`
  border: none;
  width: 36px;
  height: 36px;
  cursor: pointer;
  background: transparent;

  display: block; // wegen Zentrierung
  margin: 1rem auto 0; // Abstand zur list / no-transaction + zentriert

  svg {
    width: 26px;
    height: 26px;
    color: var(--secondary-text-color);
  }

  &:hover {
    transform: scale(1.07);
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  display: grid; //      date | description | amount
  grid-template-columns: 70px 1fr auto;
  gap: 1rem;
  padding-bottom: 0.2rem; // Abstand zw. Zeilen

  .amount {
    white-space: nowrap; // kein Umbruch
  }

  &:hover {
    font-weight: bold;
  }
`;
