import FormEditCategory from "@/components/FormEditCategory";
import { useRouter } from "next/router";

export default function CategoryDetailsPage() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. category aus URL extrahiert

  return <FormEditCategory categoryId={id} />; // ID als prop weitergegeben
}
