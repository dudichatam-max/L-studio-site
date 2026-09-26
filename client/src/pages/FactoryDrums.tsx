import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

type DrumKit = {
  id: string;
  name: string;
  body: string;
  tech: string;
};

type DrumsCopy = {
  eyebrow: string;
  title: string;
  titleEm: string;
  intro: string;
  navLabel: string;
  imageAlt: string;
  closingTitle: string;
  closingBody: string;
  closingLine: string;
  kits: DrumKit[];
};

type ChromeCopy = {
  back: string;
  home: string;
  features: string;
  architecture: string;
  guide: string;
  privacy: string;
  terms: string;
  presetsLabel: string;
  earlyAccessCta: string;
  onThisPage: string;
};

const KIT_STEM: Record<string, string> = {
  "rap-90": "01-rap-90",
  "hip-hop-2000s": "02-hip-hop-2000s",
  "soft-indie": "03-soft-indie",
  "psy-progressive-rock": "04-psy-progressive-rock",
  "berlin-90s-techno": "05-berlin-90s-techno",
  "tribal-ambient-trance": "06-tribal-ambient-trance",
  "goa-trance": "07-goa-trance",
  "experimental": "08-experimental",
};

const emptyDrums = (language: Language): DrumsCopy => ({
  eyebrow: "L-STUDIO / FACTORY PACK / DRUMS",
  title: language === "he" ? "8 ערכות תופים." : language === "ru" ? "8 ударных наборов." : language === "ar" ? "8 حزم طبول." : "8 drum kits.",
  titleEm: language === "he" ? "8 סגנונות בכל ערכה." : language === "ru" ? "8 стилей в каждом." : language === "ar" ? "8 أساليب في كل حزمة." : "8 styles each.",
  intro: "",
  navLabel: language === "he" ? "ערכות תופים" : language === "ru" ? "Барабаны" : language === "ar" ? "الطبول" : "Drum kits",
  imageAlt: language === "he" ? "כרזת ערכת תופים" : language === "ru" ? "Постер ударного набора" : language === "ar" ? "ملصق حزمة الطبول" : "Drum kit poster",
  closingTitle: "",
  closingBody: "",
  closingLine: "",
  kits: [],
});

const emptyChrome = (language: Language): ChromeCopy => ({
  back: language === "he" ? "חזרה לאתר" : language === "ru" ? "Вернуться на сайт" : language === "ar" ? "العودة إلى الموقع" : "Back to site",
  home: language === "he" ? "דף הבית" : language === "ru" ? "Главная" : language === "ar" ? "الرئيسية" : "Home",
  features: language === "he" ? "יכולות" : language === "ru" ? "Возможности" : language === "ar" ? "المزايا" : "Features",
  architecture: language === "he" ? "איך זה עובד" : language === "ru" ? "Как это работает" : language === "ar" ? "كيف يعمل" : "How it works",
  guide: language === "he" ? "מדריך למשתמש" : language === "ru" ? "Руководство" : language === "ar" ? "دليل المستخدم" : "User guide",
  privacy: language === "he" ? "פרטיות" : language === "ru" ? "Приватность" : language === "ar" ? "الخصوصية" : "Privacy",
  terms: language === "he" ? "תנאי שימוש" : language === "ru" ? "Условия" : language === "ar" ? "الشروط" : "Terms",
  presetsLabel: "Factory 64",
  earlyAccessCta: language === "he" ? "לרכישת L Studio Pro" : language === "ru" ? "Купить L Studio Pro" : language === "ar" ? "اشترِ L Studio Pro" : "Get L Studio Pro",
  onThisPage: language === "he" ? "בעמוד הזה" : language === "ru" ? "На этой странице" : language === "ar" ? "في هذه الصفحة" : "On this page",
});

function kitMedia(id: string) {
  const stem = KIT_STEM[id];
  if (!stem) return null;
  const base = `${import.meta.env.BASE_URL}assets/drums/${stem}`;
  return { jpg: `${base}.jpg`, webp: `${base}.webp` };
}

