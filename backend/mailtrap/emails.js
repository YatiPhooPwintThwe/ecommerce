import dotenv from "dotenv";
dotenv.config();
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_COUPON_TEMPLATE,
  ORDER_SUCCESS_TEMPLATE,
  ORDER_DISPATCHED_TEMPLATE
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

export async function sendOrderDispatchedEmail(
  email,
  { name, orderId, etaDate, items = [] } // items = [{ name, image, quantity }]
) {
  const rows = items.map(it => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">
        <img src="${it.image || ""}" alt="${it.name || "Product"}"
             width="48" height="48"
             style="display:block;border-radius:4px;object-fit:cover;" />
      </td>
      <td style="padding:8px;border-bottom:1px solid #eee;">${it.name || "Product"}</td>
      <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${it.quantity ?? 1}</td>
    </tr>
  `).join("");

  const html = ORDER_DISPATCHED_TEMPLATE
    .replace("{name}", name || "there")
    .replace("{orderId}", orderId)
    .replace("{etaDate}", etaDate)
    .replace("{items}", rows);

  return mailtrapClient.send({
    from: sender,
    to: [{ email }],
    subject: "Your order is on the way 🚚",
    html,
    category: "Order",
  });
}
