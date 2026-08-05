import "server-only";

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) throw new Error("SMTP is not configured");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!from) throw new Error("SMTP_FROM is not configured");

  await getTransporter().sendMail({ from, to: input.to, subject: input.subject, html: input.html });
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character
  );
}
