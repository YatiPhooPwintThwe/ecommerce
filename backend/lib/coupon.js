import Coupon from "../models/coupon.model.js";
import crypto from "crypto";

export function generateCouponCode(prefix = "WELCOME30") {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  return `${prefix}-${rand}`;
}

export async function createWelcomeCouponForUser(userId, { percent = 30 } = {}) {
  // reuse if they already have an unused welcome coupon of same percent
  const existing = await Coupon.findOne({
    userId,
    isActive: true,
    redeemed: false,
    discountPercentage: percent,
  }).lean();
  if (existing) return existing;

  const code = generateCouponCode();
  const doc = await Coupon.create({
    code,
    userId,
    discountPercentage: percent,
    isActive: true,
    redeemed: false,
  });
  return doc.toObject();
}
