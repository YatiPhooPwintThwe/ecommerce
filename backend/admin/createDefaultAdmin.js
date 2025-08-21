import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const createDefaultAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const plain = process.env.ADMIN_PASSWORD;

    if (!email || !plain) {
      console.warn(
        "⚠️ ADMIN_EMAIL or ADMIN_PASSWORD missing; skipping default admin setup."
      );
      return;
    }

    // Find admin by email + role
    let admin = await User.findOne({ email, role: "ADMIN" });

    // Create if not found (your pre-save hook will hash the password)
    if (!admin) {
      admin = new User({
        name: "admin",
        email,
        password: plain, // plain here; pre-save will hash
        role: "ADMIN",
        isVerified: true,
      });
      await admin.save();
      console.log("✅ Default admin created:", email);
      return; // important: stop here
    }

    // Update password only if different from env
    const same = await bcrypt.compare(plain, admin.password);
    if (!same) {
      admin.password = plain; // pre-save will re-hash
      await admin.save();
      console.log("🔁 Admin password updated from env.");
    } else {
      console.log("ℹ️ Admin password already up to date.");
    }
  } catch (err) {
    console.error("❌ createDefaultAdmin error:", err.message);
  }
};

export default createDefaultAdmin;
