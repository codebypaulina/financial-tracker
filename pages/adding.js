import Navbar from "@/components/Navbar";
import FormAddTransaction from "@/components/FormAddTransaction";
import FormAddCategory from "@/components/FormAddCategory";

export default function AddingPage() {
  return (
    <>
      <h1>Add Transaction / Category</h1>

      <FormAddTransaction />
      <FormAddCategory />

      <Navbar />
    </>
  );
}
