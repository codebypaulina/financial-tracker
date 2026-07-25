// für FormAddTransaction + FormEditTransaction

import { useState } from "react";
import styled from "styled-components";

export default function TransactionCategorySelect({
  categories,
  initialCategoryId = "",
  initialCategoryType = "Expense",
  selectAriaLabel = "Select category",
}) {
  // *** [ STATES ]
  const [typeFilter, setTypeFilter] = useState(initialCategoryType);
  const [selectedCategoryIdsByType, setSelectedCategoryIdsByType] = useState({
    Expense: initialCategoryType === "Expense" ? initialCategoryId : "",
    Income: initialCategoryType === "Income" ? initialCategoryId : "",
  }); // ausgewählte ID je type für dropdown-memory

  // *** [ DERIVED DATA ] *******************************************************
  const currentCategoryId = selectedCategoryIdsByType[typeFilter];

  // *** [categories sortieren]: A-Z (für dropdown)
  // undefined: user-locale // sensitivity: case- & accent-insensitive
  const sortedCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // *** [categories filtern]: nach type (für dropdown)
  const filteredCategories = sortedCategories.filter(
    (category) => category.type === typeFilter
  );

  // *** [ HANDLERS ] ***********************************************************
  // *** [ category-select ]
  function handleCategoryChange(event) {
    const selectedCategoryId = event.target.value;

    setSelectedCategoryIdsByType((currentIds) => ({
      ...currentIds,
      [typeFilter]: selectedCategoryId,
    }));
  }

  // *** [ type-filter-button ]
  function toggleTypeFilter() {
    setTypeFilter((currentType) =>
      currentType === "Expense" ? "Income" : "Expense"
    );
  }

  return (
    <>
      <label htmlFor="category">Category</label>

      <CategoryGroup>
        <select
          id="category"
          name="category"
          aria-label={selectAriaLabel}
          title="Category"
          value={currentCategoryId}
          onChange={handleCategoryChange}
          required
        >
          <option value="" disabled>
            Select
          </option>

          {filteredCategories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>

        <ColorTag
          type="button"
          aria-label="Switch category filter"
          title={`${typeFilter} (click to switch)`}
          onClick={toggleTypeFilter}
          $categoryType={typeFilter}
        />
      </CategoryGroup>
    </>
  );
}

const CategoryGroup = styled.div`
  display: flex; // select + ColorTag nebeneinander
  align-items: center; // ColorTag vertikal zentriert
  gap: 0.75rem; // Abstand select + ColorTag
  margin-bottom: 0.8rem; // Abstand Block Description

  select {
    flex: 1; // nimmt restlichen Platz in CategoryGroup
    cursor: pointer;
  }
`;

const ColorTag = styled.button`
  width: 25px;
  height: 25px;
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(0, 0, 0, 1);

  background-color: ${({ $categoryType }) =>
    $categoryType === "Expense"
      ? "var(--color-expense)"
      : "var(--color-income)"};

  &:hover {
    transform: scale(1.07);
  }
`;
