import { createServer } from "node:http";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { apkStatus, ensureApk } from "./apk";
import { getConfig, readEarlyAccessLimit, resetConfigForTests } from "./config";
import { buildDownloadEmail, buildEarlyAccessEmail, sendDownloadEmail } from "./email";
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
  delete process.env.SITE_PUBLIC_URL;
  delete process.env.GUIDE_URL;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM;
  resetCommerceForTests();
  resetConfigForTests();

  const defaultConfig = getConfig();
  assert(defaultConfig.sitePublicUrl === "https://l-studio.studio", "default site public url");
  assert(defaultConfig.guideUrl === "https://l-studio.studio/guide", "default guide url");

  process.env.SITE_PUBLIC_URL = "https://preview.example/";
  process.env.GUIDE_URL = "/guide/";
  resetConfigForTests();
  const joinedGuide = getConfig();
  assert(joinedGuide.sitePublicUrl === "https://preview.example", "site url trims slash");
  assert(joinedGuide.guideUrl === "https://preview.example/guide", "guide path joins site");

  process.env.GUIDE_URL = "https://docs.example/help/";
  resetConfigForTests();
  assert(getConfig().guideUrl === "https://docs.example/help", "absolute guide url");

  const message = buildDownloadEmail({
    productName: "L Studio Pro",
    downloadUrl: "https://buy.example/api/download/token",
    guideUrl: "https://l-studio.studio/guide",
    orderId: "5O190127TN364715T",
    supportEmail: "dudichatam@gmail.com",
  });
  assert(message.subject === "Your L Studio Pro download", "download subject");
  assert(!message.subject.includes("\u2014") && !message.text.includes("\u2014") && !message.html.includes("\u2014"), "no em dash");
  assert(message.text.startsWith("תודה על הרכישה"), "hebrew text first");
  assert(message.text.includes("Thank you for purchasing L Studio Pro"), "english text");
  assert(message.text.includes("https://buy.example/api/download/token"), "text download url");
  assert(message.text.includes("https://l-studio.studio/guide"), "text guide url");
  assert(message.text.includes("5O190127TN364715T"), "text order id");
  assert(message.text.includes("dudichatam@gmail.com"), "text support");
  assert(message.text.includes("פעם אחת") && message.text.includes("works once"), "expiry note");
  assert(message.html.includes('lang="he"') && message.html.includes('dir="rtl"'), "hebrew direction");
  assert(message.html.includes('lang="en"') && message.html.includes('dir="ltr"'), "english direction");
  assert(message.html.includes('role="presentation"'), "layout table");
  assert(message.html.includes("הורדת APK של L Studio Pro"), "hebrew download cta");
  assert(message.html.includes("Download L Studio Pro APK"), "english download cta");
  assert(message.html.includes('href="https://buy.example/api/download/token"'), "html download href");
  assert(message.html.includes('href="https://l-studio.studio/guide"'), "html guide href");
  assert(message.html.includes("<title>Your L Studio Pro download</title>"), "html title");
  assert(message.replyTo === "dudichatam@gmail.com", "reply to support");

  const hostile = buildDownloadEmail({
    productName: "L <Studio>",
    downloadUrl: 'https://buy.example/api/download/a<b>&c"',
    guideUrl: "https://l-studio.studio/guide?x=1&y=2",
    orderId: "ORD<1>",
    supportEmail: "not-an-email",
  });
  assert(!hostile.html.includes("<Studio>") && hostile.html.includes("L &lt;Studio&gt;"), "escaped product name");
  assert(!hostile.html.includes("ORD<1>") && hostile.html.includes("ORD&lt;1&gt;"), "escaped order id");
  assert(!hostile.html.includes('href="javascript:'), "no javascript href");
  assert(hostile.html.includes("a%3Cb%3E"), "download href encoded");
  assert(hostile.html.includes("y=2"), "guide query kept");
  assert(hostile.html.includes("&amp;"), "html ampersand escaped");
  assert(hostile.replyTo === undefined, "invalid support has no reply-to");

  const earlyMessage = buildEarlyAccessEmail({
    downloadUrl: "https://buy.example/api/download/token",
    guideUrl: "https://l-studio.studio/guide",
    supportEmail: "dudichatam@gmail.com",
  });
  assert(earlyMessage.subject === "L Studio Early Access: your free tester download", "early subject");
  assert(!/paypal/i.test(earlyMessage.subject + earlyMessage.text + earlyMessage.html), "early email has no paypal");
  assert(!/purchas|הרכישה/i.test(earlyMessage.subject + earlyMessage.text + earlyMessage.html), "early email is not a purchase receipt");
  assert(!earlyMessage.subject.includes("\u2014") && !earlyMessage.text.includes("\u2014") && !earlyMessage.html.includes("\u2014"), "early email has no em dash");
  assert(earlyMessage.text.startsWith("זו הגישה המוקדמת הרשמית"), "early hebrew first");
  assert(earlyMessage.text.includes("before the official launch"), "early launch framing");
  assert(earlyMessage.text.includes("לפני ההשקה הרשמית"), "early hebrew launch framing");
  assert(earlyMessage.text.includes("https://buy.example/api/download/token"), "early text download url");
  assert(earlyMessage.text.includes("https://l-studio.studio/guide"), "early text guide url");
  assert(earlyMessage.text.includes("dudichatam@gmail.com"), "early feedback address");
  assert(earlyMessage.text.includes("משוב אמיתי") && earlyMessage.text.includes("ביקורות"), "early hebrew feedback and reviews");
  assert(earlyMessage.text.includes("real feedback and reviews"), "early english feedback and reviews");
  assert(earlyMessage.html.includes('lang="he"') && earlyMessage.html.includes('dir="rtl"'), "early hebrew direction");
  assert(earlyMessage.html.includes('lang="en"') && earlyMessage.html.includes('dir="ltr"'), "early english direction");
  assert(earlyMessage.html.includes("הורדת ה-APK החינמית"), "early hebrew download cta");
  assert(earlyMessage.html.includes("Download the free APK"), "early english download cta");
  assert(earlyMessage.html.includes('href="https://l-studio.studio/guide"'), "early html guide href");
  assert(earlyMessage.replyTo === "dudichatam@gmail.com", "early reply to support");
  assert(readEarlyAccessLimit(undefined) === 44, "default early access limit");
  assert(readEarlyAccessLimit("44") === 44, "explicit early access limit");
  assert(readEarlyAccessLimit("0") === 44 && readEarlyAccessLimit("nope") === 44, "invalid early access limit falls back");

  process.env.RESEND_API_KEY = "re_selfcheck";
  process.env.RESEND_FROM = "L Studio <downloads@l-studio.studio>";
  delete process.env.SITE_PUBLIC_URL;
  delete process.env.GUIDE_URL;
  resetConfigForTests();
  const emailConfig = getConfig();
  const previousFetch = globalThis.fetch;
  const captured = { url: "", authorization: "", idempotencyKey: "", body: "" };
  globalThis.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    captured.url = String(input);
    captured.authorization = headers.get("authorization") ?? "";
    captured.idempotencyKey = headers.get("idempotency-key") ?? "";
    captured.body = String(init?.body ?? "");
    return new Response("{}", { status: 200 });
  };
  try {
    const sent = await sendDownloadEmail(emailConfig, {
      to: "buyer@example.com",
      downloadUrl: "https://buy.example/api/download/token",
      orderId: "5O190127TN364715T",
    });
    assert(sent === "sent", "resend send result");
  } finally {
    globalThis.fetch = previousFetch;
  }
  assert(captured.url === "https://api.resend.com/emails", "resend endpoint");
  assert(captured.authorization === "Bearer re_selfcheck", "resend auth");
  assert(captured.idempotencyKey === "download-email/5O190127TN364715T", "idempotency key");
  const payload = JSON.parse(captured.body) as { subject?: string; text?: string; html?: string; reply_to?: string };
  assert(Boolean(payload.html) && Boolean(payload.text), "resend html and text");
  assert(payload.subject === "Your L Studio Pro download", "resend subject");
  assert(payload.reply_to === emailConfig.supportEmail, "resend reply-to");
  assert(payload.html?.includes("https://l-studio.studio/guide"), "resend default guide");
  assert(!captured.body.includes("re_selfcheck"), "resend body has no api key");

  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM;
  delete process.env.SITE_PUBLIC_URL;
  delete process.env.GUIDE_URL;
  resetConfigForTests();

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

  delete process.env.APK_SOURCE_URL;
  delete process.env.APK_GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  delete process.env.PAYPAL_CLIENT_ID;
  delete process.env.PAYPAL_CLIENT_SECRET;
  process.env.APK_PATH = apkFile;
  process.env.APK_SHA256 = apkSha;
  process.env.DOWNLOAD_TOKEN_SECRET = secret;
  process.env.PUBLIC_BASE_URL = "https://buy.example";
  process.env.SUPPORT_EMAIL = "dudichatam@gmail.com";
  process.env.RESEND_API_KEY = "re_selfcheck";
  process.env.RESEND_FROM = "L Studio <downloads@l-studio.studio>";
  delete process.env.SITE_PUBLIC_URL;
  delete process.env.GUIDE_URL;
  process.env.EARLY_ACCESS_LIMIT = "44";
  process.env.DATA_DIR = path.join(root, "early-cap");
  resetCommerceForTests();
  const capStore = getStore(getConfig().dataDir);
  for (let i = 0; i < 44; i += 1) {
    const created = capStore.reserveEarlyAccess({
      email: `tester${i}@example.com`,
      name: i === 0 ? "Ada" : "",
      orderId: `ea-cap-${i}`,
      limit: 44,
    });
    assert(created.result === "created", `early access slot ${i}`);
  }
  const overflow = capStore.reserveEarlyAccess({
    email: "tester44@example.com",
    name: "",
    orderId: "ea-cap-44",
    limit: 44,
  });
  assert(overflow.result === "full", "45th unique email is rejected");
  const duplicate = capStore.reserveEarlyAccess({
    email: "Tester0@example.com",
    name: "Again",
    orderId: "ea-cap-dup",
    limit: 44,
  });
  assert(duplicate.result === "exists" && duplicate.orderId === "ea-cap-0", "duplicate email does not take another slot");
  assert(capStore.countEarlyAccess() === 44, "cap stays at 44");

  process.env.EARLY_ACCESS_LIMIT = "2";
  process.env.DATA_DIR = path.join(root, "early-http");
  resetCommerceForTests();
  const earlyApp = express();
  earlyApp.set("trust proxy", 1);
  await prepareCommerce();
  await ensureApk(getConfig());
  attachCommerceApi(earlyApp);
  const earlyServer = await listen(earlyApp);
  const sentBodies: { body: string; idempotencyKey: string }[] = [];
  let failNextEarlyEmail = true;
  const earlyFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === "https://api.resend.com/emails") {
      const headers = new Headers(init?.headers);
      sentBodies.push({
        body: String(init?.body ?? ""),
        idempotencyKey: headers.get("idempotency-key") ?? "",
      });
      if (failNextEarlyEmail) {
        failNextEarlyEmail = false;
        return new Response("nope", { status: 500 });
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return earlyFetch(input, init);
  };
  try {
    const openStatus = await request(earlyServer.port, "GET", "/api/early-access/status");
    assert(openStatus.status === 200, "early status");
    const openBody = openStatus.json as { limit?: number; taken?: number; remaining?: number };
    assert(openBody.limit === 2 && openBody.taken === 0 && openBody.remaining === 2, "two spots open");
    assert(!openStatus.text.includes("@"), "status leaks no email");

    const invalidEmail = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ name: "No", email: "not-an-email" }),
      { "Content-Type": "application/json" },
    );
    assert(invalidEmail.status === 400 && (invalidEmail.json as { error?: string }).error === "invalid_email", "invalid email");

    const failedSend = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ name: "Ada Lovelace", email: "Ada@Example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(failedSend.status === 502 && (failedSend.json as { error?: string }).error === "email_failed", "email failure keeps the spot");
    assert(!failedSend.text.includes("/api/download/"), "failed signup does not return the apk url");
    assert(getStore(getConfig().dataDir).countEarlyAccess() === 1, "failed email still reserves one spot");

    const retried = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ email: "ada@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(retried.status === 200 && (retried.json as { status?: string }).status === "already_registered", "retry does not take a second slot");
    assert(!retried.text.includes("/api/download/"), "retry does not return the apk url");
    assert(sentBodies.length === 2, "retry sends the download email");
    const mailed = JSON.parse(sentBodies[1]?.body || "{}") as { subject?: string; text?: string; html?: string; reply_to?: string };
    assert(mailed.subject === "L Studio Early Access: your free tester download", "mailed subject");
    assert(mailed.reply_to === "dudichatam@gmail.com", "mailed reply-to");
    assert(mailed.text?.includes("https://l-studio.studio/guide"), "mailed guide");
    assert(mailed.text?.includes("real feedback and reviews") && mailed.text?.includes("before the official launch"), "mailed feedback");
    assert(mailed.html?.includes("dudichatam@gmail.com") && !/paypal|purchas|הרכישה/i.test(sentBodies[1]?.body || ""), "mailed body is early access");
    assert(!/paypal/i.test(sentBodies[1]?.body || ""), "mailed body has no paypal");
    const token = mailed.text?.match(/\/api\/download\/([A-Za-z0-9_-]+)/)?.[1] || "";
    assert(token.length > 20, "mailed one-time token");
    assert(sentBodies[1]?.idempotencyKey.startsWith("early-access-email/ea"), "early access idempotency key");

    const again = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ email: "ada@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(again.status === 200 && (again.json as { status?: string }).status === "already_registered", "already registered");
    assert(sentBodies.length === 2, "already registered does not send another email");
    assert(getStore(getConfig().dataDir).countEarlyAccess() === 1, "duplicate did not increment");

    const second = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ name: "Bea", email: "bea@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(second.status === 200 && (second.json as { status?: string }).status === "registered", "second signup");

    const third = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ email: "cy@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(third.status === 410 && (third.json as { error?: string }).error === "full", "third signup is rejected when full");
    assert(getStore(getConfig().dataDir).countEarlyAccess() === 2, "full response does not store the extra email");
    const closed = await request(earlyServer.port, "GET", "/api/early-access/status");
    const closedBody = closed.json as { remaining?: number; taken?: number };
    assert(closedBody.remaining === 0 && closedBody.taken === 2, "remaining spots hit zero");
    assert(!closed.text.includes("@"), "closed status leaks no email");

    const download = await fetch(`http://127.0.0.1:${earlyServer.port}/api/download/${token}`);
    const bytes = Buffer.from(await download.arrayBuffer());
    assert(download.status === 200, "early access apk download");
    assert(download.headers.get("content-disposition")?.includes("L-Studio-Pro.apk"), "early access apk name");
    assert(bytes.equals(apkBytes), "early access apk bytes");
    const secondDownload = await request(earlyServer.port, "GET", `/api/download/${token}`);
    assert(secondDownload.status === 410, "early access token is single use");
  } finally {
    globalThis.fetch = earlyFetch;
    await earlyServer.close();
  }

  fs.rmSync(root, { recursive: true, force: true });
  console.log("commerce selfcheck ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
