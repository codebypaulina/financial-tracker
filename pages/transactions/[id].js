import FormEditTransaction from "@/components/FormEditTransaction";
import { useRouter } from "next/router";

export default function TransactionDetailsPage() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. transaction aus URL extrahiert

  return <FormEditTransaction transactionId={id} />; // ID als prop weitergegeben
}
