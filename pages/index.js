import LoginSection from "@/components/LoginSection";
import Navbar from "@/components/Navbar";
import useSWR from "swr";

export default function HomePage() {
  const { data: transactions, error } = useSWR("/api/transactions");

  if (error) return <h3>Failed to load transactions</h3>;
  if (!transactions) return <h3>Loading...</h3>;

  return (
    <div>
      <h1>Finance Tracker</h1>

      <LoginSection />

      <Navbar />
    </div>
  );
}