export default function FactoryDrums() {
  const { language, isRtl } = useLanguage();
  const [text, setText] = useState<DrumsCopy>(() => emptyDrums(language));
  const [chrome, setChrome] = useState<ChromeCopy>(() => emptyChrome(language));

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setText(emptyDrums(language));
    setChrome(emptyChrome(language));
    fetch(`${import.meta.env.BASE_URL}content.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const lang = data.languages?.[language];
        const block = lang?.factoryDrums as DrumsCopy | undefined;
        const presets = lang?.factory64 as { navLabel?: string; earlyAccessCta?: string; back?: string; home?: string; features?: string; architecture?: string; guide?: string; privacy?: string; terms?: string; onThisPage?: string } | undefined;
        if (block) {
          setText({
            ...emptyDrums(language),
            ...block,
            kits: block.kits ?? [],
          });
        }
        if (presets) {
          setChrome({
            ...emptyChrome(language),
            ...{
              back: presets.back || emptyChrome(language).back,
              home: presets.home || emptyChrome(language).home,
              features: presets.features || emptyChrome(language).features,
              architecture: presets.architecture || emptyChrome(language).architecture,
              guide: presets.guide || emptyChrome(language).guide,
              privacy: presets.privacy || emptyChrome(language).privacy,
              terms: presets.terms || emptyChrome(language).terms,
              presetsLabel: presets.navLabel || "Factory 64",
              earlyAccessCta: presets.earlyAccessCta || emptyChrome(language).earlyAccessCta,
              onThisPage: presets.onThisPage || emptyChrome(language).onThisPage,
            },
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [language]);

  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div className="site-shell factory64-page factory-drums-page">
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={chrome.onThisPage}>
            <Link href="/">{chrome.home}</Link>
            <a href="/#features">{chrome.features}</a>
            <a href="/#architecture">{chrome.architecture}</a>
            <Link href="/guide">{chrome.guide}</Link>
            <Link href="/privacy">{chrome.privacy}</Link>
            <Link href="/terms">{chrome.terms}</Link>
            <Link href="/factory-64">{chrome.presetsLabel}</Link>
            <span className="nav-current">{text.navLabel}</span>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <Link className="button button--small button--light" href="/">
              {chrome.back} <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="factory-drums-hero container" dir={dir}>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> {text.eyebrow}
          </div>
          <h1>
            {text.title} <em>{text.titleEm}</em>
          </h1>
          {text.intro ? <p>{text.intro}</p> : null}
          <div className="factory64-hero-actions">
            <Link className="button button--primary" href="/buy">
              {chrome.earlyAccessCta}
            </Link>
            <Link className="button button--light" href="/factory-64">
              {chrome.presetsLabel}
            </Link>
          </div>
        </section>

        <section className="container factory-drums-grid" dir={dir} aria-label={text.navLabel}>
          {text.kits.map((kit, index) => {
            const media = kitMedia(kit.id);
            return (
              <article className="factory-drum-card" id={kit.id} key={kit.id}>
                {media ? (
                  <figure>
                    <picture>
                      <source srcSet={media.webp} type="image/webp" />
                      <img
                        src={media.jpg}
                        alt={`${kit.name}. ${text.imageAlt}`}
                        width={784}
                        height={1168}
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </picture>
                  </figure>
                ) : null}
                <div className="factory-drum-card-body">
                  <h2 dir="ltr">{kit.name}</h2>
                  <p>{kit.body}</p>
                  <p className="factory-drum-tech" dir="ltr">
                    {kit.tech}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        {text.closingTitle ? (
          <section className="container factory-drums-close" dir={dir}>
            <h2>{text.closingTitle}</h2>
            {text.closingBody ? <p>{text.closingBody}</p> : null}
            {text.closingLine ? <p>{text.closingLine}</p> : null}
          </section>
        ) : null}
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <SiteLogo compact />
          <div className="footer-links">
            <Link href="/">{chrome.home}</Link>
            <a href="/#features">{chrome.features}</a>
            <Link href="/guide">{chrome.guide}</Link>
            <Link href="/privacy">{chrome.privacy}</Link>
            <Link href="/terms">{chrome.terms}</Link>
            <Link href="/factory-64">{chrome.presetsLabel}</Link>
            <span>{text.navLabel}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
