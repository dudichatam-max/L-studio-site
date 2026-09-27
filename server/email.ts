import type { CommerceConfig } from "./config";

export type EmailResult = "sent" | "skipped" | "failed";

export type DownloadEmailContent = {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

function safeEmail(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizeSignupEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return safeEmail(value.toLowerCase());
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function httpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

function button(href: string, label: string): string {
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;">`,
    `<tr>`,
    `<td align="center" bgcolor="#e3c565" style="border-radius:999px;background-color:#e3c565;">`,
    `<a href="${escapeHtml(href)}" style="display:block;padding:16px 24px;font-family:Heebo,Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:700;color:#0b0b0c;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>`,
    `</td>`,
    `</tr>`,
    `</table>`,
  ].join("");
}

function linkLine(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="color:#e3c565;font-weight:700;text-decoration:underline;">${escapeHtml(label)}</a>`;
}

export function buildDownloadEmail(input: {
  productName: string;
  downloadUrl: string;
  guideUrl: string;
  orderId: string;
  supportEmail: string;
}): DownloadEmailContent {
  const productName = input.productName.trim() || "L Studio Pro";
  const downloadHref = httpUrl(input.downloadUrl);
  const guideHref = httpUrl(input.guideUrl);
  const support = safeEmail(input.supportEmail);
  const subject = `Your ${productName} download`;
  const downloadText = downloadHref || input.downloadUrl.trim();
  const guideText = guideHref || input.guideUrl.trim();
  const supportText = support || input.supportEmail.trim();

  const text = [
    `תודה על הרכישה של ${productName}.`,
    "ההורדה מוכנה.",
    "",
    "הקישור עובד פעם אחת ופג אחרי כשעה:",
    downloadText,
    "",
    "מדריך למשתמש:",
    guideText,
    "",
    `מספר הזמנה: ${input.orderId}`,
    `אם ההורדה נכשלת, כתבו אל ${supportText} וצרפו את מזהה ההזמנה.`,
    "הקובץ לשימוש אישי. אין לפרסם את הקישור.",
    "",
    "English",
    "",
    `Thank you for purchasing ${productName}.`,
    "Your download is ready.",
    "",
    "This link works once and expires in about one hour:",
    downloadText,
    "",
    "User guide:",
    guideText,
    "",
    `Order: ${input.orderId}`,
    `If the download fails, contact ${supportText} and include the order id.`,
    "The file is for your personal use. Do not publish the link.",
  ].join("\n");

  const name = escapeHtml(productName);
  const order = escapeHtml(input.orderId);
  const supportHtml = support
    ? `<a href="mailto:${escapeHtml(support)}" style="color:#e3c565;text-decoration:underline;">${escapeHtml(support)}</a>`
    : escapeHtml(supportText);
  const downloadButton = downloadHref
    ? button(downloadHref, `הורדת APK של ${productName}`)
    : "";
  const downloadButtonEn = downloadHref
    ? button(downloadHref, `Download ${productName} APK`)
    : "";
  const guideLink = guideHref
    ? linkLine(guideHref, "מדריך למשתמש")
    : escapeHtml(guideText);
  const guideLinkEn = guideHref
    ? linkLine(guideHref, "User guide")
    : escapeHtml(guideText);
  const downloadPlain = `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#c8c6bf;word-break:break-all;">${escapeHtml(downloadText)}</p>`;

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0b0c;">
<table role="presentation" lang="he" dir="rtl" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0b0c" style="background-color:#0b0b0c;margin:0;padding:0;">
<tr>
<td style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#0b0b0c;">
הקישור עובד פעם אחת ופג אחרי כשעה.
</td>
</tr>
<tr>
<td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#141416" style="max-width:560px;background-color:#141416;border:1px solid #2c2c30;border-radius:16px;">
<tr>
<td style="height:4px;background-color:#e3c565;border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td>
</tr>
<tr>
<td style="padding:28px 28px 8px;font-family:Heebo,Arial,Helvetica,sans-serif;color:#f2f1eb;">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.4;letter-spacing:0.16em;color:#e3c565;">L STUDIO PRO</p>
<h1 style="margin:16px 0 0;font-size:28px;line-height:1.25;font-weight:700;color:#f2f1eb;">תודה על הרכישה של ${name}</h1>
<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#f2f1eb;">ההורדה מוכנה. הקישור עובד פעם אחת ופג אחרי כשעה.</p>
${downloadButton}
${downloadPlain}
<h2 style="margin:28px 0 0;font-size:18px;line-height:1.4;font-weight:700;color:#f2f1eb;">מדריך למשתמש</h2>
<p style="margin:8px 0 0;font-size:16px;line-height:1.6;color:#c8c6bf;">${guideLink}</p>
<p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#c8c6bf;">מספר הזמנה: ${order}</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#c8c6bf;">אם ההורדה נכשלת, כתבו אל ${supportHtml} וצרפו את מזהה ההזמנה.</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#c8c6bf;">הקובץ לשימוש אישי. אין לפרסם את הקישור.</p>
</td>
</tr>
<tr>
<td lang="en" dir="ltr" style="padding:8px 28px 28px;font-family:Arial,Helvetica,sans-serif;color:#f2f1eb;border-top:1px solid #2c2c30;">
<p style="margin:20px 0 0;font-size:12px;line-height:1.4;letter-spacing:0.14em;color:#e3c565;">ENGLISH</p>
<h2 style="margin:12px 0 0;font-size:22px;line-height:1.3;font-weight:700;color:#f2f1eb;">Thank you for purchasing ${name}</h2>
<p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#f2f1eb;">Your download is ready. This link works once and expires in about one hour.</p>
${downloadButtonEn}
${downloadPlain}
<h3 style="margin:28px 0 0;font-size:18px;line-height:1.4;font-weight:700;color:#f2f1eb;">User guide</h3>
<p style="margin:8px 0 0;font-size:16px;line-height:1.6;color:#c8c6bf;">${guideLinkEn}</p>
<p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#c8c6bf;">Order: ${order}</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#c8c6bf;">If the download fails, contact ${supportHtml} and include the order id.</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#c8c6bf;">The file is for your personal use. Do not publish the link.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  return {
    subject,
    text,
    html,
    ...(support ? { replyTo: support } : {}),
  };
}

