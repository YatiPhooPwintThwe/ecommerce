import { GraphQLError } from "graphql";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const forbid = (msg = "Not authorized") => {
  throw new GraphQLError(msg, { extensions: { code: "FORBIDDEN" } });
};

const clampToDayStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const datesInRange = (startDate, endDate) => {
  const out = [];
  let d = clampToDayStart(startDate);
  const end = clampToDayStart(endDate);
  while (d <= end) {
    out.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  }
  return out;
};

// --- resolvers ---
export const analyticsResolvers = {
  Query: {
    // KPI totals
    getAnalytics: async (_, __, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();

      const [totalUsers, totalProducts, salesAgg] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.aggregate([
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: "$totalAmount" },
            },
          },
        ]),
      ]);

      const { totalSales = 0, totalRevenue = 0 } = salesAgg[0] || {};
      return {
        users: totalUsers,
        products: totalProducts,
        totalSales,
        totalRevenue,
      };
    },

    // Daily sales between dates (inclusive)
    getDailySales: async (_, { startDate, endDate }, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();

      const start = new Date(startDate);
      const end = new Date(endDate);

      const rows = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const map = new Map(rows.map((r) => [r._id, r]));
      return datesInRange(start, end).map((d) => ({
        date: d,
        sales: map.get(d)?.sales ?? 0,
        revenue: map.get(d)?.revenue ?? 0,
      }));
    },

    // Monthly sales for a given year (fills empty months)
    getMonthlySales: async (_, { year }, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();

      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);

      const rows = await Order.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            sales: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const months = Array.from(
        { length: 12 },
        (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`
      );
      const map = new Map(rows.map((r) => [r._id, r]));
      return months.map((m) => ({
        month: m,
        sales: map.get(m)?.sales ?? 0,
        revenue: map.get(m)?.revenue ?? 0,
      }));
    },

    // Revenue by category (for pie chart)
    // Assumes: Product has `category` field
    // Order.products: [{ product: ObjectId, price: Number, quantity: Number }, ...]
    getRevenueByCategory: async (_, { startDate, endDate }, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();

      const match =
        startDate && endDate
          ? {
              createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            }
          : {};

      const rows = await Order.aggregate([
        { $match: match },
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products",
            localField: "products.product",
            foreignField: "_id",
            as: "p",
          },
        },
        { $unwind: "$p" },
        {
          $group: {
            _id: "$p.category",
            sales: { $sum: "$products.quantity" },
            revenue: {
              $sum: { $multiply: ["$products.price", "$products.quantity"] },
            },
          },
        },
        { $project: { _id: 0, category: "$_id", sales: 1, revenue: 1 } },
        { $sort: { revenue: -1 } },
      ]);

      return rows;
    },
  },
};

export default analyticsResolvers;
