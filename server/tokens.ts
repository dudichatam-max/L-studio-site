import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

function hmacKey(secret: string) {
  return createHash("sha256").update(`l-studio-pro-hmac:${secret}`).digest();
}

function sealKey(secret: string) {
  return createHash("sha256").update(`l-studio-pro-seal:${secret}`).digest();
}

export function mintDownloadToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashDownloadToken(token: string, secret: string): string {
  return createHmac("sha256", hmacKey(secret)).update(token).digest("hex");
}

export function sealDownloadToken(token: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sealKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function unsealDownloadToken(sealed: string, secret: string): string | null {
  try {
    const buf = Buffer.from(sealed, "base64url");
    if (buf.length < 12 + 16 + 1) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", sealKey(secret), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function isTokenShape(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,128}$/.test(token);
}
