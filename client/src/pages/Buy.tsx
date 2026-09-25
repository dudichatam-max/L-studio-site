import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Link, useLocation } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import proCopyJson from "@shared/pro-copy.json";

const SUPPORT_EMAIL = "dudichatam@gmail.com";
const SESSION_KEY = "l-studio-pro-checkout";

export type ProCopy = {
  nav: string;
  back: string;
  home: string;
  privacy: string;
  terms: string;
  guide: string;
  features: string;
  architecture: string;
  kicker: string;
  titleLead: string;
  titleEm: string;
  lede: string;
  body: string;
  priceNote: string;
  includes: string[];
  checkoutNote: string;
  loadingPayPal: string;
  paypalMissing: string;
  payError: string;
  payCancelled: string;
  successKicker: string;
  successTitleLead: string;
  successTitleEm: string;
  missingTitleLead: string;
  missingTitleEm: string;
  successBody: string;
  downloadCta: string;
  installNote: string;
  emailSent: string;
  emailSkipped: string;
  emailFailed: string;
  missingSession: string;
  supportLabel: string;
  disclaimer: string;
  homeLink: string;
  orderLabel: string;
};

const fallback = proCopyJson as Record<Language, ProCopy>;

type CheckoutResult = {
  orderId?: string;
  downloadUrl?: string;
  payerEmail?: string;
  email?: "sent" | "skipped" | "failed";
};

type PayPalButtonsApi = {
  Buttons: (options: {
    style?: { layout?: "vertical"; color?: "gold"; shape?: "rect"; label?: "pay" };
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onCancel?: () => void;
    onError?: () => void;
  }) => { render: (element: HTMLElement) => Promise<void> };
};

declare global {
  interface Window {
    paypal?: PayPalButtonsApi;
  }
}

function apiUrl(apiBase: string, path: string) {
  const configured = (apiBase || import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  return `${configured}${path}`;
}

function loadPayPal(clientId: string, currency: string) {
  if (window.paypal) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
    script.async = true;
    script.dataset.lStudioPaypal = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("paypal_sdk"));
    document.body.appendChild(script);
  });
}

function mergeCopy(language: Language, raw: Partial<ProCopy> | undefined): ProCopy {
  const base = fallback[language];
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    includes: Array.isArray(raw.includes) && raw.includes.length > 0 ? raw.includes : base.includes,
  };
}

