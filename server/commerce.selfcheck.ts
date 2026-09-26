import { createServer } from "node:http";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { apkStatus, ensureApk } from "./apk";
import { getConfig, resetConfigForTests } from "./config";
import { attachCommerceApi, isAllowedOrigin, prepareCommerce, resetCommerceForTests } from "./commerce";
import {
  acceptCreatedOrder,
  createOrderAmountWasUnexpected,
  formatCreateOrderAmountDiagnostic,
  resetPaypalCacheForTests,
  verifyPaidOrder,
} from "./paypal";
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
  assert(!verifyPaidOrder({ id: "5O190127TN364715T", status: "COMPLETED" }, 400).ok, "capture still rejects missing amount");

  const createdId = "5O190127TN364715T";
  const minimalCreate = { id: createdId, status: "CREATED" };
  assert(acceptCreatedOrder(minimalCreate).ok, "create accepts CREATED without amount");
  assert(
    acceptCreatedOrder({
      id: createdId,
      status: "PAYER_ACTION_REQUIRED",
      purchase_units: [{ amount: { currency_code: "EUR", value: "1.00" } }],
    }).ok,
    "create accepts payer action without amount match",
  );
  assert(acceptCreatedOrder({ id: createdId }).ok, "create accepts missing status when order id shape is valid");
  assert(acceptCreatedOrder({ id: "ABC", status: "CREATED" }).ok, "create accepts a present id with CREATED");
  assert(!acceptCreatedOrder({ status: "CREATED" }).ok, "create rejects missing id");
  assert(!acceptCreatedOrder({ id: "ABC" }).ok, "create rejects missing status with a short id");
  assert(!acceptCreatedOrder({ id: "not a paypal id", status: "CREATED" }).ok, "create rejects an unsafe id");
  assert(!acceptCreatedOrder({ id: createdId, status: "VOIDED" }).ok, "create rejects unexpected status");
  assert(!acceptCreatedOrder({ id: createdId, status: "COMPLETED" }).ok, "create does not treat COMPLETED as create success");
  assert(createOrderAmountWasUnexpected(minimalCreate, 400), "missing create amount is the old failure");
  assert(
    !createOrderAmountWasUnexpected({ ...minimalCreate, purchase_units: [{ amount: { currency_code: "USD", value: "4.00" } }] }, 400),
    "matching create amount is not flagged",
  );
  const missingAmountDiag = formatCreateOrderAmountDiagnostic(minimalCreate);
  assert(missingAmountDiag.includes(`id=${createdId}`), "diagnostic includes order id");
  assert(missingAmountDiag.includes("status=CREATED"), "diagnostic includes status");
  assert(missingAmountDiag.includes("currency=missing") && missingAmountDiag.includes("value=missing"), "diagnostic marks missing amount");
  assert(!missingAmountDiag.includes("purchase_units"), "diagnostic is not an order dump");
  const oddAmountDiag = formatCreateOrderAmountDiagnostic({
    id: createdId,
    status: "PAYER_ACTION_REQUIRED",
    purchase_units: [{ amount: { currency_code: "EUR", value: "9.99" } }],
  });
  assert(oddAmountDiag.includes("currency=EUR") && oddAmountDiag.includes("value=9.99"), "diagnostic includes amount fields");
  assert(!oddAmountDiag.includes("client_secret") && !oddAmountDiag.includes("access_token"), "diagnostic has no secret fields");

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

    process.env.PAYPAL_CLIENT_ID = "selfcheck-client";
    process.env.PAYPAL_CLIENT_SECRET = "selfcheck-paypal-secret";
    resetConfigForTests();
    resetPaypalCacheForTests();
    const paypalBodies = [
      { id: "5O190127TN364715T", status: "CREATED" },
      {
        id: "5O190127TN364715T",
        status: "PAYER_ACTION_REQUIRED",
        purchase_units: [{ amount: { currency_code: "EUR", value: "9.99" } }],
      },
      { id: "5O190127TN364715T" },
      { status: "CREATED", purchase_units: [{ amount: { currency_code: "USD", value: "4.00" } }] },
      { id: "5O190127TN364715T", status: "VOIDED" },
    ];
    const originalFetch = globalThis.fetch;
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map((item) => String(item)).join(" "));
    };
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith("/v1/oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "selfcheck-access-token", expires_in: 300 }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      if (url.endsWith("/v2/checkout/orders") && (init?.method || "GET") === "POST") {
        const body = paypalBodies.shift();
        if (!body) return new Response("missing", { status: 500 });
        return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
      }
      return originalFetch(input, init);
    };
    try {
      const minimal = await request(server.port, "POST", "/api/paypal/create-order", "{}", { "Content-Type": "application/json" });
      assert(minimal.status === 200, "create accepts omitted amount");
      assert((minimal.json as { id?: string }).id === "5O190127TN364715T", "create returns order id");
      assert(warnings.some((line) => line.includes("currency=missing") && line.includes("value=missing")), "missing amount is logged");

      warnings.length = 0;
      const odd = await request(server.port, "POST", "/api/paypal/create-order", "{}", { "Content-Type": "application/json" });
      assert(odd.status === 200, "create accepts odd amount");
      assert(warnings.some((line) => line.includes("currency=EUR") && line.includes("value=9.99")), "odd amount is logged");

      warnings.length = 0;
      const noStatus = await request(server.port, "POST", "/api/paypal/create-order", "{}", { "Content-Type": "application/json" });
      assert(noStatus.status === 200, "create accepts missing status with order id");
      assert(warnings.some((line) => line.includes("status=missing")), "missing status is logged");

      const noId = await request(server.port, "POST", "/api/paypal/create-order", "{}", { "Content-Type": "application/json" });
      assert(noId.status === 502, "create rejects missing id");

      const voided = await request(server.port, "POST", "/api/paypal/create-order", "{}", { "Content-Type": "application/json" });
      assert(voided.status === 502, "create rejects unexpected status");

      const logged = warnings.join("\n");
      assert(!logged.includes("selfcheck-paypal-secret"), "paypal secret was written to logs");
      assert(!logged.includes("selfcheck-access-token"), "paypal access token was written to logs");
    } finally {
      globalThis.fetch = originalFetch;
      console.warn = originalWarn;
      process.env.PAYPAL_CLIENT_ID = "";
      process.env.PAYPAL_CLIENT_SECRET = "";
      resetConfigForTests();
      resetPaypalCacheForTests();
    }

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

  const githubToken = "github_pat_selfcheckonly";
  const fallbackToken = "ghs_selfcheckfallback";
  const redirectUrl = "https://release-assets.githubusercontent.com/private/apk.bin?jwt=temp-credential";
  type Hop = { url: string; authorization: string | null; accept: string | null; apiVersion: string | null };
  const hops: Hop[] = [];
  const originalFetch = globalThis.fetch;
  const log = console.log;
  const err = console.error;
  const lines: string[] = [];
  console.log = (...args: unknown[]) => {
    lines.push(args.map((item) => String(item)).join(" "));
  };
  console.error = (...args: unknown[]) => {
    lines.push(args.map((item) => String(item)).join(" "));
  };
  const record = (input: RequestInfo | URL, init?: RequestInit): Hop => {
    const url = input instanceof URL ? input.href : String(input);
    const headers = new Headers(init?.headers);
    const hop = {
      url,
      authorization: headers.get("authorization"),
      accept: headers.get("accept"),
      apiVersion: headers.get("x-github-api-version"),
    };
    hops.push(hop);
    return hop;
  };
  try {
    delete process.env.APK_PATH;
    process.env.APK_SHA256 = apkSha;
    process.env.APK_GITHUB_TOKEN = `Bearer ${githubToken}`;
    process.env.GITHUB_TOKEN = fallbackToken;
    process.env.APK_SOURCE_URL = "https://api.github.com/repos/dudichatam-max/L-studio/releases/assets/588219111";
    process.env.DATA_DIR = path.join(root, "gh-api");
    globalThis.fetch = async (input, init) => {
      const hop = record(input, init);
      if (hop.url.startsWith("https://api.github.com/")) {
        return new Response(null, { status: 302, headers: { location: redirectUrl } });
      }
      if (hop.url.startsWith("https://release-assets.githubusercontent.com/")) return new Response(apkBytes);
      return new Response("missing", { status: 404 });
    };
    resetCommerceForTests();
    await ensureApk(getConfig());
    assert(apkStatus() === "ready", `private api asset fetch, got ${apkStatus()}`);
    assert(hops[0]?.authorization === `Bearer ${githubToken}`, "api asset request missing bearer");
    assert(hops[0]?.accept === "application/octet-stream", "api asset request missing octet-stream accept");
    assert(hops[0]?.apiVersion === "2022-11-28", "api asset request missing github api version");
    assert(hops[1]?.url === redirectUrl, "api asset redirect was not followed");
    assert(hops[1]?.authorization === null, "github token was sent to the release cdn");
    const stored = path.join(process.env.DATA_DIR, "l-studio-pro.apk");
    assert(fs.existsSync(stored), "fetched apk stored in data dir");
    assert((fs.statSync(stored).mode & 0o077) === 0, "fetched apk is group/world readable");

    hops.length = 0;
    delete process.env.APK_GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = fallbackToken;
    process.env.APK_SOURCE_URL =
      "https://github.com/dudichatam-max/L-studio/releases/download/website-pro-qa-welcomes-20260925/L-Studio-website-release.apk";
    process.env.DATA_DIR = path.join(root, "gh-browser");
    globalThis.fetch = async (input, init) => {
      const hop = record(input, init);
      if (hop.url.startsWith("https://github.com/")) {
        return new Response(null, { status: 302, headers: { location: redirectUrl } });
      }
      if (hop.url.startsWith("https://release-assets.githubusercontent.com/")) return new Response(apkBytes);
      return new Response("missing", { status: 404 });
    };
    resetCommerceForTests();
    await ensureApk(getConfig());
    assert(apkStatus() === "ready", `browser download url fetch, got ${apkStatus()}`);
    assert(hops[0]?.authorization === `Bearer ${fallbackToken}`, "GITHUB_TOKEN fallback missing");
    assert(hops[0]?.accept === "application/octet-stream", "browser download url missing octet-stream accept");
    assert(hops[1]?.authorization === null, "fallback token was sent to the release cdn");

    hops.length = 0;
    process.env.APK_GITHUB_TOKEN = githubToken;
    process.env.APK_SOURCE_URL = "https://example.com/private/L-Studio-Pro.apk";
    process.env.DATA_DIR = path.join(root, "gh-other");
    globalThis.fetch = async (input, init) => {
      record(input, init);
      return new Response(apkBytes);
    };
    resetCommerceForTests();
    await ensureApk(getConfig());
    assert(apkStatus() === "ready", `non-github url fetch, got ${apkStatus()}`);
    assert(hops.length === 1 && hops[0]?.authorization === null, "github token sent to a non-github host");

    hops.length = 0;
    process.env.APK_SOURCE_URL = "https://api.github.com/repos/dudichatam-max/L-studio/releases/assets/588219111";
    process.env.DATA_DIR = path.join(root, "gh-404");
    globalThis.fetch = async (input, init) => {
      record(input, init);
      return new Response("nope", { status: 404 });
    };
    resetCommerceForTests();
    await ensureApk(getConfig());
    assert(apkStatus() === "unreadable", `github 404, got ${apkStatus()}`);

    process.env.DATA_DIR = path.join(root, "gh-throw");
    globalThis.fetch = async () => {
      throw new Error(`connect ECONNRESET Bearer ${githubToken} ${githubToken} ${redirectUrl}`);
    };
    resetCommerceForTests();
    await ensureApk(getConfig());
    assert(apkStatus() === "unreadable", `github fetch throw, got ${apkStatus()}`);

    process.env.APK_SHA256 = apkSha;
    process.env.DATA_DIR = path.join(root, "gh-bad-bytes");
    globalThis.fetch = async (input, init) => {
      const hop = record(input, init);
      if (hop.url.startsWith("https://api.github.com/")) {
        return new Response(null, { status: 302, headers: { location: redirectUrl } });
      }
      return new Response(Buffer.from("not-the-approved-apk"));
    };
    resetCommerceForTests();
    await ensureApk(getConfig());
    assert(apkStatus() === "checksum_mismatch", `fetched checksum gate, got ${apkStatus()}`);

    const logged = lines.join("\n");
    assert(!logged.includes(githubToken), "github token was written to logs");
    assert(!logged.includes(fallbackToken), "fallback github token was written to logs");
    assert(!logged.includes("temp-credential"), "redirect credential was written to logs");
    assert(!logged.toLowerCase().includes("authorization:"), "authorization header was written to logs");
    assert(logged.includes("apk_fetch_failed"), "fetch failure was reported without the token");
  } finally {
    globalThis.fetch = originalFetch;
    console.log = log;
    console.error = err;
    delete process.env.APK_GITHUB_TOKEN;
    delete process.env.GITHUB_TOKEN;
  }

  fs.rmSync(root, { recursive: true, force: true });
  console.log("commerce selfcheck ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