export type OwnerNoticeEvent = "signup" | "download";

export type OwnerNoticeInput = {
  event: OwnerNoticeEvent;
  orderId: string;
  name: string;
  email: string;
  details: Record<string, string>;
  atIso: string;
  signups: number;
  limit: number;
  remaining: number;
  downloadedTesters: number;
  testerDownloadCount: number;
};

function detailLines(details: Record<string, string>): string {
  const entries = Object.entries(details);
  if (!entries.length) return "(none)";
  return entries.map(([key, value]) => `${key}: ${value}`).join("\n");
}

function noticeParts(input: OwnerNoticeInput): { subject: string; hebrew: string; english: string } {
  const displayName = input.name.trim() || "(none)";
  const other = detailLines(input.details);
  const spotsHe = `${input.signups} בשימוש, ${input.remaining} נותרו (מתוך ${input.limit})`;
  const spotsEn = `${input.signups} used, ${input.remaining} remaining (limit ${input.limit})`;
  if (input.event === "signup") {
    return {
      subject: `נרשם בודק חדש: ${input.email} / Add to Google Play internal testing`,
      hebrew: [
        `אימייל הבודק: ${input.email}`,
        "",
        "נרשם בודק חדש לגישה המוקדמת של L Studio.",
        `הוסף את ${input.email} לבדיקה פנימית ב-Google Play (14 יום) ושלח לו בעצמך את הזמנת Play.`,
        "האתר לא שולח APK ולא קישור הורדה.",
        "",
        `שם: ${displayName}`,
        "שדות נוספים:",
        other,
        `זמן: ${input.atIso}`,
        `מקומות: ${spotsHe}`,
        `סה״כ נרשמים: ${input.signups}`,
      ].join("\n"),
      english: [
        `Tester email: ${input.email}`,
        "",
        "A new Early Access tester signed up.",
        `Add ${input.email} to Google Play internal testing (14 days) and email them the Play invite yourself.`,
        "The website does not send an APK or a download link.",
        "",
        `Name: ${displayName}`,
        "Other fields:",
        other,
        `Time: ${input.atIso}`,
        `Spots: ${spotsEn}`,
        `Total signups: ${input.signups}`,
      ].join("\n"),
    };
  }
  return {
    subject: "הורדת APK ראשונה / First Early Access download",
    hebrew: [
      "בודק הוריד את קובץ ה-APK בפעם הראשונה.",
      "",
      `שם: ${displayName}`,
      `אימייל: ${input.email}`,
      `זמן: ${input.atIso}`,
      `הורדות של הבודק: ${input.testerDownloadCount}`,
      `בודקים שהורידו: ${input.downloadedTesters} מתוך ${input.signups}`,
      `מקומות: ${spotsHe}`,
      `סה״כ נרשמים: ${input.signups}`,
    ].join("\n"),
    english: [
      "A tester downloaded the APK for the first time.",
      "",
      `Name: ${displayName}`,
      `Email: ${input.email}`,
      `Time: ${input.atIso}`,
      `This tester's downloads: ${input.testerDownloadCount}`,
      `Testers who downloaded: ${input.downloadedTesters} of ${input.signups}`,
      `Spots: ${spotsEn}`,
      `Total signups: ${input.signups}`,
    ].join("\n"),
  };
}

