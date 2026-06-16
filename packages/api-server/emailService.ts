import "dotenv/config";

import nodemailer from "nodemailer";
import { pick } from "siftutils";

const { DEV_EMAIL, RESEND_API_KEY } = pick(
  process.env,
  ["DEV_EMAIL", "RESEND_API_KEY"],
  true,
);

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  secure: true,
  port: 465,
  auth: {
    user: "resend",
    pass: RESEND_API_KEY!,
  },
});
const defaultFromAddress = "Sift <app@getsift.today>";

interface Email {
  from?: string;
  to: string;
  subject: string;
  body: string;
}
export async function send({ from, to, subject, body }: Email) {
  await transporter.sendMail({
    from: from ?? defaultFromAddress,
    to,
    subject,
    html: body,
  });
}

export async function sendToDev({ from, subject, body }: Omit<Email, "to">) {
  await transporter.sendMail({
    from: from ?? defaultFromAddress,
    to: DEV_EMAIL!,
    subject,
    html: body,
  });
}
