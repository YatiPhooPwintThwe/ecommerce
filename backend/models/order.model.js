import mongoose from "mongoose";

const orderProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },

  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price must be a positive number"],
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: {
      type: [orderProductSchema],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount must be a positive number"],
    },


    paymentMethod: {
      type: String,
      enum: ["CARD"],
    },

    paymentStatus: {
      type: String,
      required: true,
      default: "unpaid",
    },

    stripeSessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },

  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
