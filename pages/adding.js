import Navbar from "@/components/Navbar";
import FormAddTransaction from "@/components/FormAddTransaction";

export default function AddingPage() {
  return (
    <>
      <h1>Add Transaction / Category</h1>

      <FormAddTransaction />

      <Navbar />
    </>
  );
}
