import Navbar from "@/components/Navbar";
import useSWR from "swr";
import Link from "next/link";
import styled from "styled-components";

export default function CategoriesPage() {
  const { data: categories, error } = useSWR("/api/categories");

  if (error) return <h3>Failed to load categories</h3>;
  if (!categories) return <h3>Loading...</h3>;

  return (
    <>
      <h1>Categories</h1>

      <ul>
        {categories.map((category) => (
          <li key={category._id}>
            <StyledLink href={`/categories/${category._id}`}>
              <strong>{category.name}</strong> | {category.type} |{" "}
              <span>{category.totalAmount || 0} €</span>
            </StyledLink>
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
