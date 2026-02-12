import nodemailer from "nodemailer";

function createTransporter() {
  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT) || 587;
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP credentials not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transporter = createTransporter();
  const from = import.meta.env.SMTP_FROM || import.meta.env.SMTP_USER;

  await transporter.sendMail({ from, to, subject, html });
}
