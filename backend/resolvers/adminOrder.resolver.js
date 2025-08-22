import { GraphQLError } from "graphql";
import Order from "../models/order.model.js";
import { sendOrderDispatchedEmail } from "../mailtrap/emails.js";

const forbid = (msg = "Not authorized") => {
  throw new GraphQLError(msg, { extensions: { code: "FORBIDDEN" } });
};

// normalize dates for UI (avoids "Invalid/Date not available")
const normalizeOrder = (o) => ({
  ...o,
  createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : null,
  dispatchedAt: o.dispatchedAt ? new Date(o.dispatchedAt).toISOString() : null,
  estimatedDeliveryDate: o.estimatedDeliveryDate
    ? new Date(o.estimatedDeliveryDate).toISOString()
    : null,
});

export const adminOrderResolvers = {
  Query: {
    adminOrders: async (_p, _a, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();

      const docs = await Order.find({})
        .sort({ createdAt: -1 })
        .populate({ path: "user", select: "name email address.postalCode address.country" })
        .populate({ path: "products.product", select: "name image" })
        .lean();

      // keep only orders that still have a user ref, and normalize dates
      return docs.filter((o) => o.user).map(normalizeOrder);
    },
  },

  Mutation: {
    dispatchOrder: async (_p, { orderId, etaDays = 7 }, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();

      let order = await Order.findById(orderId)
        .populate({ path: "user", select: "name email address" })
        .populate({ path: "products.product", select: "name image" });

      if (!order) throw new GraphQLError("Order not found");

      // update status + dates
      order.fulfillmentStatus = "dispatched";
      order.dispatchedAt = new Date();
      order.estimatedDeliveryDate = new Date(Date.now() + etaDays * 24 * 60 * 60 * 1000);
      await order.save();

      try {
        const etaText = order.estimatedDeliveryDate.toLocaleDateString("en-SG", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        });

        await sendOrderDispatchedEmail(order.user.email, {
          name: order.user.name,
          orderId: order._id.toString().slice(-6),
          etaDate: etaText,
          items: order.products.map((p) => ({
            name: p.product?.name,
            image: p.product?.image,
            quantity: p.quantity,
          })),
        });
      } catch (e) {
        console.error("Dispatch email failed:", e?.message || e);
      }

      // return a plain object with normalized dates
      const plain = order.toObject({ virtuals: false });
      return { success: true, message: "Order dispatched", order: normalizeOrder(plain) };
    },
  },
};

export default adminOrderResolvers;
