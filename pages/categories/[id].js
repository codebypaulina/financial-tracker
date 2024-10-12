import FormEditCategory from "@/components/FormEditCategory";
import { useRouter } from "next/router";
import useSWR from "swr";

export default function CategoryDetailsPage() {
  const router = useRouter();
  const { id } = router.query; // ID der entspr. category aus URL extrahiert

  const { data: category, error } = useSWR(id ? `/api/categories/${id}` : null);

  if (error) return <h3>Failed to load category</h3>;
  if (!category) return <h3>Loading...</h3>;

  return (
    <>
      <h2>Category Datails: {category.name}</h2>
      <ul>
        <li>für Transaktionenliste</li>
      </ul>

      <FormEditCategory categoryId={id} />
    </>
  );
}
