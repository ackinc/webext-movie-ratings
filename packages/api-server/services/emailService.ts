import "dotenv/config";

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import nodemailer from "nodemailer";
import { pick } from "siftutils";
import Handlebars from "handlebars";
import logger from "./logger.ts";
import { emailTemplatesDir } from "../constants.ts";

const { APP_ENV, DEV_EMAIL, RESEND_API_KEY } = pick(
  process.env,
  ["APP_ENV", "DEV_EMAIL", "RESEND_API_KEY"],
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
  from?: string | undefined;
  to: string;
  subject: string;
  body: string;
}
export async function send({ from, to, subject, body }: Email) {
  // We usually don't want emails going out during dev
  // The few times that we actually do, just comment this block out
  if (APP_ENV === "development") {
    const tempfile = path.join(
      tmpdir(),
      `${subject.toLowerCase().replace(/\W+/g, "_")}-${+new Date()}.html`,
    );
    await fs.promises.writeFile(tempfile, body);
    logger.info(`Saved email at "${tempfile}"`);
    return;
  }

  await transporter.sendMail({
    from: from ?? defaultFromAddress,
    to,
    subject,
    html: body,
  });
}

export async function sendToDev({ from, subject, body }: Omit<Email, "to">) {
  await send({ from, to: DEV_EMAIL!, subject, body });
}
