import dotenv from "dotenv";
import { MailtrapClient } from "mailtrap";

dotenv.config();

export const mailtrapClient = new MailtrapClient({
  endpoint: process.env.MAILTRAP_ENDPOINT,
  token: process.env.MAILTRAP_TOKEN,
});

export const sender = {
  email: "no-reply@yatichatapp.win",
  name: "Mini Cart",
};
