import dotenv from "dotenv";
dotenv.config();
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_COUPON_TEMPLATE,
  ORDER_SUCCESS_TEMPLATE,
} from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email Verification",
    });

    console.log("Email sent successfully", response);
  } catch (error) {
    console.error(`Error sending verification`, error);
    throw new Error(`Error sending verification email: ${error}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset",
    });
  } catch (error) {
    console.log(`Error sending password reset email`, error);

    throw new Error(`Error sending password reset email" ${error}`);
  }
};

export const sendResetSuccessEmail = async (email) => {
  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    });
    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.log(`Error sending password reset email`, error);

    throw new Error(`Error sending password reset email" ${error}`);
  }
};
export async function sendWelcomeCouponEmail(email, { code, percent = 30 }) {
  const html = WELCOME_COUPON_TEMPLATE.replace("{couponCode}", code)
    .replace("{percent}", String(percent))
    .replace("{shopUrl}", process.env.CLIENT_URL || "http://localhost:3000");

  const recipient = [{ email }];
  const res = await mailtrapClient.send({
    from: sender,
    to: recipient,
    subject: `Your ${percent}% OFF Welcome Coupon`,
    html,
    category: "Welcome Coupon",
  });
  return res;
}

export async function sendOrderSuccessEmail(email, { name, orderId, total }) {
  const html = ORDER_SUCCESS_TEMPLATE.replace("{name}", name)
    .replace("{orderId}", orderId)
    .replace("{total}", total);

  const recipient = [{ email }];
  const res = await mailtrapClient.send({
    from: sender,
    to: recipient,
    subject: "Your Order was Successful 🎉",
    html,
    category: "Order",
  });
  return res;
}
