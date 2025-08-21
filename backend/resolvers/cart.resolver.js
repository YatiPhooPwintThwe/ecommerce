
import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// Error helpers
const unauth = (m = "Not authenticated") => {
  throw new GraphQLError(m, { extensions: { code: "UNAUTHENTICATED" } });
};
const badInput = (m = "Bad input") => {
  throw new GraphQLError(m, { extensions: { code: "BAD_USER_INPUT" } });
};

// Get quantity for a given product id
function getQty(cartItems, productId) {
  const hit = cartItems.find(
    (ci) => String(ci.product) === String(productId)
  );
  return hit?.quantity ?? 1;
}

function toCartProduct(productObj, quantity) {
  return {
    _id: productObj._id,
    name: productObj.name,
    description: productObj.description,
    price: productObj.price,
    image: productObj.image,
    quantity: quantity ?? 1,
  };
}

async function buildCartSnapshot(dbUser) {
  const ids = dbUser.cartItems.map((ci) => String(ci.product));
  if (ids.length === 0) return [];

  const products = await Product.find({ _id: { $in: ids } })
    .select("_id name description price image")
    .lean();

  const map = new Map(products.map((p) => [String(p._id), p]));
  const ordered = ids.map((id) => map.get(id)).filter(Boolean);

  return ordered.map((p) =>
    toCartProduct(p, getQty(dbUser.cartItems, String(p._id)))
  );
}

export const cartResolvers = {
  Query: {
    cartProducts: async (_, __,  ctx) => {
      const me = await ctx.getUser();
      if (!me) unauth();

      const dbUser = await User.findById(me._id).select("cartItems");
      if (!dbUser) badInput("User not found");

      return buildCartSnapshot(dbUser);
    },
  },

  Mutation: {
    addToCart: async (_, { productId }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();
      if (!mongoose.Types.ObjectId.isValid(productId))
        badInput("Invalid product id");

      const product = await Product.findById(productId).select("_id").lean();
      if (!product) badInput("Product not found");

      const dbUser = await User.findById(user._id).select("cartItems");
      if (!dbUser) badInput("User not found");

      const item = dbUser.cartItems.find(
        (ci) => String(ci.product) === String(productId)
      );

      if (item) {
        item.quantity = Math.min(item.quantity + 1, 999);
      } else {
        dbUser.cartItems.push({ product: productId, quantity: 1 });
      }

      await dbUser.save();
      return buildCartSnapshot(dbUser);
    },

    // Removes a single product from the cart by productId
    removeAllFromCart: async (_, { productId }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();
      if (!mongoose.Types.ObjectId.isValid(productId))
        badInput("Invalid product id");

      const dbUser = await User.findById(user._id).select("cartItems");
      if (!dbUser) badInput("User not found");

      const before = dbUser.cartItems.length;
      dbUser.cartItems = dbUser.cartItems.filter(
        (ci) => String(ci.product) !== String(productId)
      );
      if (dbUser.cartItems.length === before) badInput("Product not in cart");

      await dbUser.save();
      return buildCartSnapshot(dbUser);
    },

    updateCartQuantity: async (_, { productId, quantity }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();
      if (!mongoose.Types.ObjectId.isValid(productId))
        badInput("Invalid product id");
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 999) {
        badInput("Quantity must be an integer between 0 and 999");
      }

      const dbUser = await User.findById(user._id).select("cartItems");
      if (!dbUser) badInput("User not found");

      const idx = dbUser.cartItems.findIndex(
        (ci) => String(ci.product) === String(productId)
      );
      if (idx < 0) badInput("Product not in cart");

      if (quantity === 0) {
        dbUser.cartItems.splice(idx, 1);
      } else {
        dbUser.cartItems[idx].quantity = quantity;
      }

      await dbUser.save();
      return buildCartSnapshot(dbUser);
    },

    // Clear entire cart
    clearCart: async (_, __, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      const dbUser = await User.findById(user._id).select("cartItems");
      if (!dbUser) badInput("User not found");

      dbUser.cartItems = [];
      await dbUser.save();

      return [];
    },
  },
};

export default cartResolvers;
