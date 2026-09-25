import { createServer } from "node:http";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { apkStatus, ensureApk } from "./apk";
import { getConfig } from "./config";
import { attachCommerceApi, isAllowedOrigin, prepareCommerce, resetCommerceForTests } from "./commerce";
import { verifyPaidOrder } from "./paypal";
import { getStore } from "./store";
import { hashDownloadToken, mintDownloadToken, sealDownloadToken, unsealDownloadToken } from "./tokens";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function listen(app: express.Express) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  return {
    port: address.port,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

async function request(port: number, method: string, urlPath: string, body?: string, headers: Record<string, string> = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers,
    body,
  });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, text, json, headers: response.headers };
}

function paidOrder(amount = "4.00") {
  return {
    id: "5O190127TN364715T",
    status: "COMPLETED",
    payer: { email_address: "buyer@example.com" },
    purchase_units: [
      {
        reference_id: "l-studio-pro",
        custom_id: "l-studio-pro",
        amount: { currency_code: "USD", value: amount },
        payments: { captures: [{ id: "CAP123456789", status: "COMPLETED", amount: { currency_code: "USD", value: amount } }] },
      },
    ],
  };
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "l-studio-commerce-"));
  const apkFile = path.join(root, "app.apk");
  const apkBytes = Buffer.from("l-studio-pro-selfcheck-apk");
  fs.writeFileSync(apkFile, apkBytes);
  const apkSha = createHash("sha256").update(apkBytes).digest("hex");
  const secret = "selfcheck-download-secret";
  const dataDir = path.join(root, "data");

  const baseEnv = {
    DATA_DIR: dataDir,
    DOWNLOAD_TOKEN_SECRET: secret,
    APK_PATH: apkFile,
    APK_SHA256: apkSha,
    PAYPAL_MODE: "sandbox",
    PRODUCT_PRICE_USD: "4.00",
    PUBLIC_BASE_URL: "",
    PAYPAL_CLIENT_ID: "",
    PAYPAL_CLIENT_SECRET: "",
    NODE_ENV: "test",
  };
  for (const [key, value] of Object.entries(baseEnv)) process.env[key] = value;
  delete process.env.APK_SOURCE_URL;
  resetCommerceForTests();

  const round = unsealDownloadToken(sealDownloadToken("abc", secret), secret);
  assert(round === "abc", "token seal roundtrip");

  const verified = verifyPaidOrder(paidOrder(), 400);
  assert(verified.ok && verified.payment.captureId === "CAP123456789", "verified sandbox-shaped order");
  assert(!verifyPaidOrder(paidOrder("5.00"), 400).ok, "amount mismatch rejected");
  assert(!verifyPaidOrder({ ...paidOrder(), status: "APPROVED" }, 400).ok, "unpaid order rejected");

  assert(isAllowedOrigin("https://l-studio.studio", "example.up.railway.app", ""), "pages origin");
  assert(isAllowedOrigin("http://localhost:5173", "localhost", ""), "localhost origin");
  assert(!isAllowedOrigin("https://evil.example", "example.up.railway.app", ""), "foreign origin blocked");
  assert(isAllowedOrigin("https://example.up.railway.app", "example.up.railway.app", ""), "same host origin");

  const app = express();
  app.set("trust proxy", 1);
  await prepareCommerce();
  await ensureApk(getConfig());
  assert(apkStatus() === "ready", `apk ready, got ${apkStatus()}`);
  attachCommerceApi(app);
  const server = await listen(app);

  try {
    const health = await request(server.port, "GET", "/api/health");
    assert(health.status === 200 && (health.json as { ok?: boolean }).ok === true, "health");
    assert((health.json as { apkStatus?: string }).apkStatus === "ready", "health apk");
    assert((health.json as { paypalConfigured?: boolean }).paypalConfigured === false, "paypal off without credentials");

    const created = await request(server.port, "POST", "/api/paypal/create-order", "{}", { "Content-Type": "application/json" });
    assert(created.status === 503, "create-order refuses without credentials");

    const badOrigin = await request(server.port, "GET", "/api/health", undefined, { Origin: "https://evil.example" });
    assert(badOrigin.status === 403, "cors reject");
    const pagesOrigin = await request(server.port, "GET", "/api/health", undefined, { Origin: "https://l-studio.studio" });
    assert(pagesOrigin.status === 200 && pagesOrigin.headers.get("access-control-allow-origin") === "https://l-studio.studio", "cors pages");

    const missing = await request(server.port, "GET", "/api/download/not-a-real-token-value");
    assert(missing.status === 404, "unknown token");

    const token = mintDownloadToken();
    const store = getStore(dataDir);
    const issued = store.issueToken({
      orderId: "5O190127TN364715T",
      captureId: "CAP123456789",
      payerEmail: "buyer@example.com",
      amount: "4.00",
      currency: "USD",
      tokenHash: hashDownloadToken(token, secret),
      sealedToken: sealDownloadToken(token, secret),
      ttlMs: 60 * 60 * 1000,
    });
    assert(issued.result === "issued", "token issued");

    const download = await fetch(`http://127.0.0.1:${server.port}/api/download/${token}`);
    const bytes = Buffer.from(await download.arrayBuffer());
    assert(download.status === 200, "download status");
    assert(download.headers.get("content-disposition")?.includes("L-Studio-Pro.apk"), "attachment name");
    assert(bytes.equals(apkBytes), "apk bytes");

    const again = await request(server.port, "GET", `/api/download/${token}`);
    assert(again.status === 410, "single use");

    const reused = store.issueToken({
      orderId: "5O190127TN364715T",
      captureId: "CAP123456789",
      payerEmail: "buyer@example.com",
      amount: "4.00",
      currency: "USD",
      tokenHash: hashDownloadToken(mintDownloadToken(), secret),
      sealedToken: "unused",
      ttlMs: 60 * 60 * 1000,
    });
    assert(reused.result === "used", "no second token after download");

    const invalid = await request(server.port, "POST", "/api/paypal/capture-order", JSON.stringify({ orderId: "nope" }), {
      "Content-Type": "application/json",
    });
    assert(invalid.status === 400, "bad order id");
  } finally {
    await server.close();
  }

  process.env.APK_SHA256 = "a".repeat(64);
  resetCommerceForTests();
  await prepareCommerce();
  await ensureApk(getConfig());
  assert(apkStatus() === "checksum_mismatch", `checksum gate, got ${apkStatus()}`);

  const publicDir = path.join(root, "client", "public");
  fs.mkdirSync(publicDir, { recursive: true });
  const publicApk = path.join(publicDir, "leak.apk");
  fs.writeFileSync(publicApk, apkBytes);
  const previousCwd = process.cwd();
  process.chdir(root);
  try {
    process.env.APK_PATH = publicApk;
    process.env.APK_SHA256 = apkSha;
    resetCommerceForTests();
    await prepareCommerce();
    await ensureApk(getConfig());
    assert(apkStatus() === "unreadable", `public path blocked, got ${apkStatus()}`);
  } finally {
    process.chdir(previousCwd);
  }

  fs.rmSync(root, { recursive: true, force: true });
  console.log("commerce selfcheck ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
