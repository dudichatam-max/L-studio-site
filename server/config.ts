import fs from "node:fs";
import path from "node:path";

/** Approved L Studio Pro APK: tag website-pro-qa-welcomes-20260925 @ 7efbe7d. */
export const APPROVED_APK_SHA256 = "28f976838cd6bed8daa77ebe6a84dd534028bca368cf551c62d49e3af1bd4436";
export const APPROVED_APK_BYTES = 24223751;
export const PRODUCT_CODE = "l-studio-pro";
export const TOKEN_TTL_MS = 60 * 60 * 1000;

export type PaypalMode = "sandbox" | "live";

export type CommerceConfig = {
  paypalClientId: string;
  paypalClientSecret: string;
  paypalMode: PaypalMode;
  paypalWebhookId: string;
  paypalConfigured: boolean;
  publicBaseUrl: string;
  downloadTokenSecret: string;
  priceUsd: string;
  priceCents: number;
  productName: string;
  supportEmail: string;
  apkPath: string;
  apkSourceUrl: string;
  apkSha256: string;
  dataDir: string;
  resendApiKey: string;
  resendFrom: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  emailConfigured: boolean;
  sitePublicUrl: string;
  guideUrl: string;
  earlyAccessLimit: number;
  configError: string;
};

let cached: CommerceConfig | null = null;

function loadLocalEnvFile() {
  const file = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Z0-9_]+$/.test(key)) continue;
    if (process.env[key] !== undefined) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export function toCents(value: string | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [dollars, fraction = ""] = trimmed.split(".");
  const cents = Number(dollars) * 100 + Number((fraction + "00").slice(0, 2));
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

export function centsToUsd(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

const DEFAULT_SITE_PUBLIC_URL = "https://l-studio.studio";

function resolveSitePublicUrl(raw: string | undefined): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return DEFAULT_SITE_PUBLIC_URL;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return DEFAULT_SITE_PUBLIC_URL;
    const path = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
    return `${url.origin}${path}`;
  } catch {
    return DEFAULT_SITE_PUBLIC_URL;
  }
}

function resolveGuideUrl(sitePublicUrl: string, raw: string | undefined): string {
  const fallback = `${sitePublicUrl}/guide`;
  const trimmed = (raw || "").trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/")) return `${sitePublicUrl}${trimmed}`.replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.href.replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

export function readEarlyAccessLimit(raw: string | undefined): number {
  const trimmed = (raw ?? "44").trim();
  if (!/^\d+$/.test(trimmed)) return 44;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value < 1 || value > 100_000) return 44;
  return value;
}

function readPrice(): { priceUsd: string; priceCents: number; error: string } {
  const raw = (process.env.PRODUCT_PRICE_USD || "4.00").trim();
  const cents = toCents(raw);
  if (cents === null || cents <= 0 || cents > 1_000_000) {
    return { priceUsd: "4.00", priceCents: 400, error: "PRODUCT_PRICE_USD must be a positive USD amount with at most 2 decimal places" };
  }
  return { priceUsd: centsToUsd(cents), priceCents: cents, error: "" };
}

export function getConfig(): CommerceConfig {
  if (cached) return cached;
  loadLocalEnvFile();
  const modeRaw = (process.env.PAYPAL_MODE || "sandbox").trim().toLowerCase();
  const paypalMode: PaypalMode = modeRaw === "live" ? "live" : "sandbox";
  const price = readPrice();
  const paypalClientId = (process.env.PAYPAL_CLIENT_ID || "").trim();
  const paypalClientSecret = (process.env.PAYPAL_CLIENT_SECRET || "").trim();
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const resendFrom = (process.env.RESEND_FROM || "").trim();
  const smtpHost = (process.env.SMTP_HOST || "").trim();
  const smtpFrom = (process.env.SMTP_FROM || "").trim();
  const smtpUser = (process.env.SMTP_USER || "").trim();
  const smtpPass = process.env.SMTP_PASS || "";
  const emailConfigured = Boolean((resendApiKey && resendFrom) || (smtpHost && smtpFrom));
  const sitePublicUrl = resolveSitePublicUrl(process.env.SITE_PUBLIC_URL);
  const guideUrl = resolveGuideUrl(sitePublicUrl, process.env.GUIDE_URL);
  let configError = price.error;
  if (modeRaw !== "sandbox" && modeRaw !== "live") {
    configError = configError || "PAYPAL_MODE must be sandbox or live";
  }
  cached = {
    paypalClientId,
    paypalClientSecret,
    paypalMode: modeRaw === "live" ? "live" : "sandbox",
    paypalWebhookId: (process.env.PAYPAL_WEBHOOK_ID || "").trim(),
    paypalConfigured: Boolean(paypalClientId && paypalClientSecret) && !configError && (modeRaw === "sandbox" || modeRaw === "live"),
    publicBaseUrl: (process.env.PUBLIC_BASE_URL || "").trim().replace(/\/+$/, ""),
    downloadTokenSecret: (process.env.DOWNLOAD_TOKEN_SECRET || "").trim(),
    priceUsd: price.priceUsd,
    priceCents: price.priceCents,
    productName: (process.env.PRODUCT_NAME || "L Studio Pro").trim() || "L Studio Pro",
    supportEmail: (process.env.SUPPORT_EMAIL || "dudichatam@gmail.com").trim() || "dudichatam@gmail.com",
    apkPath: (process.env.APK_PATH || "").trim(),
    apkSourceUrl: (process.env.APK_SOURCE_URL || "").trim(),
    apkSha256: (process.env.APK_SHA256 || APPROVED_APK_SHA256).trim().toLowerCase(),
    dataDir: path.resolve(process.env.DATA_DIR || path.join(process.cwd(), "data")),
    resendApiKey,
    resendFrom,
    smtpHost,
    smtpPort: Number(process.env.SMTP_PORT || 587),
    smtpUser,
    smtpPass,
    smtpFrom,
    emailConfigured,
    sitePublicUrl,
    guideUrl,
    earlyAccessLimit: readEarlyAccessLimit(process.env.EARLY_ACCESS_LIMIT),
    configError,
  };
  return cached;
}

export function resetConfigForTests() {
  cached = null;
}
