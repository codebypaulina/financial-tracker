import { useRouter } from "next/router";
import useSWR from "swr";
import styled from "styled-components";
import Link from "next/link";

export default function CategoryDetailsPage() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. category aus URL extrahiert

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
    <PageWrapper>
      <ContentContainer>
        <h1>Category Details</h1> <h2>{category.name}</h2>
        <button onClick={() => router.back()} className="back">
          ←
        </button>
        {filteredTransactions.length === 0 ? (
          <p className="no-ta">No transactions in this category yet.</p>
        ) : (
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
                  <p className="description">{transaction.description}</p>
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
        )}
        <button
          onClick={() =>
            router.push(`/adding?category=${id}&type=${category.type}`)
          }
          className="add"
        >
          Add Transaction
        </button>
        <button
          onClick={() => router.push(`/categories/${id}/edit`)}
          className="edit"
        >
          Edit Category
        </button>
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
  padding: 70px 70px 75px 70px; // 75px: Nav

  @media (max-width: 600px) {
    padding: 70px 60px 75px 20px;
  }

  @media (max-width: 400px) {
    padding: 70px 40px 75px 40px;
  }

  h1 {
    margin-bottom: 20px;
  }

  h2 {
    align-self: center;
  }

  p.no-ta {
    margin: 0 0 20px 0;
  }

  button {
    border: none;
    border-radius: 20px;
    cursor: pointer;
    width: 150px;
    height: 40px;
    margin: 10px 0;
    padding: 5px 10px;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.07);
      font-weight: bold;
    }
  }

  button.back {
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    align-self: flex-start;
    width: 40px;
    height: 30px;
    margin: 0 0 20px 0;
  }

  button.add,
  button.edit {
    background-color: var(--button-text-color);
    color: var(--button-background-color);
  }
`;

const StyledList = styled.ul`
  list-style-type: none;
  width: 100%;
  margin: 0 0 20px 0;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: var(--secondary-text-color);
  margin-bottom: 10px;

  display: flex;
  justify-content: space-between;
  gap: 10px;

  &:hover {
    font-weight: bold;
  }

  .date {
    flex: 1;
    text-align: left;
  }

  .description {
    flex: 2;
    text-align: left;
    margin-left: 10px;
    // max-width: 100px;
  }

  .amount {
    flex: 1;
    text-align: right;
    font-weight: bold;
  }
`;
