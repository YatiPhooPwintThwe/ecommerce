import { mergeTypeDefs } from "@graphql-tools/merge";

import userTypeDef from "./user.typeDef.js";
import authTypeDef from "./auth.typeDef.js";
import analyticsTypeDef from "./analytics.typeDef.js";
import cartTypeDef from "./cart.typeDef.js";
import couponTypeDef from "./coupon.typeDef.js";
import orderTypeDef from "./order.typeDef.js";
import productTypeDef from "./product.typeDef.js";

const mergedTypeDefs = mergeTypeDefs([
  userTypeDef,
  authTypeDef,
  analyticsTypeDef,
  cartTypeDef,
  couponTypeDef,
  orderTypeDef,
  productTypeDef,
]);

export default mergedTypeDefs;
