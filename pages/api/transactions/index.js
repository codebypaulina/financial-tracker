import dbConnect from "@/db/connect";
import Transaction from "@/db/models/Transaction";

export default async function handler(request, response) {
  await dbConnect();

  if (request.method === "GET") {
    try {
      const transactions = await Transaction.find(); // holt alle Transaktionen aus database
      response.status(200).json(transactions);
    } catch (error) {
      response.status(500).json({ error: "Failed to fetch transactions" });
    }
  } else {
    return response.status(405).json({ message: "Method not allowed" });
  }
}
