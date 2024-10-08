import mongoose from "mongoose";

const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Income", "Expense"], // stellt sicher, dass nur "Income" oder "Expense" sein kann
    required: true,
  },
  color: {
    type: String, // Hex-Code (soll später von Color-Picker geliefert werden)
    required: true,
  },
});

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);

export default Category;
