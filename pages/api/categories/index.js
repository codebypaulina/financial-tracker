import dbConnect from "@/db/connect";
import Category from "@/db/models/Category";

export default async function handler(request, response) {
  await dbConnect();

  if (request.method === "GET") {
    try {
      const categories = await Category.find(); // holt alle Kategorien aus database

      console.log("fetched categories: ", categories);

      response.status(200).json(categories);
    } catch (error) {
      response.status(500).json({ error: "Failed to fetch categories" });
    }
  } else {
    response.status(405).json({ message: "Method not allowed" });
  }
}
