import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon Code is required"],
      unique: true,
      trim: true,
    },

    discountPercentage: {
      type: Number,
      required: [true, "Discount Percentage is required"],
      min: [1, "Discount must be at least 1%"],
      max: [70, "Discount cannot exceed 70%"],
    },

   

    isActive: {
      type: Boolean,
      default: true,
    },

    redeemed: { 
      type: Boolean,
      default: false 
    }, 

    redeemedAt: { 
      type: Date 
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },

  { timestamps: true }
);

// Normalize to uppercase
couponSchema.pre("save", function (next) {
  if (this.code) this.code = this.code.toUpperCase();
  next();
});



const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
