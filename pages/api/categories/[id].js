import dbConnect from "@/db/connect";
import Category from "@/db/models/Category";

export default async function handler(request, response) {
  await dbConnect();

  const { id } = request.query; // ruft ID aus URL ab

  if (request.method === "GET") {
    try {
      const category = await Category.findById(id); // holt category anhand ID aus database

      if (!category) {
        return response.status(404).json({ error: "Category not found" });
      }

      response.status(200).json(category);
    } catch (error) {
      response.status(500).json({ error: "Failed to fetch category" });
    }
  } else {
    return response.status(405).json({ message: "Method not allowed" });
  }
}
