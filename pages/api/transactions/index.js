import dbConnect from "@/db/connect";
import Transaction from "@/db/models/Transaction";

export default async function handler(request, response) {
  await dbConnect();

  if (request.method === "GET") {
    try {
      const transactions = await Transaction.find().populate("category"); // holt alle Transaktionen aus database + `populate` für Details der entspr. Kategorie

      console.log("fetched transactions: ", transactions);

      response.status(200).json(transactions);
    } catch (error) {
      response.status(500).json({ error: "Failed to fetch transactions" });
    }
  } else {
    return response.status(405).json({ message: "Method not allowed" });
  }
}
