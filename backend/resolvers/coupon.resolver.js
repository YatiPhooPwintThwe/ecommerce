import Coupon from "../models/coupon.model.js";
import { GraphQLError } from "graphql";


const unauth = (m = "Not authenticated") => {
  throw new GraphQLError(m, { extensions: { code: "UNAUTHENTICATED" } });
};

export const couponResolvers = {
  Query: {
    myCoupon: async (_, __, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      return await Coupon.findOne({
        userId: user._id,
        isActive: true,
        redeemed: false,
      }).lean();
     
    },
  },

  Mutation: {
    validateCoupon: async (_, { code }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();
      const normalized = (code || "").trim().toUpperCase();
      if (!normalized) {
        return { message: "Coupon not found", code: null, discountPercentage: null };
      }

      const coupon = await Coupon.findOne({
        code: normalized,
        userId: user._id,
        isActive: true,
        redeemed: false,
      });

      if (!coupon) {
        return {
          message: "Coupon not found",
          code: null,
          discountPercentage: null,
        };
      }

       if (coupon.redeemed) {
        return { message: "Coupon already used", code: null, discountPercentage: null };
      }

      return {
        message: "Coupon is valid",
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      };
    },
    redeemCoupon: async (_, { code }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      const normalized = (code || "").trim().toUpperCase();
      const coupon = await Coupon.findOne({
        code: normalized,
        userId: user._id,
        isActive: true,
        redeemed: false,
      });

      if (!coupon) {
        return { message: "Coupon not available", success: false };
      }

      coupon.redeemed = true;
      coupon.redeemedAt = new Date();
      await coupon.save();

      return { message: "Coupon redeemed successfully", success: true };
    },
  },
};
export default couponResolvers;
