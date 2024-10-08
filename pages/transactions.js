import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div>
      <h1>Transactions</h1>

      <Navbar />
    </div>
  );
}
