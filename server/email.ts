import type { CommerceConfig } from "./config";

export type EmailResult = "sent" | "skipped" | "failed";

function safeEmail(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

function messageText(input: { productName: string; downloadUrl: string; orderId: string; supportEmail: string }) {
  return [
    `Your ${input.productName} download is ready.`,
    "",
    "This link works once and expires in about one hour:",
    input.downloadUrl,
    "",
    `PayPal order: ${input.orderId}`,
    "",
    `If the download fails, contact ${input.supportEmail} and include the order id.`,
    "",
    "The file is for your personal use. Do not publish the link.",
  ].join("\n");
}

async function sendResend(config: CommerceConfig, to: string, subject: string, text: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`resend_${response.status}`);
  }
}

async function sendSmtp(config: CommerceConfig, to: string, subject: string, text: string): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
  });
  await transport.sendMail({
    from: config.smtpFrom,
    to,
    subject,
    text,
  });
}

export async function sendDownloadEmail(
  config: CommerceConfig,
  input: { to: string; downloadUrl: string; orderId: string },
): Promise<EmailResult> {
  const to = safeEmail(input.to);
  if (!to) {
    console.log(`commerce email skipped for order ${input.orderId}: no payer email`);
    return "skipped";
  }
  if (!config.emailConfigured) {
    console.log(`commerce email skipped for order ${input.orderId}: no RESEND_API_KEY/RESEND_FROM or SMTP_* provider`);
    return "skipped";
  }
  const subject = `Your ${config.productName} download`;
  const text = messageText({
    productName: config.productName,
    downloadUrl: input.downloadUrl,
    orderId: input.orderId,
    supportEmail: config.supportEmail,
  });
  try {
    if (config.resendApiKey && config.resendFrom) {
      await sendResend(config, to, subject, text);
    } else {
      await sendSmtp(config, to, subject, text);
    }
    console.log(`commerce email sent for order ${input.orderId}`);
    return "sent";
  } catch (error) {
    console.error(`commerce email failed for order ${input.orderId}: ${error instanceof Error ? error.message : "error"}`);
    return "failed";
  }
}
