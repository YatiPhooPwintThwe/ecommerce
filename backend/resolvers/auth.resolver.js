import { GraphQLError } from "graphql";
import crypto from "crypto";
import User from "../models/user.model.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendWelcomeCouponEmail,
} from "../mailtrap/emails.js";
import { createWelcomeCouponForUser } from "../lib/coupon.js";

// ---------- helpers ----------
const badInput = (m = "Bad input") => {
  throw new GraphQLError(m, { extensions: { code: "BAD_USER_INPUT" } });
};
const unauth = (m = "Not authenticated") => {
  throw new GraphQLError(m, { extensions: { code: "UNAUTHENTICATED" } });
};

const assertPasswordOk = (pwd) => {
  if (typeof pwd !== "string" || !pwd) {
    badInput("Password is required");
  }
  // ≥6 chars, at least one uppercase letter and one number
  const strong = /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(pwd);
  if (!strong) {
    badInput(
      "Password must be at least 6 characters and include 1 uppercase letter and 1 number"
    );
  }
};

// ---------- resolvers ----------
export const authResolvers = {
  Mutation: {
    signUp: async (_, { input }, { login }) => {
      const rawName = input.name?.trim().toLowerCase();
      const email = input.email?.trim().toLowerCase();
      const { password } = input;

      if (!rawName || !email || !password) badInput("All fields are required");
      assertPasswordOk(password);

      const emailExists = await User.findOne({ email });
      const nameExists = await User.findOne({ name: rawName });
      if (emailExists || nameExists) {
        badInput(emailExists ? "Email already in use" : "Name already taken");
      }

      const newUser = new User({ name: rawName, email, password });
      const code = newUser.generateVerificationCode();
      await newUser.save();

      try {
        await sendVerificationEmail(email, code);
      } catch (err) {
        console.error("Verification email failed", err.message);
      }

      await login(newUser);
      return newUser;
    },

    login: async (_, { input }, { authenticate, login }) => {
      const username = input.name?.trim().toLowerCase();
      const { password } = input;
      if (!username || !password) badInput("All fields are required");
      const { user } = await authenticate("graphql-local", {
        username,
        password,
      });
      await login(user);
      return user;
    },

    logout: async (_, __, { logout, req, res }) => {
      await logout();
      await new Promise((resolve, reject) => {
        req.session.destroy((err) => {
          res.clearCookie("connect.sid");
          if (err) {
            return reject(
              new GraphQLError("Logout failed", {
                extensions: { code: "INTERNAL_SERVER_ERROR" },
              })
            );
          }
          resolve();
        });
      });
      return { message: "Logged out successfully" };
    },

    updateEmail: async (_, { newEmail }, ctx) => {
      const sessionUser = await ctx.getUser();
      if (!sessionUser) unauth();

      const normalized = newEmail?.trim().toLowerCase();
      if (!normalized) badInput("Email is required");
      if (normalized === sessionUser.email) return true;

      const existing = await User.findOne({ email: normalized });
      if (existing) badInput("Email already in use");

      const u = await User.findById(sessionUser._id);
      u.email = normalized;
      u.isVerified = false;
      const code = u.generateVerificationCode();
      await u.save();

      await sendVerificationEmail(u.email, code);
      return true;
    },

    verifyEmail: async (_, { token }) => {
      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpiresAt: { $gt: Date.now() },
      });
      if (!user) badInput("Invalid or expired verification code");

      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpiresAt = undefined;
      await user.save();
      try {
        const coupon = await createWelcomeCouponForUser(user._id, {
          percent: 30,
        });
        await sendWelcomeCouponEmail(user.email, {
          code: coupon.code,
          percent: 30,
        });
      } catch (err) {
        console.error(
          "Welcome coupon creation/email failed:",
          err?.message || err
        );
      }
      return true;
    },

    resendVerification: async (_, __, ctx) => {
      const sessionUser = await ctx.getUser();
      if (!sessionUser) unauth();
      if (sessionUser.isVerified) return true;

      const u = await User.findById(sessionUser._id);
      const code = u.generateVerificationCode();
      await u.save();

      try {
        await sendVerificationEmail(u.email, code);
      } catch (err) {
        console.error("Resend verification email failed:", err.message);
      }

      return true;
    },

    // Don’t reveal whether an email exists — always return true.
    forgotPassword: async (_, { email }) => {
      const normalized = email?.trim().toLowerCase();
      if (!normalized) badInput("Email is required");

      const user = await User.findOne({ email: normalized });
      if (user) {
        try {
          const resetToken = crypto.randomBytes(20).toString("hex");
          user.resetPasswordToken = resetToken;
          user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000;
          await user.save();
          const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
          await sendPasswordResetEmail(user.email, resetLink);
        } catch (e) {
          console.error("forgotPassword error", e.message);
        }
      }
      return true;
    },

    resetPassword: async (_, { token, newPassword }) => {
      assertPasswordOk(newPassword);
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiresAt: { $gt: Date.now() },
      });
      if (!user) badInput("Invalid or expired reset token");

      const isSame = await user.comparePassword(newPassword);
      if (isSame) badInput("New password must be different from the old one");

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;
      await user.save();
      await sendResetSuccessEmail(user.email);
      return true;
    },

    changePassword: async (_, { currentPassword, newPassword }, ctx) => {
      const sessionUser = await ctx.getUser();
      if (!sessionUser) unauth();
      assertPasswordOk(newPassword);

      const user = await User.findById(sessionUser._id);
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) badInput("Incorrect current password");

      const isSame = await user.comparePassword(newPassword);
      if (isSame) badInput("New password must be different");

      user.password = newPassword;
      await user.save();
      return true;
    },
  },
};

export default authResolvers;
