import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Link } from "wouter";
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
  const [copy, setCopy] = useState<ProCopy>(fallback[language]);
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setCopy(fallback[language]);
    fetch(`${import.meta.env.BASE_URL}content.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const pro = data?.languages?.[language]?.pro as Partial<ProCopy> | undefined;
        setCopy(mergeCopy(language, pro));
      })
      .catch(() => {});
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
              <p className="pro-price">{copy.priceNote}</p>
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
              <p className="pro-paused" role="status">{copy.checkoutNote}</p>
              <p className="pro-disclaimer">
                {copy.supportLabel}: <a href={`mailto:${SUPPORT_EMAIL}`} dir="ltr">{SUPPORT_EMAIL}</a>
              </p>
              <p className="pro-disclaimer">
                <Link href="/terms">{copy.terms}</Link>
                {" · "}
                <Link href="/privacy">{copy.privacy}</Link>
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
