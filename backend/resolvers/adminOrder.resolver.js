import { GraphQLError } from "graphql";
import Order from "../models/order.model.js";
import { sendOrderDispatchedEmail } from "../mailtrap/emails.js";


const forbid = (msg = "Not authorized") => {
  throw new GraphQLError(msg, { extensions: { code: "FORBIDDEN" } });
};

export const adminOrderResolvers = {
  Query: {
    adminOrders: async (_p, _a, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();
      const orders = await Order.find({})
        .sort({ createdAt: -1 })
        .populate({ path: "user", select: "name email address.postalCode address.country" })
        .populate({ path: "products.product", select: "name image price" })
        .lean();
        return orders.filter(o => o.user);
    },
  },

  Mutation: {
    dispatchOrder: async (_p, { orderId, etaDays = 7 }, ctx) => {
      const user = await ctx.getUser();
      if (!user || user.role !== "ADMIN") forbid();

      const order = await Order.findById(orderId)
        .populate({ path: "user", select: "name email address" })
        .populate({ path: "products.product", select: "name image" });

      if (!order) throw new GraphQLError("Order not found");

      // update status
      order.fulfillmentStatus = "dispatched";
      order.dispatchedAt = new Date();
      order.estimatedDeliveryDate = new Date(
        Date.now() + etaDays * 24 * 60 * 60 * 1000
      );
      await order.save();
      try {
        // send email
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

      return { success: true, message: "Order dispatched", order };
    },
  },
};
export default adminOrderResolvers;
