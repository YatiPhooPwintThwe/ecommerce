import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },

    image: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    sold: { type: Number, default: 0, min: 0 },
  },

  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
