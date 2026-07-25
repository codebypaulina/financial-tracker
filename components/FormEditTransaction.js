import useSWR, { useSWRConfig } from "swr";
import { useState } from "react"; // ConfirmModal open/!open
import { useSession } from "next-auth/react";
import styled from "styled-components";

import StatusMessage from "./layout/StatusMessage";
import TransactionCategorySelect from "./TransactionCategorySelect";
import CloseIcon from "@/public/icons/close.svg";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { Overlay, fixedCenteredStyles } from "./modal.styles";
import useEscapeClose from "@/hooks/useEscapeClose";
import {
  getCategoriesKey,
  getTransactionsKey,
  getTransactionKey,
} from "@/utils/swrKeys";
import { TX_DESCRIPTION_MAX_LENGTH, TX_AMOUNT_MIN } from "@/utils/constants";

export default function FormEditTransaction({
  transactionId,
  onTxCategoryChanged,
  onTxDeleted,
  closeForm,
}) {
  // *** [ SWR-CACHE ]
  const { mutate } = useSWRConfig(); // um tx-list zu aktualisieren

  // *** [ AUTH ]
  const { data: session } = useSession();
  const userId = session?.user?.userId; // für data-fetch, SWR cache-key

  // *** [ DATA-FETCH ]
  const {
    data: transaction,
    error: errorTransaction,
    mutate: mutateTransaction,
  } = useSWR(getTransactionKey(transactionId, userId));
  const { data: categories, error: errorCategories } = useSWR(
    getCategoriesKey(userId)
  );

  // *** [ STATES ]
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // *** [ SYNC ] **************************************************************************
  useEscapeClose(!isConfirmOpen, closeForm); // ESC-listener

  // *** [ GUARDS ] ************************************************************************
  if (errorTransaction || errorCategories) {
    return (
      <>
        <Overlay onClick={closeForm} />

        <FormContainer as="section">
          <StatusMessage variant="error" message="Failed to load data." />
        </FormContainer>
      </>
    );
  }

  if (!transaction || !categories) {
    return (
      <>
        <Overlay onClick={closeForm} />

        <FormContainer as="section">
          <StatusMessage message="Loading ..." />
        </FormContainer>
      </>
    );
  }

  // *** [ HANDLERS ] **********************************************************************
  // *** [ save-button ]
  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const transactionData = Object.fromEntries(formData); // form data -> object

    try {
      // *** [ db ]: tx updaten
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update transaction (status: ${response.status})`
        );
      }

      const updatedTransaction = await response.json(); // geupdatete tx

      // *** [ swr-cache ]: aktualisieren
      // *** [1]: tx-detail
      await mutateTransaction(updatedTransaction, { revalidate: false });

      // *** [2]: tx-list
      const transactionsKey = getTransactionsKey(userId); // key tx-list

      await mutate(
        transactionsKey,

        // bisherige tx-list aus cache:
        (currentTransactions) => {
          if (currentTransactions === undefined) {
            return undefined;
          } // wenn keine list, list nicht anpassen

          return currentTransactions.map((currentTransaction) =>
            currentTransaction._id === transactionId
              ? updatedTransaction
              : currentTransaction
          ); // aktualisierter cache: in list tx durch geupdatete ersetzt
        },

        { revalidate: false } // nicht zusätzl GET, weil geupdatete tx durch PUT
      );

      // *** [3]: parent data
      const categoryChanged =
        transaction.category._id !== updatedTransaction.category._id;

      if (categoryChanged) {
        await onTxCategoryChanged?.(); // CategoryDetailsPage aktualisiert detail-cache, TransactionsPage nicht nötig
      }

      closeForm(); // zu CategoryDetailsPage / TransactionsPage
    } catch (error) {
      console.error("Error updating transaction: ", error);
    }
  }

  // *** [ delete ]
  // *** [1. button]: DeleteConfirmModal öffnen
  function handleDelete() {
    setIsConfirmOpen(true);
  }

  // *** [2. confirm-button]: transaction löschen
  async function handleConfirmDelete() {
    try {
      // *** [ db ]
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      }); // löschen

      if (!response.ok) {
        throw new Error(
          `Failed to delete transaction (status: ${response.status})`
        );
      }

      setIsConfirmOpen(false); // Modal schließen

      // *** [ swr-cache ]: tx-list aktualisieren
      const transactionsKey = getTransactionsKey(userId); // key tx-list

      await mutate(
        transactionsKey,

        // bisherige tx-list aus cache:
        (currentTransactions) => {
          if (currentTransactions === undefined) {
            return undefined;
          } // wenn keine list, list nicht anpassen

          return currentTransactions.filter(
            (transaction) => transaction._id !== transactionId
          ); // aktualisierter cache: bisherige list ohne gelöschte tx
        },

        { revalidate: false } // nicht zusätzl GET, weil tx rausgefiltert aus list
      );

      await onTxDeleted?.(); // parent data: CategoryDetailsPage aktualisiert detail-cache, TransactionsPage nicht nötig

      closeForm(); // zu CategoryDetailsPage / TransactionsPage
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      setIsConfirmOpen(false); // Modal schließen, damit user nicht festhängt
    }
  }

  return (
    <>
      <Overlay onClick={closeForm} />

      <FormContainer onSubmit={handleSubmit}>
        <FormHeader>
          <h2>Transaction</h2>

          <CloseButton
            type="button"
            aria-label="Close form"
            title="Close"
            onClick={closeForm} // TransactionsPage / CategoryDetailsPage
          >
            <CloseIcon />
          </CloseButton>
        </FormHeader>

        <TransactionCategorySelect
          key={transaction._id}
          categories={categories}
          initialCategoryId={transaction.category._id}
          initialCategoryType={transaction.category.type}
          selectAriaLabel="Update category"
        />

        <label htmlFor="description">Description</label>
        <input
          type="text"
          id="description"
          name="description"
          aria-label="Update description"
          title="Description"
          defaultValue={transaction.description}
          maxLength={TX_DESCRIPTION_MAX_LENGTH}
          required
        />

        <label htmlFor="amount">Amount</label>
        <input
          type="number"
          id="amount"
          name="amount"
          aria-label="Update amount"
          title="Amount"
          defaultValue={transaction.amount}
          inputMode="decimal"
          min={TX_AMOUNT_MIN}
          step="any" // Kommazahlen (0.01 geht nicht)
          required
        />

        <label htmlFor="date">Date</label>
        <input
          type="date"
          id="date"
          name="date"
          aria-label="Update date"
          title="Date"
          defaultValue={transaction.date.slice(0, 10)} // nur YYYY-MM-DD
          required
        />

        <ButtonContainer>
          <button
            type="button"
            aria-label="Delete transaction"
            title="Delete transaction"
            onClick={handleDelete}
          >
            Delete
          </button>

          <button type="submit" aria-label="Save changes" title="Save">
            Save
          </button>
        </ButtonContainer>
      </FormContainer>

      {isConfirmOpen && (
        <DeleteConfirmModal
          confirmationMessage={
            <p>Are you sure you want to delete this transaction?</p>
          }
          confirmDelete={handleConfirmDelete} // transaction löschen
          closeModal={() => setIsConfirmOpen(false)} // X / ESC / Overlay
        />
      )}
    </>
  );
}

const FormContainer = styled.form`
  ${fixedCenteredStyles}; // über overlay + zentriert

  width: 250px;
  background-color: var(--color-background-page);
  border-radius: var(--radius-lg);
  padding: 1.55rem 1.75rem 2rem 1.75rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 1);

  display: flex; // content vertikal
  flex-direction: column; // untereinander

  label {
    font-size: 1.15rem;
    font-weight: bold;
    color: var(--color-text-primary);
    margin: 0 0 0.55rem 0.25rem; // Abstand input
  }

  select,
  input[type="text"],
  input[type="number"],
  input[type="date"] {
    height: 1.75rem;
    border: 0.07rem solid var(--color-button-bg);
    border-radius: var(--radius-md);
    padding-left: 5px;

    // Firefox: wenn Feld angeklickt, kein blauer Rahmen:
    accent-color: var(--color-button-bg);
  }

  select {
    width: 155px;
  }

  input[type="text"],
  input[type="number"] {
    margin-bottom: 0.8rem; // Abstand zw. Blöcken
  }

  input[type="date"] {
    cursor: text;
  }
`;

const FormHeader = styled.div`
  display: flex; // h2 + CloseButton nebeneinander
  margin-bottom: 1rem; // Abstand zum ersten label

  h2 {
    flex: 1; // nimmt restlichen Platz in FormHeader
    text-align: center;
    font-size: 1.5rem;
    line-height: 1;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;

  svg {
    width: 25px;
    height: 25px;
    filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.9)); // ohne Ecken
  }
  svg path[class*="circle"] {
    fill: var(--color-button-bg);
  }
  svg path[class*="X"] {
    fill: var(--color-button-text);
  }

  &:hover {
    transform: scale(1.07);

    svg path[class*="X"] {
      fill: var(--color-text-primary);
    }
  }
`;

const ButtonContainer = styled.div`
  margin-top: 2rem; // Abstand zum letzten input
  display: flex; // wegen Zentrierung
  justify-content: center; // buttons zentriert
  gap: 1.5rem;

  button {
    width: 80px;
    height: 35px;
    border: none;
    border-radius: var(--radius-md);
    background-color: var(--color-button-bg);
    color: var(--color-button-text);
    font-size: 1.15rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 0, 0, 1);

    &:hover {
      transform: scale(1.05);
      color: var(--color-text-primary);
    }
  }
`;
