import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },

    phone: String,
    address: addressSchema,

    paymentMethod: {
      type: String,
      enum: ["CARD", "PAYPAL"],
    },

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,
    verificationTokenExpiresAt: Date,

    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,

    cartItems: [
      {
        quantity: { type: Number, default: 1 },
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// 🔹 Helper to (re)generate a 6-digit verification code
userSchema.methods.generateVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationToken = code;
  this.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return code;
};

const User = mongoose.model("User", userSchema);

export default User;