export default function Buy({ mode }: { mode: "checkout" | "success" }) {
  const { language, isRtl } = useLanguage();
  const [, setLocation] = useLocation();
  const [copy, setCopy] = useState<ProCopy>(fallback[language]);
  const [apiBase, setApiBase] = useState("");
  const [contentReady, setContentReady] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "missing" | "error" | "cancelled">("loading");
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [priceLabel, setPriceLabel] = useState(fallback[language].priceNote);
  const buttonHost = useRef<HTMLDivElement>(null);
  const setLocationRef = useRef(setLocation);
  setLocationRef.current = setLocation;

  useEffect(() => {
    let cancelled = false;
    setCopy(fallback[language]);
    fetch(`${import.meta.env.BASE_URL}content.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const pro = data?.languages?.[language]?.pro as Partial<ProCopy> | undefined;
        setCopy(mergeCopy(language, pro));
        setApiBase(typeof data?.commerce?.apiBaseUrl === "string" ? data.commerce.apiBaseUrl : "");
        setContentReady(true);
      })
      .catch(() => {
        if (!cancelled) setContentReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    if (mode !== "success") return;
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      setResult(raw ? (JSON.parse(raw) as CheckoutResult) : null);
    } catch {
      setResult(null);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "checkout" || !contentReady) return;
    const host = buttonHost.current;
    let cancelled = false;
    setPhase("loading");

    const run = async () => {
      const response = await fetch(apiUrl(apiBase, "/api/paypal/config"));
      const config = (await response.json().catch(() => null)) as {
        configured?: boolean;
        clientId?: string;
        currency?: string;
        price?: string;
      } | null;
      if (cancelled) return;
      if (!response.ok || !config?.configured || !config.clientId) {
        setPhase("missing");
        return;
      }
      if (config.price) setPriceLabel(`USD ${config.price}`);
      await loadPayPal(config.clientId, config.currency || "USD");
      if (cancelled || !host || !window.paypal) return;
      host.replaceChildren();
      await window.paypal
        .Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
          createOrder: async () => {
            const created = await fetch(apiUrl(apiBase, "/api/paypal/create-order"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            const payload = (await created.json().catch(() => null)) as { id?: string } | null;
            if (!created.ok || !payload?.id) throw new Error("create_failed");
            return payload.id;
          },
          onApprove: async (data) => {
            const captured = await fetch(apiUrl(apiBase, "/api/paypal/capture-order"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const payload = (await captured.json().catch(() => null)) as CheckoutResult & { error?: string } | null;
            if (!captured.ok || !payload?.downloadUrl) {
              setPhase("error");
              return;
            }
            const next: CheckoutResult = {
              orderId: payload.orderId,
              downloadUrl: payload.downloadUrl,
              payerEmail: payload.payerEmail,
              email: payload.email,
            };
            window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
            setLocationRef.current("/buy/success");
          },
          onCancel: () => setPhase("cancelled"),
          onError: () => setPhase("error"),
        })
        .render(host);
      if (!cancelled) setPhase("ready");
    };

    run().catch(() => {
      if (!cancelled) setPhase("missing");
    });

    return () => {
      cancelled = true;
      host?.replaceChildren();
    };
  }, [apiBase, contentReady, mode]);

  const dir = isRtl ? "rtl" : "ltr";
  const hasDownload = Boolean(result?.downloadUrl);
  const emailLine =
    result?.email === "sent"
      ? copy.emailSent.replace("{email}", result.payerEmail || "")
      : result?.email === "failed"
        ? copy.emailFailed
        : copy.emailSkipped;

  return (
    <div className="site-shell privacy-page" dir={dir}>
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={copy.kicker}>
            <Link href="/">{copy.home}</Link>
            <a href="/#features">{copy.features}</a>
            <Link href="/guide">{copy.guide}</Link>
            <Link href="/privacy">{copy.privacy}</Link>
            <Link href="/terms">{copy.terms}</Link>
            <span className="nav-current">{copy.nav}</span>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <Link className="button button--small button--light" href="/">
              {copy.back} <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="privacy-hero container">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> {mode === "success" && hasDownload ? copy.successKicker : copy.kicker}
          </div>
          <h1>
            {mode === "success" ? (hasDownload ? copy.successTitleLead : copy.missingTitleLead) : copy.titleLead}
            <br />
            <em>{mode === "success" ? (hasDownload ? copy.successTitleEm : copy.missingTitleEm) : copy.titleEm}</em>
          </h1>
          <p>{mode === "success" ? (hasDownload ? copy.successBody : copy.missingSession) : copy.lede}</p>
        </section>
        {mode === "checkout" ? (
          <section className="container pro-layout">
            <div className="pro-card">
              <p className="pro-price">{priceLabel}</p>
              <p>{copy.body}</p>
              <ul className="pro-includes">
                {copy.includes.map((item) => (
                  <li key={item}>
                    <Check size={16} /> {item}
                  </li>
                ))}
              </ul>
              <p className="pro-disclaimer">{copy.disclaimer}</p>
            </div>
            <div className="pro-card pro-pay">
              <p>{copy.checkoutNote}</p>
              <div className="pro-paypal" dir="ltr" ref={buttonHost} />
              {phase === "loading" && <p className="pro-status">{copy.loadingPayPal}</p>}
              {phase === "missing" && <p className="pro-status">{copy.paypalMissing}</p>}
              {phase === "error" && <p className="pro-status pro-status--error">{copy.payError}</p>}
              {phase === "cancelled" && <p className="pro-status">{copy.payCancelled}</p>}
              <p className="pro-disclaimer">
                <Link href="/terms">{copy.terms}</Link>
                {" · "}
                <Link href="/privacy">{copy.privacy}</Link>
                {" · "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </p>
            </div>
          </section>
        ) : (
          <section className="container pro-layout">
            <div className="pro-card">
              {result?.downloadUrl ? (
                <>
                  <a className="button button--primary" href={result.downloadUrl} rel="nofollow">
                    {copy.downloadCta} <ArrowUpRight size={17} />
                  </a>
                  <p>{emailLine}</p>
                  {result.orderId && (
                    <p className="pro-order">
                      {copy.orderLabel}: {result.orderId}
                    </p>
                  )}
                  <p className="pro-disclaimer">{copy.installNote}</p>
                </>
              ) : (
                <p>
                  <Link className="text-link" href="/buy">{copy.homeLink}</Link>
                </p>
              )}
              <p className="pro-disclaimer">
                {copy.supportLabel}: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </p>
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <SiteLogo compact />
          <div className="footer-links">
            <Link href="/">{copy.home}</Link>
            <Link href="/guide">{copy.guide}</Link>
            <Link href="/privacy">{copy.privacy}</Link>
            <Link href="/terms">{copy.terms}</Link>
            <span>{copy.nav}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
