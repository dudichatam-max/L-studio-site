import http, { createServer } from "node:http";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import express from "express";
import { apkStatus, ensureApk, resetApkForTests } from "./apk";
import { EARLY_ACCESS_DOWNLOAD_LIMIT, EARLY_ACCESS_TOKEN_TTL_MS, getConfig, readEarlyAccessLimit, resetConfigForTests } from "./config";
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

async function waitFor(predicate: () => boolean, message: string) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > 3000) throw new Error(message);
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
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
  assert(earlyMessage.text.includes("24 שעות") && earlyMessage.text.includes("כמה פעמים"), "early hebrew retry window");
  assert(earlyMessage.text.includes("about 24 hours") && earlyMessage.text.includes("more than once"), "early english retry window");
  assert(earlyMessage.html.includes("24 שעות") && earlyMessage.html.includes("about 24 hours"), "early html retry window");
  assert(!earlyMessage.text.includes("פעם אחת") && !earlyMessage.text.includes("works once"), "early email is not single use");
  assert(!earlyMessage.html.includes("פעם אחת") && !earlyMessage.html.includes("works once"), "early html is not single use");
  assert(EARLY_ACCESS_TOKEN_TTL_MS === 24 * 60 * 60 * 1000, "early access links last 24h");
  assert(EARLY_ACCESS_DOWNLOAD_LIMIT === 10, "early access allows ten saves");
  assert(earlyMessage.text.includes("https://buy.example/api/download/token"), "early text download url");
  assert(earlyMessage.text.includes("https://l-studio.studio/guide"), "early text guide url");
  assert(earlyMessage.text.includes("dudichatam@gmail.com"), "early feedback address");
  assert(earlyMessage.text.includes("משוב אמיתי") && earlyMessage.text.includes("ביקורות"), "early hebrew feedback and reviews");
  assert(earlyMessage.text.includes("real feedback and reviews"), "early english feedback and reviews");
  assert(earlyMessage.html.includes('lang="he"') && earlyMessage.html.includes('dir="rtl"'), "early hebrew direction");
  assert(earlyMessage.html.includes('lang="en"') && earlyMessage.html.includes('dir="ltr"'), "early english direction");
  assert(earlyMessage.text.includes("הכפתור פותח עמוד") && earlyMessage.text.includes("לחצו על הורדת APK"), "early hebrew page then download");
  assert(earlyMessage.text.includes("The button opens a page") && earlyMessage.text.includes("tap Download"), "early english page then download");
  assert(earlyMessage.html.includes("הכפתור פותח עמוד") && earlyMessage.html.includes("tap Download"), "early html explains the page");
  assert(earlyMessage.html.includes("פתיחת עמוד ההורדה"), "early hebrew download cta");
  assert(earlyMessage.html.includes("Open the download page"), "early english download cta");
  assert(!earlyMessage.html.includes("?download=1"), "email button does not prefetch the file");
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

    const browserAccept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    const paidLanding = await request(server.port, "GET", `/api/download/${token}`, undefined, { Accept: browserAccept });
    assert(paidLanding.status === 200, "paid browser navigation is a landing page");
    assert(paidLanding.headers.get("content-type")?.includes("text/html"), "paid landing content type");
    assert(paidLanding.text.includes('href="?download=1"'), "paid landing button opens the file step");
    assert(paidLanding.text.includes(">Download APK<"), "paid landing download button");
    assert(paidLanding.text.includes(">הורדת APK<"), "paid landing hebrew button");
    assert(paidLanding.text.includes("saves the file once"), "paid landing stays one-time");
    assert(!paidLanding.text.includes(apkBytes.toString("utf8")), "paid landing is not the apk");

    const scannedPaid = await fetch(`http://127.0.0.1:${server.port}/api/download/${token}`, { headers: { Accept: "*/*" } });
    const scannedPaidText = await scannedPaid.text();
    assert(scannedPaid.status === 200 && scannedPaid.headers.get("content-type")?.includes("text/html"), "scanner accept star gets html");
    assert(!scannedPaidText.includes(apkBytes.toString("utf8")), "scanner does not receive the apk");

    const download = await fetch(`http://127.0.0.1:${server.port}/api/download/${token}?download=1`);
    const bytes = Buffer.from(await download.arrayBuffer());
    assert(download.status === 200, "download status");
    assert(download.headers.get("content-type") === "application/vnd.android.package-archive", "apk content type");
    assert(download.headers.get("content-disposition")?.includes("L-Studio-Pro.apk"), "attachment name");
    assert(download.headers.get("content-length") === String(apkBytes.length), "apk content length");
    assert(download.headers.get("accept-ranges") === "bytes", "apk accepts ranges");
    assert(bytes.equals(apkBytes), "apk bytes");

    const again = await request(server.port, "GET", `/api/download/${token}?download=1`);
    assert(again.status === 410, "single use");
    const bareAfterPaid = await request(server.port, "GET", `/api/download/${token}`, undefined, { Accept: "*/*" });
    assert(bareAfterPaid.status === 410 && bareAfterPaid.headers.get("content-type")?.includes("text/html"), "used bare link stays html");
    assert(!bareAfterPaid.text.includes(apkBytes.toString("utf8")), "used bare link is not the apk");

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

    const earlyOrder = "ea-reissue-selfcheck";
    const earlyToken = mintDownloadToken();
    const earlyHash = hashDownloadToken(earlyToken, secret);
    const earlyIssued = store.issueToken({
      orderId: earlyOrder,
      captureId: "early-access",
      payerEmail: "ada@example.com",
      amount: "0.00",
      currency: "EARLY",
      tokenHash: earlyHash,
      sealedToken: sealDownloadToken(earlyToken, secret),
      ttlMs: 60 * 60 * 1000,
    });
    assert(earlyIssued.result === "issued" && earlyIssued.tokenHash === earlyHash, "early access token issued");
    assert(store.claim(earlyHash, 60_000) === "ok", "early access claim");
    assert(store.claim(earlyHash, 60_000) === "ok", "early access retry is not locked");
    store.complete(earlyHash);
    const earlyReplacement = mintDownloadToken();
    const earlyReplacementHash = hashDownloadToken(earlyReplacement, secret);
    const earlyAgain = store.issueToken({
      orderId: earlyOrder,
      captureId: "early-access",
      payerEmail: "ada@example.com",
      amount: "0.00",
      currency: "EARLY",
      tokenHash: earlyReplacementHash,
      sealedToken: sealDownloadToken(earlyReplacement, secret),
      ttlMs: 60 * 60 * 1000,
    });
    assert(earlyAgain.result === "issued" && earlyAgain.tokenHash === earlyReplacementHash, "early access reissues after a used token");
    assert(earlyReplacementHash !== earlyHash, "early access replacement is a new token");
    assert(store.claim(earlyHash, 1000) === "used", "replaced early access token stays used");
    assert(store.claim(earlyReplacementHash, 1000) === "ok", "replacement early access token is claimable");
    store.release(earlyReplacementHash);

    const captureOnly = mintDownloadToken();
    const captureHash = hashDownloadToken(captureOnly, secret);
    const captureIssued = store.issueToken({
      orderId: "ea-capture-reissue",
      captureId: "early-access",
      payerEmail: "ada@example.com",
      amount: "0.00",
      currency: "USD",
      tokenHash: captureHash,
      sealedToken: sealDownloadToken(captureOnly, secret),
      ttlMs: 60 * 60 * 1000,
    });
    assert(captureIssued.result === "issued" && captureIssued.tokenHash === captureHash, "capture id early-access issues");
    store.complete(captureHash);
    const captureReplacement = store.issueToken({
      orderId: "ea-capture-reissue",
      captureId: "early-access",
      payerEmail: "ada@example.com",
      amount: "0.00",
      currency: "USD",
      tokenHash: hashDownloadToken(mintDownloadToken(), secret),
      sealedToken: "sealed",
      ttlMs: 60 * 60 * 1000,
    });
    assert(captureReplacement.result === "issued", "capture id early-access reissues after use");

    const reservedSignup = store.reserveEarlyAccess({
      email: "signup-reissue@example.com",
      name: "Sam",
      orderId: "ea-signup-reissue",
      limit: 44,
    });
    assert(reservedSignup.result === "created", "signup row for reissue");
    const signupToken = mintDownloadToken();
    const signupHash = hashDownloadToken(signupToken, secret);
    const signupIssued = store.issueToken({
      orderId: "ea-signup-reissue",
      captureId: "other",
      payerEmail: "signup-reissue@example.com",
      amount: "0.00",
      currency: "USD",
      tokenHash: signupHash,
      sealedToken: sealDownloadToken(signupToken, secret),
      ttlMs: 60 * 60 * 1000,
    });
    assert(signupIssued.result === "issued" && signupIssued.tokenHash === signupHash, "signup table issues a token");
    store.complete(signupHash);
    const signupReplacement = store.issueToken({
      orderId: "ea-signup-reissue",
      captureId: "other",
      payerEmail: "signup-reissue@example.com",
      amount: "0.00",
      currency: "USD",
      tokenHash: hashDownloadToken(mintDownloadToken(), secret),
      sealedToken: "sealed",
      ttlMs: 60 * 60 * 1000,
    });
    assert(signupReplacement.result === "issued", "signup table reissues after a used token");
    assert(store.countEarlyAccess() === 1, "reissue test does not add a second signup");

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
      "https://github.com/dudichatam-max/L-studio/releases/download/website-pro-qa-tutorial-20260926e/L-Studio-website-pro-qa-tutorial-20260926e.apk";
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

  const backfillDir = path.join(root, "early-backfill");
  fs.mkdirSync(backfillDir, { recursive: true });
  const rawBackfill = new DatabaseSync(path.join(backfillDir, "commerce.sqlite"));
  rawBackfill.exec(`
    CREATE TABLE early_access_signups (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      order_id TEXT NOT NULL UNIQUE,
      email_status TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE download_tokens (
      token_hash TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL,
      lock_until INTEGER,
      sealed_token TEXT,
      download_count INTEGER NOT NULL DEFAULT 0
    );
    INSERT INTO early_access_signups (email, name, order_id, email_status, created_at, updated_at)
    VALUES ('old@example.com', 'Old', 'ea-old', 'sent', 1700000000000, 1700000000000);
    INSERT INTO download_tokens (token_hash, order_id, expires_at, used_at, created_at, lock_until, sealed_token, download_count)
    VALUES ('hash-old', 'ea-old', 1800000000000, NULL, 1700000001000, NULL, NULL, 2);
    INSERT INTO download_tokens (token_hash, order_id, expires_at, used_at, created_at, lock_until, sealed_token, download_count)
    VALUES ('hash-old-2', 'ea-old', 1800000000000, 1700000005000, 1700000002000, NULL, NULL, 1);
  `);
  rawBackfill.close();
  process.env.DATA_DIR = backfillDir;
  resetCommerceForTests();
  const migrated = getStore(getConfig().dataDir);
  const oldSignup = migrated.getEarlyAccessSignup("old@example.com");
  assert(oldSignup?.downloadCount === 3, "backfill sums earlier apk downloads");
  assert(oldSignup?.firstDownloadAt === 1700000001000, "backfill keeps the earliest download timestamp");
  assert(migrated.countEarlyAccessDownloaded() === 1, "backfill counts the tester as downloaded");

  process.env.EARLY_ACCESS_LIMIT = "2";
  process.env.OWNER_NOTIFY_EMAIL = "dudichatam@gmail.com";
  process.env.ADMIN_STATS_SECRET = "stats-selfcheck-secret";
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
  let failNextOwnerEmail = true;
  const ownerAddress = "dudichatam@gmail.com";
  const statsSecret = "stats-selfcheck-secret";
  type SentMail = { to?: string[]; subject?: string; text?: string; html?: string; reply_to?: string };
  function mailAt(index: number): SentMail {
    return JSON.parse(sentBodies[index]?.body || "{}") as SentMail;
  }
  function isOwnerMail(index: number): boolean {
    return mailAt(index).to?.[0] === ownerAddress;
  }
  function userMailIndexes(): number[] {
    return sentBodies.map((_, index) => index).filter((index) => !isOwnerMail(index));
  }
  function ownerMailIndexes(): number[] {
    return sentBodies.map((_, index) => index).filter((index) => isOwnerMail(index));
  }
  const earlyFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url === "https://api.resend.com/emails") {
      const headers = new Headers(init?.headers);
      const raw = String(init?.body ?? "");
      sentBodies.push({
        body: raw,
        idempotencyKey: headers.get("idempotency-key") ?? "",
      });
      let to = "";
      try {
        to = (JSON.parse(raw) as SentMail).to?.[0] ?? "";
      } catch {
        to = "";
      }
      if (to === ownerAddress) {
        if (failNextOwnerEmail) {
          failNextOwnerEmail = false;
          return new Response("nope", { status: 500 });
        }
        return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
      }
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
    assert(ownerMailIndexes().length === 0, "failed user email does not notify the owner");

    const retried = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ email: "ada@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(retried.status === 200 && (retried.json as { status?: string }).status === "already_registered", "retry does not take a second slot");
    assert(retried.status === 200, "owner notify failure still registers the tester");
    assert(!retried.text.includes("/api/download/"), "retry does not return the apk url");
    assert(userMailIndexes().length === 2, "retry sends the download email");
    const mailedIndex = userMailIndexes()[1] ?? -1;
    const mailed = mailAt(mailedIndex);
    assert(mailed.subject === "L Studio Early Access: your free tester download", "mailed subject");
    assert(mailed.reply_to === "dudichatam@gmail.com", "mailed reply-to");
    assert(mailed.text?.includes("https://l-studio.studio/guide"), "mailed guide");
    assert(mailed.text?.includes("real feedback and reviews") && mailed.text?.includes("before the official launch"), "mailed feedback");
    assert(mailed.html?.includes("dudichatam@gmail.com") && !/paypal|purchas|הרכישה/i.test(sentBodies[mailedIndex]?.body || ""), "mailed body is early access");
    assert(!/paypal/i.test(sentBodies[mailedIndex]?.body || ""), "mailed body has no paypal");
    const token = mailed.text?.match(/\/api\/download\/([A-Za-z0-9_-]+)/)?.[1] || "";
    assert(token.length > 20, "mailed one-time token");
    assert(sentBodies[mailedIndex]?.idempotencyKey.startsWith("early-access-email/ea"), "early access idempotency key");
    assert(ownerMailIndexes().length === 1, "first successful signup notifies the owner once");
    const ownerSignup = mailAt(ownerMailIndexes()[0] ?? -1);
    assert(ownerSignup.subject === "נרשם בודק חדש / New Early Access signup", "owner signup subject");
    assert(ownerSignup.text?.includes("Ada Lovelace") && ownerSignup.text?.includes("ada@example.com"), "owner signup includes the stored tester");
    assert(ownerSignup.text?.includes("נרשם בודק חדש") && ownerSignup.text?.includes("A new Early Access tester signed up."), "owner signup is hebrew and english");
    assert(ownerSignup.text?.includes("1 used, 1 remaining") && ownerSignup.text?.includes("Total signups: 1"), "owner signup includes spots");
    assert(/זמן: \d{4}-\d{2}-\d{2}T/.test(ownerSignup.text || ""), "owner signup includes an ISO timestamp");
    assert(!ownerSignup.text?.includes("/api/download/"), "owner signup email has no download token");
    assert(sentBodies[ownerMailIndexes()[0] ?? -1]?.idempotencyKey.startsWith("owner-notify/early-access/signup/"), "owner signup idempotency key");

    const again = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ email: "ada@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(again.status === 200 && (again.json as { status?: string; email?: string }).status === "already_registered", "already registered resends");
    assert((again.json as { email?: string }).email === "sent", "resend reports the email was sent");
    assert(userMailIndexes().length === 3, "already registered sends a fresh download email");
    const resentIndex = userMailIndexes()[2] ?? -1;
    const resentToken = mailAt(resentIndex).text?.match(/\/api\/download\/([A-Za-z0-9_-]+)/)?.[1] || "";
    assert(resentToken.length > 20 && resentToken !== token, "resend mints a new download token");
    assert(sentBodies[resentIndex]?.idempotencyKey !== sentBodies[mailedIndex]?.idempotencyKey, "resend uses a new idempotency key");
    assert(ownerMailIndexes().length === 1, "resend does not notify the owner again");
    assert(getStore(getConfig().dataDir).countEarlyAccess() === 1, "duplicate did not increment");

    const second = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ name: "Bea", email: "bea@example.com", phone: "0501234567" }),
      { "Content-Type": "application/json" },
    );
    assert(second.status === 200 && (second.json as { status?: string }).status === "registered", "second signup");
    assert(ownerMailIndexes().length === 2, "second signup notifies the owner");
    const beaOwner = mailAt(ownerMailIndexes()[1] ?? -1);
    assert(
      beaOwner.text?.includes("Bea") && beaOwner.text?.includes("bea@example.com") && beaOwner.text?.includes("0501234567"),
      "owner email includes extra submitted fields",
    );
    assert(beaOwner.text?.includes("2 used, 0 remaining") && beaOwner.text?.includes("Total signups: 2"), "owner email counts the full cohort");

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

    const staleDownload = await request(earlyServer.port, "GET", `/api/download/${token}`);
    assert(staleDownload.status === 410, "replaced early access token no longer works");

    const replacedWhileFull = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ email: "ada@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(replacedWhileFull.status === 200 && (replacedWhileFull.json as { email?: string }).email === "sent", "full cohort can still resend");
    assert(getStore(getConfig().dataDir).countEarlyAccess() === 2, "resend does not consume another spot");
    const freshToken = JSON.parse(sentBodies.at(-1)?.body || "{}").text?.match(/\/api\/download\/([A-Za-z0-9_-]+)/)?.[1] || "";
    assert(freshToken.length > 20 && freshToken !== resentToken, "resend while full mints another token");
    const freshHash = hashDownloadToken(freshToken, secret);
    const freshState = getStore(getConfig().dataDir).downloadState(freshHash);
    if (!freshState) throw new Error("mailed token state");
    assert(freshState.expiresAt - Date.now() > 23 * 60 * 60 * 1000, "mailed early access token lasts about 24h");
    assert(freshState.downloadCount === 0 && freshState.usedAt == null, "mailed token starts unused");

    const statsDenied = await request(earlyServer.port, "GET", "/api/admin/early-access-stats");
    assert(statsDenied.status === 401 && (statsDenied.json as { error?: string }).error === "unauthorized", "stats require a secret");
    assert(!statsDenied.text.includes("@"), "unauthorized stats leak no email");
    const statsWrong = await request(earlyServer.port, "GET", "/api/admin/early-access-stats?secret=nope");
    assert(statsWrong.status === 401, "wrong stats secret is rejected");
    const stats = await request(earlyServer.port, "GET", `/api/admin/early-access-stats?secret=${statsSecret}`);
    assert(stats.status === 200, "stats secret in the query");
    const statsBody = stats.json as {
      limit?: number;
      signups?: number;
      spotsUsed?: number;
      spotsRemaining?: number;
      downloaded?: number;
      recent?: Array<{ email?: string; name?: string; createdAt?: string; downloadCount?: number; hasDownloaded?: boolean; details?: { phone?: string } }>;
    };
    assert(statsBody.limit === 2 && statsBody.signups === 2 && statsBody.spotsUsed === 2 && statsBody.spotsRemaining === 0, "stats spots");
    assert(statsBody.downloaded === 0, "stats downloaded before any apk");
    assert(statsBody.recent?.length === 2, "stats lists recent signups");
    assert(statsBody.recent?.some((row) => row.email === "ada@example.com" && row.name === "Ada Lovelace" && row.hasDownloaded === false), "stats include ada");
    assert(statsBody.recent?.some((row) => row.email === "bea@example.com" && row.details?.phone === "0501234567"), "stats include extra fields");
    assert(statsBody.recent?.every((row) => typeof row.createdAt === "string" && row.createdAt.includes("T")), "stats timestamps are ISO");
    assert(!stats.text.includes("/api/download/"), "stats do not include download tokens");
    const statsHeader = await request(earlyServer.port, "GET", "/api/admin/early-access-stats", undefined, { "x-admin-secret": statsSecret });
    assert(statsHeader.status === 200 && (statsHeader.json as { signups?: number }).signups === 2, "stats secret header");
    assert(!closed.text.includes("ada@example.com"), "public status stays anonymous");

    const browserAccept = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    const landing = await request(earlyServer.port, "GET", `/api/download/${freshToken}`, undefined, { Accept: browserAccept });
    assert(landing.status === 200, "early access browser navigation is a landing page");
    assert(landing.headers.get("content-type")?.includes("text/html"), "early landing content type");
    assert(landing.headers.get("content-disposition")?.includes("inline"), "early landing is inline");
    assert(landing.text.includes('href="?download=1"'), "early landing button opens the file step");
    assert(landing.text.includes(">Download APK<"), "early landing download button");
    assert(landing.text.includes(">הורדת APK<"), "early landing hebrew button");
    assert(landing.text.includes("Tap Download APK"), "early landing english");
    assert(landing.text.includes("לחצו על הורדת APK"), "early landing hebrew");
    assert(landing.text.includes("24 hours") && landing.text.includes("24 שעות"), "early landing explains the window");
    assert(!landing.text.includes(freshToken), "landing does not echo the token");
    assert(!landing.text.includes(apkBytes.toString("utf8")), "landing is not the apk");
    assert(getStore(getConfig().dataDir).downloadState(freshHash)?.downloadCount === 0, "landing does not use a download");
    const againLanding = await request(earlyServer.port, "GET", `/api/download/${freshToken}`, undefined, { Accept: browserAccept });
    assert(againLanding.status === 200 && againLanding.text.includes("Download the APK"), "landing can be opened twice");

    const scanned = await fetch(`http://127.0.0.1:${earlyServer.port}/api/download/${freshToken}`, { headers: { Accept: "*/*" } });
    const scannedText = await scanned.text();
    assert(scanned.status === 200 && scanned.headers.get("content-type")?.includes("text/html"), "star accept gets the landing page");
    assert(!scannedText.includes(apkBytes.toString("utf8")), "star accept does not receive the apk");
    assert(getStore(getConfig().dataDir).downloadState(freshHash)?.downloadCount === 0, "star accept does not consume the token");

    const octet = await request(earlyServer.port, "GET", `/api/download/${freshToken}`, undefined, {
      Accept: "application/octet-stream",
    });
    assert(octet.status === 200 && octet.headers.get("content-type")?.includes("text/html"), "octet-stream on the bare url gets html");
    assert(octet.text.includes(">Download APK<") && !octet.text.includes(apkBytes.toString("utf8")), "octet-stream bare url is not the apk");
    assert(getStore(getConfig().dataDir).downloadState(freshHash)?.downloadCount === 0, "octet-stream bare url does not consume the token");

    assert(
      !ownerMailIndexes().some((index) => mailAt(index).subject === "הורדת APK ראשונה / First Early Access download"),
      "opening the landing page does not notify the owner",
    );
    const posted = await fetch(`http://127.0.0.1:${earlyServer.port}/api/download/${freshToken}?download=1`, {
      method: "POST",
      headers: { Accept: "text/html,application/xhtml+xml" },
    });
    const postedBytes = Buffer.from(await posted.arrayBuffer());
    assert(posted.status === 200 && postedBytes.equals(apkBytes), "download button posts the apk");
    assert(posted.headers.get("content-type") === "application/vnd.android.package-archive", "posted apk type");
    assert(posted.headers.get("content-disposition")?.includes('filename="L-Studio-Pro.apk"'), "posted apk filename");
    assert(posted.headers.get("content-length") === String(apkBytes.length), "posted apk length");
    assert(posted.headers.get("accept-ranges") === "bytes", "posted apk ranges");
    await waitFor(
      () => ownerMailIndexes().some((index) => mailAt(index).subject === "הורדת APK ראשונה / First Early Access download"),
      "owner first-download email",
    );
    const downloadNotices = () => ownerMailIndexes().filter((index) => mailAt(index).subject === "הורדת APK ראשונה / First Early Access download");
    assert(downloadNotices().length === 1, "first apk download notifies the owner once");
    const downloadNotice = mailAt(downloadNotices()[0] ?? -1);
    assert(downloadNotice.text?.includes("ada@example.com") && downloadNotice.text?.includes("Ada Lovelace"), "download notice names the tester");
    assert(downloadNotice.text?.includes("הוריד את קובץ ה-APK") && downloadNotice.text?.includes("downloaded the APK for the first time"), "download notice is hebrew and english");
    assert(downloadNotice.text?.includes("This tester's downloads: 1") && downloadNotice.text?.includes("Testers who downloaded: 1 of 2"), "download notice counts");
    assert(!downloadNotice.text?.includes("/api/download/"), "download notice has no token");
    assert(sentBodies[downloadNotices()[0] ?? -1]?.idempotencyKey.startsWith("owner-notify/early-access/download/"), "download notice idempotency key");

    const button = await request(earlyServer.port, "GET", `/api/download/${freshToken}?download=1`, undefined, {
      Accept: browserAccept,
    });
    assert(button.status === 200 && button.text === apkBytes.toString("utf8"), "download=1 returns the apk to a browser");
    assert(button.headers.get("content-type") === "application/vnd.android.package-archive", "download=1 content type");
    assert(button.headers.get("content-disposition")?.includes("attachment"), "download=1 is an attachment");

    const rawQuery = await request(earlyServer.port, "GET", `/api/download/${freshToken}?raw=1`, undefined, {
      Accept: browserAccept,
    });
    assert(rawQuery.status === 200 && rawQuery.text === apkBytes.toString("utf8"), "raw=1 returns the apk to a browser");

    const ranged = await request(earlyServer.port, "GET", `/api/download/${freshToken}?download=1`, undefined, {
      Accept: "application/octet-stream",
      Range: "bytes=0-3",
    });
    assert(ranged.status === 206, "partial range status");
    assert(ranged.headers.get("content-range") === `bytes 0-3/${apkBytes.length}`, "partial content range");
    assert(ranged.headers.get("content-length") === "4", "partial content length");
    assert(ranged.text === apkBytes.subarray(0, 4).toString("utf8"), "partial bytes");
    assert(getStore(getConfig().dataDir).downloadState(freshHash)?.downloadCount === 3, "partial range does not count as a full save");

    const openRange = await request(earlyServer.port, "GET", `/api/download/${freshToken}?download=1`, undefined, {
      Accept: "application/octet-stream",
      Range: "bytes=0-",
    });
    assert(openRange.status === 206, "open range status");
    assert(openRange.headers.get("content-range") === `bytes 0-${apkBytes.length - 1}/${apkBytes.length}`, "open range covers the file");
    assert(openRange.text === apkBytes.toString("utf8"), "open range bytes");

    const badRange = await request(earlyServer.port, "GET", `/api/download/${freshToken}?download=1`, undefined, {
      Accept: "application/octet-stream",
      Range: `bytes=${apkBytes.length + 5}-${apkBytes.length + 10}`,
    });
    assert(badRange.status === 416, "unsatisfiable range");
    assert(getStore(getConfig().dataDir).downloadState(freshHash)?.downloadCount === 4, "bad range does not count");

    for (let i = 4; i < EARLY_ACCESS_DOWNLOAD_LIMIT; i += 1) {
      const next = await request(earlyServer.port, "GET", `/api/download/${freshToken}?download=1`, undefined, {
        Accept: "application/octet-stream",
      });
      assert(next.status === 200 && next.text === apkBytes.toString("utf8"), `early access save ${i + 1}`);
    }
    assert(getStore(getConfig().dataDir).downloadState(freshHash)?.usedAt != null, "tenth save closes the early access token");
    const exhausted = await request(earlyServer.port, "GET", `/api/download/${freshToken}?download=1`, undefined, {
      Accept: "application/octet-stream",
    });
    assert(exhausted.status === 410 && (exhausted.json as { error?: string }).error === "used", "eleventh save is refused");
    assert(downloadNotices().length === 1, "later apk downloads do not notify the owner again");
    const afterDownloads = await request(earlyServer.port, "GET", `/api/admin/early-access-stats?secret=${statsSecret}`);
    const afterBody = afterDownloads.json as {
      downloaded?: number;
      recent?: Array<{ email?: string; downloadCount?: number; hasDownloaded?: boolean; downloadedAt?: string | null }>;
    };
    assert(afterBody.downloaded === 1, "stats count testers with a finished apk");
    const adaStats = afterBody.recent?.find((row) => row.email === "ada@example.com");
    const beaStats = afterBody.recent?.find((row) => row.email === "bea@example.com");
    assert(adaStats?.hasDownloaded === true && adaStats.downloadCount === EARLY_ACCESS_DOWNLOAD_LIMIT, "ada download count is persisted");
    assert(typeof adaStats?.downloadedAt === "string" && adaStats.downloadedAt.includes("T"), "ada download time is ISO");
    assert(beaStats?.hasDownloaded === false && beaStats.downloadCount === 0, "bea has not downloaded");
    const exhaustedBare = await request(earlyServer.port, "GET", `/api/download/${freshToken}`, undefined, { Accept: "*/*" });
    assert(exhaustedBare.status === 410 && exhaustedBare.headers.get("content-type")?.includes("text/html"), "used bare url is still html");
    assert(!exhaustedBare.text.includes(apkBytes.toString("utf8")), "used bare url is not the apk");

    const htmlDenied = await request(earlyServer.port, "GET", `/api/download/${freshToken}`, undefined, {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    });
    assert(htmlDenied.status === 410, "used link html status");
    assert(htmlDenied.headers.get("content-type")?.includes("text/html"), "used link html content type");
    assert(htmlDenied.text.includes("ההורדה לא זמינה"), "used link hebrew");
    assert(htmlDenied.text.includes("Download unavailable"), "used link english");
    assert(htmlDenied.text.includes("https://l-studio.studio/#early-access"), "used link points back to early access");
    assert(!htmlDenied.text.includes(freshToken), "used link page does not echo the token");
    assert(htmlDenied.json === null, "html response is not json");

    const jsonDenied = await request(earlyServer.port, "GET", `/api/download/${freshToken}?download=1`, undefined, {
      Accept: "application/json",
    });
    assert(jsonDenied.status === 410 && (jsonDenied.json as { error?: string }).error === "used", "api clients still get json");

    const big = Buffer.alloc(256 * 1024, 0x61);
    const bigPath = path.join(root, "big-apk.bin");
    fs.writeFileSync(bigPath, big);
    process.env.APK_PATH = bigPath;
    process.env.APK_SHA256 = createHash("sha256").update(big).digest("hex");
    resetConfigForTests();
    resetApkForTests();
    const abortToken = mintDownloadToken();
    const abortHash = hashDownloadToken(abortToken, secret);
    const abortIssued = getStore(getConfig().dataDir).issueToken({
      orderId: "ea-abort-selfcheck",
      captureId: "early-access",
      payerEmail: "ada@example.com",
      amount: "0.00",
      currency: "EARLY",
      tokenHash: abortHash,
      sealedToken: sealDownloadToken(abortToken, secret),
      ttlMs: EARLY_ACCESS_TOKEN_TTL_MS,
    });
    assert(abortIssued.result === "issued", "abort token issued");
    await new Promise<void>((resolve, reject) => {
      const req = http.get(
        {
          hostname: "127.0.0.1",
          port: earlyServer.port,
          path: `/api/download/${abortToken}?download=1`,
          headers: { Accept: "application/octet-stream" },
        },
        (res) => {
          res.once("data", () => {
            req.destroy();
            resolve();
          });
          res.on("error", () => resolve());
          res.on("end", () => resolve());
        },
      );
      req.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "ECONNRESET" || error.code === "EPIPE") resolve();
        else reject(error);
      });
    });
    const afterAbort = getStore(getConfig().dataDir).downloadState(abortHash);
    assert(afterAbort?.usedAt == null && afterAbort?.downloadCount === 0, "aborted early access download is not counted");
    const resumed = await fetch(`http://127.0.0.1:${earlyServer.port}/api/download/${abortToken}?raw=1`, {
      headers: { Accept: "text/html" },
    });
    const resumedBytes = Buffer.from(await resumed.arrayBuffer());
    assert(resumed.status === 200 && resumedBytes.equals(big), "download works after an aborted attempt");
    assert(getStore(getConfig().dataDir).downloadState(abortHash)?.downloadCount === 1, "only the finished save counts");

    const expiredRaw = mintDownloadToken();
    getStore(getConfig().dataDir).issueToken({
      orderId: "paid-expired-selfcheck",
      captureId: "CAP-EXPIRED",
      payerEmail: "buyer@example.com",
      amount: "4.00",
      currency: "USD",
      tokenHash: hashDownloadToken(expiredRaw, secret),
      sealedToken: sealDownloadToken(expiredRaw, secret),
      ttlMs: -1,
    });
    const expiredHtml = await request(earlyServer.port, "GET", `/api/download/${expiredRaw}`, undefined, {
      Accept: "text/html",
    });
    assert(expiredHtml.status === 410, "expired link html status");
    assert(expiredHtml.text.includes("has expired") && expiredHtml.text.includes("פג תוקפו"), "expired link explains both languages");
    assert(expiredHtml.text.includes("https://l-studio.studio/#early-access"), "expired link points back to early access");

    const sentBeforeLimit = sentBodies.length;
    const limited = await request(
      earlyServer.port,
      "POST",
      "/api/early-access",
      JSON.stringify({ email: "ada@example.com" }),
      { "Content-Type": "application/json" },
    );
    assert(limited.status === 429 && (limited.json as { error?: string }).error === "rate_limited", "early access resend is rate limited");
    assert(getStore(getConfig().dataDir).countEarlyAccess() === 2, "rate limited resend does not consume a spot");
    assert(sentBodies.length === sentBeforeLimit, "rate limited resend does not send");

    delete process.env.ADMIN_STATS_SECRET;
    resetConfigForTests();
    const statsClosed = await request(earlyServer.port, "GET", `/api/admin/early-access-stats?secret=${statsSecret}`);
    assert(statsClosed.status === 503 && (statsClosed.json as { error?: string }).error === "not_configured", "stats stay closed without a secret");
    assert(!statsClosed.text.includes("@"), "disabled stats leak no email");
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
