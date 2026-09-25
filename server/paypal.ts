import { centsToUsd, PRODUCT_CODE, toCents, type CommerceConfig } from "./config";

export type PayPalAmount = { currency_code?: string; value?: string };

export type PayPalOrder = {
  id?: string;
  status?: string;
  payer?: { email_address?: string };
  purchase_units?: Array<{
    custom_id?: string;
    reference_id?: string;
    description?: string;
    amount?: PayPalAmount;
    payments?: { captures?: Array<{ id?: string; status?: string; amount?: PayPalAmount }> };
  }>;
};

export class PaypalApiError extends Error {
  status: number;
  issue?: string;

  constructor(message: string, status: number, issue?: string) {
    super(message);
    this.status = status;
    this.issue = issue;
  }
}

type TokenCache = { token: string; exp: number; key: string };
let tokenCache: TokenCache | null = null;

export function paypalApiBase(mode: CommerceConfig["paypalMode"]): string {
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export function resetPaypalCacheForTests() {
  tokenCache = null;
}

function issueFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const details = (body as { details?: Array<{ issue?: string }> }).details;
  return details?.[0]?.issue;
}

async function paypalFetch(config: CommerceConfig, urlPath: string, init: RequestInit): Promise<unknown> {
  const token = await paypalAccessToken(config);
  const response = await fetch(`${paypalApiBase(config.paypalMode)}${urlPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    throw new PaypalApiError("paypal_request_failed", response.status, issueFromBody(body));
  }
  return body;
}

export async function paypalAccessToken(config: CommerceConfig): Promise<string> {
  if (!config.paypalConfigured) {
    throw new PaypalApiError("paypal_not_configured", 503);
  }
  const key = `${config.paypalMode}:${config.paypalClientId}`;
  if (tokenCache && tokenCache.key === key && tokenCache.exp > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString("base64");
  const response = await fetch(`${paypalApiBase(config.paypalMode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new PaypalApiError("paypal_auth_failed", response.status);
  }
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new PaypalApiError("paypal_auth_failed", 502);
  }
  tokenCache = {
    token: json.access_token,
    exp: Date.now() + (json.expires_in || 300) * 1000,
    key,
  };
  return json.access_token;
}

export async function createPaypalOrder(config: CommerceConfig): Promise<PayPalOrder> {
  const body = await paypalFetch(config, "/v2/checkout/orders", {
    method: "POST",
    headers: { "PayPal-Request-Id": `create-${crypto.randomUUID()}` },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: PRODUCT_CODE,
          custom_id: PRODUCT_CODE,
          description: config.productName,
          amount: { currency_code: "USD", value: config.priceUsd },
        },
      ],
      application_context: {
        brand_name: "L Studio",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });
  return body as PayPalOrder;
}

export async function capturePaypalOrder(config: CommerceConfig, orderId: string): Promise<PayPalOrder> {
  const body = await paypalFetch(config, `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: "POST",
    headers: {
      "PayPal-Request-Id": `capture-${orderId}`,
      Prefer: "return=representation",
    },
    body: "{}",
  });
  return body as PayPalOrder;
}

export async function getPaypalOrder(config: CommerceConfig, orderId: string): Promise<PayPalOrder> {
  const body = await paypalFetch(config, `/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  return body as PayPalOrder;
}

export function isAlreadyCaptured(error: unknown): boolean {
  return error instanceof PaypalApiError && error.issue === "ORDER_ALREADY_CAPTURED";
}

export type VerifiedPayment = {
  orderId: string;
  captureId: string;
  payerEmail: string;
  amount: string;
  currency: string;
};

export function verifyPaidOrder(order: PayPalOrder, expectedCents: number): { ok: true; payment: VerifiedPayment } | { ok: false; reason: string } {
  if (!order.id || !/^[A-Z0-9]{8,40}$/.test(order.id)) return { ok: false, reason: "order_id" };
  if (order.status !== "COMPLETED") return { ok: false, reason: "order_not_completed" };
  const unit = order.purchase_units?.[0];
  if (!unit) return { ok: false, reason: "missing_unit" };
  if (unit.custom_id && unit.custom_id !== PRODUCT_CODE) return { ok: false, reason: "product_mismatch" };
  if (unit.reference_id && unit.reference_id !== PRODUCT_CODE) return { ok: false, reason: "product_mismatch" };
  if (toCents(unit.amount?.value) !== expectedCents || unit.amount?.currency_code !== "USD") {
    return { ok: false, reason: "amount_mismatch" };
  }
  const capture = unit.payments?.captures?.find((item) => item.status === "COMPLETED" && item.id);
  if (!capture?.id) return { ok: false, reason: "capture_missing" };
  if (toCents(capture.amount?.value) !== expectedCents || capture.amount?.currency_code !== "USD") {
    return { ok: false, reason: "capture_amount_mismatch" };
  }
  const email = order.payer?.email_address?.trim() || "";
  return {
    ok: true,
    payment: {
      orderId: order.id,
      captureId: capture.id,
      payerEmail: email,
      amount: centsToUsd(expectedCents),
      currency: "USD",
    },
  };
}

export async function ensureCapturedOrder(config: CommerceConfig, orderId: string): Promise<PayPalOrder> {
  let order = await getPaypalOrder(config, orderId);
  if (order.status === "COMPLETED") return order;
  if (order.status !== "APPROVED") {
    throw new PaypalApiError("order_not_approved", 409);
  }
  try {
    order = await capturePaypalOrder(config, orderId);
  } catch (error) {
    if (!isAlreadyCaptured(error)) throw error;
    order = await getPaypalOrder(config, orderId);
  }
  return order;
}

export type WebhookHeaders = {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
};

export async function verifyWebhookSignature(config: CommerceConfig, headers: WebhookHeaders, event: unknown): Promise<boolean> {
  if (!config.paypalWebhookId) return false;
  const body = await paypalFetch(config, "/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: config.paypalWebhookId,
      webhook_event: event,
    }),
  });
  return Boolean(body && typeof body === "object" && (body as { verification_status?: string }).verification_status === "SUCCESS");
}

export function orderIdFromWebhook(event: unknown): { orderId: string; eventType: string } | null {
  if (!event || typeof event !== "object") return null;
  const record = event as { event_type?: string; resource?: Record<string, unknown> };
  const eventType = record.event_type || "";
  const resource = record.resource;
  if (!resource) return null;
  if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "CHECKOUT.ORDER.COMPLETED") {
    const id = typeof resource.id === "string" ? resource.id : "";
    return id ? { orderId: id, eventType } : null;
  }
  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const related = resource.supplementary_data as { related_ids?: { order_id?: string } } | undefined;
    const orderId = related?.related_ids?.order_id;
    return orderId ? { orderId, eventType } : null;
  }
  return null;
}
