import "dotenv/config";

import * as fs from "node:fs";
import * as path from "node:path";
import nodemailer from "nodemailer";
import { pick } from "siftutils";
import Handlebars from "handlebars";
import { emailTemplatesDir } from "../constants.ts";

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

export const precompiledTemplates = {
  updateIncorrectMatchAdminEmail: Handlebars.compile(
    fs.readFileSync(
      path.join(emailTemplatesDir, "UpdateIncorrectMatchAdminEmail.handlebars"),
      { encoding: "utf-8" },
    ),
  ),
};

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
