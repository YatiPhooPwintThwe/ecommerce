// src/resolvers/product.resolvers.js
import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import Product from "../models/product.model.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

// ---------- helpers ----------
const badInput = (m = "Bad input") => {
  throw new GraphQLError(m, { extensions: { code: "BAD_USER_INPUT" } });
};

const requireAdmin = async (ctx) => {
  const me = await ctx.getUser();
  if (!me) {
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  if (me.role !== "ADMIN") {
    throw new GraphQLError("Not authorized", {
      extensions: { code: "FORBIDDEN" },
    });
  }
  return me;
};

async function updateFeaturedProductsCache() {
  const featured = await Product.find({ isFeatured: true }).lean();
  await redis.set("featured_products", JSON.stringify(featured), "EX", 300);
}

// ---------- resolvers ----------
export const productResolvers = {
  // Ensure non-nullable GraphQL field Product.stock always resolves to a number (default 0)
  Product: {
    stock: (parent) => {
      const n = parent?.stock;
      return Number.isInteger(n) && n >= 0 ? n : 0;
    },
  },

  Query: {
    products: async () => {
      return await Product.find().sort({ createdAt: -1 }).lean();
    },

    featuredProducts: async () => {
      const cached = await redis.get("featured_products");
      if (cached) return JSON.parse(cached);

      const featured = await Product.find({ isFeatured: true }).lean();
      await redis.set("featured_products", JSON.stringify(featured), "EX", 300);
      return featured;
    },

    recommendedProducts: async () => {
      // Simple random sample; ensure stock is never null using $ifNull
      const products = await Product.aggregate([
        { $sample: { size: 4 } },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            image: 1,
            price: 1,
            category: 1,
            isFeatured: 1,
            stock: { $ifNull: ["$stock", 0] },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);
      return products;
    },

    productByCategory: async (_, { category }) => {
      const c = category?.trim();
      if (!c) badInput("Category is required");
      return await Product.find({ category: c }).lean();
    },

    product: async (_, { productId }) => {
      if (!mongoose.Types.ObjectId.isValid(productId))
        badInput("Invalid product id");
      const doc = await Product.findById(productId).lean();
      if (!doc) badInput("Product not found");
      return doc;
    },
  },

  Mutation: {
    createProduct: async (_, { input }, ctx) => {
      await requireAdmin(ctx);

      const name = input?.name?.trim();
      const description = input?.description?.trim();
      const category = input?.category?.trim();
      const price = Number(input?.price);
      const stock = Number(input?.stock);

      if (!name || !description || !category || !Number.isFinite(price) || price < 0) {
        badInput("Invalid name, description, category, or price");
      }
      if (!Number.isInteger(stock) || stock < 0) badInput("Invalid stock");

      let uploadedImage = "";
      if (input.image) {
        const result = await cloudinary.uploader.upload(input.image, {
          folder: "products",
        });
        uploadedImage = result.secure_url;
        // (Best: also store result.public_id on the model for reliable delete)
      }

      const newProduct = await Product.create({
        name,
        description,
        price,
        image: uploadedImage,
        category,
        stock,
      });

      await updateFeaturedProductsCache();
      return newProduct.toObject();
    },

    updateProduct: async (_, { input }, ctx) => {
      await requireAdmin(ctx);

      const { productId } = input;
      if (!mongoose.Types.ObjectId.isValid(productId))
        badInput("Invalid product id");

      const product = await Product.findById(productId);
      if (!product) badInput("Product not found");

      if (input.name != null) product.name = input.name.trim();
      if (input.description != null) product.description = input.description.trim();
      if (input.category != null) product.category = input.category.trim();

      if (input.price != null) {
        const p = Number(input.price);
        if (!Number.isFinite(p) || p < 0) badInput("Invalid price");
        product.price = p;
      }

      if (input.stock != null) {
        const st = Number(input.stock);
        if (!Number.isInteger(st) || st < 0) badInput("Invalid stock");
        product.stock = st;
      }

      if (input.image) {
        const prevUrl = product.image;
        try {
          const result = await cloudinary.uploader.upload(input.image, {
            folder: "products",
          });
          product.image = result.secure_url;
          // (Again, ideally replace/store public_id)
        } catch (err) {
          console.error("Cloudinary upload failed:", err?.message || err);
          badInput("Image upload failed");
        }

        // Best practice: destroy by stored public_id. Fallback: parse filename.
        if (prevUrl) {
          try {
            const parts = prevUrl.split("/");
            const last = parts[parts.length - 1]; // e.g. "abc123.jpg"
            const filename = last.split(".")[0]; // "abc123"
            await cloudinary.uploader.destroy(`products/${filename}`);
          } catch (err) {
            console.warn("Cloudinary delete (old image) failed:", err?.message || err);
          }
        }
      }

      const saved = await product.save();
      await updateFeaturedProductsCache();
      return saved.toObject();
    },

    deleteProduct: async (_, { productId }, ctx) => {
      await requireAdmin(ctx);

      if (!mongoose.Types.ObjectId.isValid(productId))
        badInput("Invalid product id");

      const product = await Product.findById(productId);
      if (!product) badInput("Product not found");

      // Delete image (prefer using stored public_id)
      if (product.image) {
        try {
          const parts = product.image.split("/");
          const last = parts[parts.length - 1];
          const filename = last.split(".")[0];
          await cloudinary.uploader.destroy(`products/${filename}`);
        } catch (err) {
          console.warn("Cloudinary delete failed:", err?.message || err);
        }
      }

      await Product.findByIdAndDelete(productId);
      await updateFeaturedProductsCache();
      return "Product deleted successfully";
    },

    toggleFeaturedProduct: async (_, { productId }, ctx) => {
      await requireAdmin(ctx);

      if (!mongoose.Types.ObjectId.isValid(productId))
        badInput("Invalid product id");

      const product = await Product.findById(productId);
      if (!product) badInput("Product not found");

      product.isFeatured = !product.isFeatured;
      const updated = await product.save();

      await updateFeaturedProductsCache();
      return updated.toObject();
    },
  },
};

export default productResolvers;
