import dbConnect from "@/db/connect";
import Transaction from "@/db/models/Transaction";

export default async function handler(request, response) {
  await dbConnect();

  const { id } = request.query; // ruft ID aus URL ab

  if (request.method === "GET") {
    try {
      const transaction = await Transaction.findById(id).populate("category"); // holt transaction anhand ID aus database + `populate` für details der entspr. category

      if (!transaction) {
        return response.status(404).json({ error: "Transaction not found" });
      }

      response.status(200).json(transaction);
    } catch (error) {
      response.status(500).json({ error: "Failed to fetch transaction" });
    }
  } else {
    return response.status(405).json({ message: "Method not allowed" });
  }
}