export function buildOwnerEarlyAccessNotice(input: OwnerNoticeInput): DownloadEmailContent {
  const parts = noticeParts(input);
  const text = [parts.hebrew, "", "English", "", parts.english].join("\n");
  const html = `<!DOCTYPE html>
<html lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(parts.subject)}</title>
</head>
<body style="margin:0;padding:24px;background-color:#0b0b0c;color:#f2f1eb;font-family:Arial,Helvetica,sans-serif;">
<pre dir="rtl" style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;">${escapeHtml(parts.hebrew)}</pre>
<pre dir="ltr" style="white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;border-top:1px solid #2c2c30;padding-top:16px;">${escapeHtml(parts.english)}</pre>
</body>
</html>`;
  return { subject: parts.subject, text, html };
}

async function sendResend(
  config: CommerceConfig,
  to: string,
  content: DownloadEmailContent,
  idempotencyKey: string
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to: [to],
      subject: content.subject,
      text: content.text,
      html: content.html,
      ...(content.replyTo ? { reply_to: content.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`resend_${response.status}`);
  }
}

async function sendSmtp(
  config: CommerceConfig,
  to: string,
  content: DownloadEmailContent
): Promise<void> {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: config.smtpUser
      ? { user: config.smtpUser, pass: config.smtpPass }
      : undefined,
  });
  await transport.sendMail({
    from: config.smtpFrom,
    to,
    subject: content.subject,
    text: content.text,
    html: content.html,
    ...(content.replyTo ? { replyTo: content.replyTo } : {}),
  });
}

export async function sendDownloadEmail(
  config: CommerceConfig,
  input: { to: string; downloadUrl: string; orderId: string }
): Promise<EmailResult> {
  const to = safeEmail(input.to);
  if (!to) {
    console.log(
      `commerce email skipped for order ${input.orderId}: no payer email`
    );
    return "skipped";
  }
  if (!config.emailConfigured) {
    console.log(
      `commerce email skipped for order ${input.orderId}: no RESEND_API_KEY/RESEND_FROM or SMTP_* provider`
    );
    return "skipped";
  }
  const content = buildDownloadEmail({
    productName: config.productName,
    downloadUrl: input.downloadUrl,
    guideUrl: config.guideUrl,
    orderId: input.orderId,
    supportEmail: config.supportEmail,
  });
  const idempotencyKey = `download-email/${input.orderId.replace(/[\r\n]/g, "")}`.slice(0, 256);
  try {
    if (config.resendApiKey && config.resendFrom) {
      await sendResend(config, to, content, idempotencyKey);
    } else {
      await sendSmtp(config, to, content);
    }
    console.log(`commerce email sent for order ${input.orderId}`);
    return "sent";
  } catch (error) {
    console.error(
      `commerce email failed for order ${input.orderId}: ${error instanceof Error ? error.message : "error"}`
    );
    return "failed";
  }
}

export async function sendOwnerEarlyAccessNotice(config: CommerceConfig, input: OwnerNoticeInput): Promise<EmailResult> {
  const to = safeEmail(config.ownerNotifyEmail);
  if (!to) {
    console.error(`owner early access notify skipped (${input.event}) for order ${input.orderId}: invalid OWNER_NOTIFY_EMAIL`);
    return "skipped";
  }
  if (!config.emailConfigured) {
    console.error(`owner early access notify skipped (${input.event}) for order ${input.orderId}: email provider is not configured`);
    return "skipped";
  }
  const content = buildOwnerEarlyAccessNotice(input);
  const idempotencyKey = `owner-notify/early-access/${input.event}/${input.orderId.replace(/[\r\n]/g, "")}`.slice(0, 256);
  try {
    if (config.resendApiKey && config.resendFrom) {
      await sendResend(config, to, content, idempotencyKey);
    } else {
      await sendSmtp(config, to, content);
    }
    console.log(`owner early access notify sent (${input.event}) for order ${input.orderId}`);
    return "sent";
  } catch (error) {
    console.error(
      `owner early access notify failed (${input.event}) for order ${input.orderId}: ${error instanceof Error ? error.message : "error"}`,
    );
    return "failed";
  }
}
