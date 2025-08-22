import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { stripe } from "../lib/stripe.js";
import { sendOrderSuccessEmail } from "../mailtrap/emails.js";

const unauth = (m = "Not authenticated") => {
  throw new GraphQLError(m, { extensions: { code: "UNAUTHENTICATED" } });
};
const badInput = (m = "Bad input") => {
  throw new GraphQLError(m, { extensions: { code: "BAD_USER_INPUT" } });
};
const serverErr = (m = "Server error", detail) => {
  throw new GraphQLError(m, { extensions: { code: "INTERNAL_SERVER_ERROR", detail } });
};

// Cache Stripe percent_off coupons to avoid duplicates
const stripeCouponCache = new Map(); // key: percent number, value: couponId string
async function getOrCreateStripePercentCoupon(percent) {
  if (stripeCouponCache.has(percent)) return stripeCouponCache.get(percent);
  const c = await stripe.coupons.create({ percent_off: percent, duration: "once" });
  stripeCouponCache.set(percent, c.id);
  return c.id;
}

// Constants for fees
const SHIPPING_FEE_CENTS = 200; // $2
const GST_FEE_CENTS = 100;      // $1
const FEE_NAMES = new Set(["Shipping Fee", "GST"]);

export const orderResolvers = {
  // ---------------------- QUERIES ----------------------
  Query: {
    orders: async (_, __, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      const docs = await Order.find({ user: user._id })
        .populate("user")
        .populate("products.product")
        .sort({ createdAt: -1 })
        .lean();

      // Normalize dates to ISO strings
      return docs.map((o) => ({
        ...o,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
        updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : null,
      }));
    },

    order: async (_, { orderId }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      const o = await Order.findOne({ _id: orderId, user: user._id })
        .populate("user")
        .populate("products.product")
        .lean();

      return o
        ? {
            ...o,
            createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
            updatedAt: o.updatedAt ? new Date(o.updatedAt).toISOString() : null,
          }
        : null;
    },
  },

  // --------------------- MUTATIONS ---------------------
  Mutation: {
    checkout: async (_, { products, couponCode }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      // Validate input
      if (!Array.isArray(products) || products.length === 0) {
        badInput("Invalid or empty products array");
      }
      for (const p of products) {
        if (!p?._id || !Number.isInteger(p.quantity) || p.quantity <= 0) {
          badInput("Each product requires _id and quantity (positive integer)");
        }
      }

      // Load canonical product data
      const ids = products.map((p) => p._id);
      const dbProducts = await Product.find({ _id: { $in: ids } })
        .select("_id name title price image")
        .lean();

      const byId = new Map(dbProducts.map((p) => [String(p._id), p]));
      if (byId.size !== products.length) {
        badInput("One or more products not found");
      }

      // Build Stripe line items & compute subtotal (in cents)
      let totalCents = 0;
      const line_items = products.map((p) => {
        const db = byId.get(String(p._id));
        const unitCents = Math.round(Number(db.price) * 100);
        totalCents += unitCents * p.quantity;
        return {
          price_data: {
            currency: "sgd",
            product_data: {
              name: db.name ?? db.title ?? "Product",
              images: db.image ? [db.image] : [],
            },
            unit_amount: unitCents,
          },
          quantity: p.quantity,
        };
      });

      // Add flat fees as separate line items
      line_items.push(
        {
          price_data: {
            currency: "sgd",
            product_data: { name: "Shipping Fee" },
            unit_amount: SHIPPING_FEE_CENTS,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "sgd",
            product_data: { name: "GST" },
            unit_amount: GST_FEE_CENTS,
          },
          quantity: 1,
        }
      );
      totalCents += SHIPPING_FEE_CENTS + GST_FEE_CENTS;

      // Optional coupon (must be active & not redeemed)
      let discounts = [];
      const normalizedCode = couponCode?.trim().toUpperCase() || "";
      if (normalizedCode) {
        const coupon = await Coupon.findOne({
          code: normalizedCode,
          userId: user._id,
          isActive: true,
          redeemed: false,
        }).lean();

        if (coupon && coupon.discountPercentage > 0) {
          try {
            const couponId = await getOrCreateStripePercentCoupon(coupon.discountPercentage);
            discounts = [{ coupon: couponId }];
            // NOTE: Stripe percent discounts apply to the session's amount_subtotal.
            // If you don't want discounts applied to fees, use shipping_options/tax rates instead of fee line items.
          } catch (err) {
            serverErr("Payment session error (coupon)", err?.message || String(err));
          }
        }
      }

      // Create Stripe Checkout Session
      let session;
      try {
        session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items,
          discounts,
          success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_URL}/cart`,
          customer_email: user.email,
          metadata: {
            userId: String(user._id),
            couponCode: normalizedCode || "",
            // store product ids/qty so we can reconcile later
            products: JSON.stringify(products.map((p) => ({ id: p._id, quantity: p.quantity }))),
            // helpful fee metadata
            shippingFee: (SHIPPING_FEE_CENTS / 100).toFixed(2),
            gst: (GST_FEE_CENTS / 100).toFixed(2),
          },
        });
      } catch (err) {
        serverErr("Payment session error", err?.message || String(err));
      }

      return {
        id: session.id,
        url: session.url ?? null,
        totalAmount: +(totalCents / 100).toFixed(2),
      };
    },

    /**
     * Confirm Stripe session, create order, **decrement stock atomically**,
     * clear cart, mark coupon redeemed, send email.
     */
    confirmOrder: async (_, { sessionId }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      // Retrieve Stripe session
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (err) {
        serverErr("Unable to retrieve payment session", err?.message || String(err));
      }

      if (!session || session.payment_status !== "paid") {
        badInput("Payment not completed");
      }

      // Ensure the session belongs to this authenticated user
      if (session.metadata?.userId && session.metadata.userId !== String(user._id)) {
        throw new GraphQLError("Session does not belong to this user", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // Idempotency: if order already saved for this session, return it (normalized)
      const existing = await Order.findOne({ stripeSessionId: sessionId })
        .populate("user")
        .populate("products.product")
        .lean();
      if (existing) {
        return {
          ...existing,
          createdAt: existing.createdAt ? new Date(existing.createdAt).toISOString() : null,
          updatedAt: existing.updatedAt ? new Date(existing.updatedAt).toISOString() : null,
        };
      }

      // Rebuild items from Stripe + metadata (exclude fee lines)
      let stripeItems;
      try {
        stripeItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
      } catch (err) {
        serverErr("Unable to list line items", err?.message || String(err));
      }

      // Extract fee amounts by description
      const shippingLine = stripeItems.data.find((li) => li.description === "Shipping Fee");
      const gstLine = stripeItems.data.find((li) => li.description === "GST");

      const shippingFee = shippingLine ? +(shippingLine.amount_total / 100).toFixed(2) : 0;
      const gst = gstLine ? +(gstLine.amount_total / 100).toFixed(2) : 0;

      // Only product lines
      const productLines = stripeItems.data.filter((li) => !FEE_NAMES.has(li.description));

      // Re-map with original product ids/quantities from metadata
      const metaProducts = JSON.parse(session.metadata?.products || "[]");
      const items = productLines
        .map((li, idx) => {
          const pid = metaProducts[idx]?.id;
          if (!pid) return null;
          const qtyFromMeta = metaProducts[idx]?.quantity;
          const qty = qtyFromMeta ?? li.quantity ?? 1;

          // per-unit price after discounts
          const perUnit = (li.amount_total / (li.quantity || qty)) / 100;
          return { product: pid, quantity: qty, price: +perUnit.toFixed(2) };
        })
        .filter(Boolean);

      if (!items.length) {
        serverErr("Order items could not be reconciled from session");
      }

      // ---- Transaction: decrement stock + create order + clear cart ----
      const mongoSession = await mongoose.startSession();
      mongoSession.startTransaction();

      try {
        // Decrement stock (and optionally increment 'sold')
        for (const { product, quantity } of items) {
          const updated = await Product.findOneAndUpdate(
            { _id: product, stock: { $gte: quantity } }, // guard
            { $inc: { stock: -quantity, sold: quantity } }, // 'sold' optional
            { new: true, session: mongoSession }
          );
          if (!updated) {
            throw new GraphQLError("Insufficient stock for a product", {
              extensions: { code: "BAD_USER_INPUT", productId: product },
            });
          }
        }

        // Create order (persist fees and Stripe total)
        const [doc] = await Order.create(
          [
            {
              user: user._id,
              products: items,
              totalAmount: +(session.amount_total / 100).toFixed(2), // Stripe total (incl. fees/discounts)
              shippingFee, // NEW
              gst,         // NEW
              paymentMethod: "CARD",
              paymentStatus: session.payment_status, // "paid"
              stripeSessionId: sessionId,
            },
          ],
          { session: mongoSession }
        );

        // Clear user's cart
        await User.updateOne(
          { _id: user._id },
          { $set: { cartItems: [] } },
          { session: mongoSession }
        );

        await mongoSession.commitTransaction();
        mongoSession.endSession();

        // ----- Side effects (non-transactional) -----
        try {
          await sendOrderSuccessEmail(user.email, {
            name: user.name || user.fullName || "Customer",
            orderId: String(doc._id),
            total: doc.totalAmount.toFixed(2),
          });
        } catch (err) {
          console.error("Failed to send order success email:", err.message);
        }

        const used = session.metadata?.couponCode?.trim()?.toUpperCase();
        if (used) {
          await Coupon.findOneAndUpdate(
            { code: used, userId: user._id },
            { redeemed: true, redeemedAt: new Date() }
          );
        }

        // Return populated order with normalized dates
        const saved = await Order.findById(doc._id)
          .populate("user")
          .populate("products.product")
          .lean();

        return {
          ...saved,
          createdAt: saved.createdAt ? new Date(saved.createdAt).toISOString() : null,
          updatedAt: saved.updatedAt ? new Date(saved.updatedAt).toISOString() : null,
        };
      } catch (err) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();

        throw err instanceof GraphQLError
          ? err
          : serverErr("Failed to finalize order", err?.message || String(err));
      }
    },
  },
};

export default orderResolvers;
