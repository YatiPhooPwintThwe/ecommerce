// src/resolvers/user.resolvers.js
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { GraphQLError } from "graphql";

const unauth = (m = "Not authenticated") => {
  throw new GraphQLError(m, { extensions: { code: "UNAUTHENTICATED" } });
};
const forbid = (m = "Not authorized") => {
  throw new GraphQLError(m, { extensions: { code: "FORBIDDEN" } });
};
const badInput = (m = "Bad input") => {
  throw new GraphQLError(m, { extensions: { code: "BAD_USER_INPUT" } });
};

export const userResolvers = {
  Query: {
    authAdmin: async (_, __, ctx) => {
     const me = await ctx.getUser();   // <-- IMPORTANT
      if (!me) return null;
      if (me.role !== "ADMIN") return null;

      return { _id: me._id, name: me.name, role: me.role };
    },

    authUser: async (_, __, ctx) => {
      const user = await ctx.getUser();
      if (!user) return null;
      return User.findById(user._id)
        .select(
          "-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt"
        )
        .lean();
    },

    user: async (_, { userId }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();
      if (user.role !== "ADMIN") forbid();
      if (!mongoose.Types.ObjectId.isValid(userId)) badInput("Invalid user id");

      const doc = await User.findById(userId)
        .select(
          "-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt"
        )
        .lean();
      if (!doc) badInput("User not found");
      return doc;
    },

    users: async (_, __, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();
      if (user.role !== "ADMIN") forbid();

      return User.find()
        .select(
          "-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt"
        )
        .lean();
    },
  },

  Mutation: {
    updateProfile: async (_, { input }, ctx) => {
      const user = await ctx.getUser();
      if (!user) unauth();

      // Whitelist only fields allowed by UpdateProfileInput
      const patch = {};
      if (typeof input?.name === "string") patch.name = input.name.trim();
      if (typeof input?.phone === "string") patch.phone = input.phone.trim();
      if (input?.paymentMethod) patch.paymentMethod = input.paymentMethod;
      if (input?.address) {
        // Replace address atomically; you can also map individual fields if you prefer partial updates
        patch.address = {
          street: input.address.street,
          city: input.address.city,
          state: input.address.state,
          postalCode: input.address.postalCode,
          country: input.address.country,
        };
      }

      const updated = await User.findByIdAndUpdate(
        user._id,
        { $set: patch },
        { new: true, runValidators: true }
      )
        .select(
          "-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt"
        )
        .lean();

      if (!updated) badInput("User not found");
      return updated;
    },
  },
};

export default userResolvers;
