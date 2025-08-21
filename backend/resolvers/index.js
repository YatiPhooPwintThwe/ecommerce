import { mergeResolvers } from "@graphql-tools/merge";
import authResolver from "./auth.resolver.js";
import userResolver from "./user.resolver.js";
import analyticsResolver from "./analytics.resolver.js";
import cartResolver from "./cart.resolver.js";
import couponResolver from "./coupon.resolver.js";
import orderResolver from "./order.resolver.js";
import productResolver from "./product.resolver.js";

const mergedResolvers = mergeResolvers([
  authResolver,
  userResolver,
  productResolver,
  orderResolver,
  cartResolver,
  couponResolver,
  analyticsResolver,
]);

export default mergedResolvers;
