import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { fetchSiteContent } from "@/lib/siteContent";
import { exclusiveNavLabel } from "@/lib/exclusiveNav";

type ExclusivePack = {
  id: string;
  name: string;
  tagline: string;
  meta: string;
  styles: string[];
};

type ExclusiveCopy = {
  eyebrow: string;
  title: string;
  titleEm: string;
  intro: string;
  navLabel: string;
  imageAlt: string;
  comingSoon: string;
  stylesHeading: string;
  packs: ExclusivePack[];
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
  drumsLabel: string;
  onThisPage: string;
};

const PACK_STEM: Record<string, string> = {
  "afro-techno": "09-afro-techno",
  "victory-peak": "10-victory-peak",
  "healing-journey": "11-healing-journey",
};

const FALLBACK_PACKS: ExclusivePack[] = [
  {
    id: "afro-techno",
    name: "Afro Techno",
    tagline: "DESERT. GROOVE. DROP.",
    meta: "118–134 BPM · 8 CHANNELS · 8 STYLES",
    styles: ["Sahara Pulse", "Gnawa Step", "Djembe Wire", "Maghreb Roll", "Kasbah Build", "Atlas Drop", "Desert Peak", "Night Medina"],
  },
  {
    id: "victory-peak",
    name: "Victory Peak",
    tagline: "UNITY. FIRE. PEAK.",
    meta: "138–148 BPM · 8 CHANNELS · 8 STYLES",
    styles: ["War Horn", "Bone March", "Om Charge", "Shield Wall", "Avalanche", "Ragnar Fire", "Summit Choir", "Eternal Peak"],
  },
  {
    id: "healing-journey",
    name: "Healing Journey",
    tagline: "BREATH. LIGHT. RETURN.",
    meta: "58–74 BPM · 8 CHANNELS · 8 STYLES",
    styles: ["Safe Room", "Soft Breath", "Warm Light", "Still Water", "Deep Roots", "Open Heart", "Clear Sky", "Soft Return"],
  },
];

const emptyExclusive = (language: Language): ExclusiveCopy => ({
  eyebrow: "L-STUDIO / EXCLUSIVE",
  title: language === "he" ? "שלוש חבילות." : language === "ru" ? "Три пака." : language === "ar" ? "ثلاث حزم." : "Three packs.",
  titleEm: language === "he" ? "בקרוב." : language === "ru" ? "Скоро." : language === "ar" ? "قريباً." : "Coming soon.",
  intro:
    language === "he"
      ? "קו נפרד משמונה ערכות התופים של Factory. שלוש חבילות תופים בדרך, ובכל אחת 8 ערוצים ו־8 סגנונות."
      : language === "ru"
        ? "Отдельная линейка, не восемь наборов Factory Drums. Три ударных пака на подходе: в каждом 8 каналов и 8 стилей."
        : language === "ar"
          ? "خط منفصل عن حزم الطبول الثماني في Factory. ثلاث حزم طبول في الطريق، وفي كل واحدة 8 قنوات و8 أساليب."
          : "A separate line from the eight Factory Drums kits. Three upcoming drum packs, each with 8 channels and 8 styles.",
  navLabel: exclusiveNavLabel[language],
  imageAlt:
    language === "he"
      ? "כרזת חבילת תופים בלעדית"
      : language === "ru"
        ? "Постер эксклюзивного ударного пака"
        : language === "ar"
          ? "ملصق حزمة طبول حصرية"
          : "Exclusive drum pack poster",
  comingSoon: language === "he" ? "בקרוב" : language === "ru" ? "Скоро" : language === "ar" ? "قريباً" : "Coming soon",
  stylesHeading: language === "he" ? "סגנונות" : language === "ru" ? "Стили" : language === "ar" ? "الأساليب" : "Styles",
  packs: FALLBACK_PACKS,
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
  drumsLabel: language === "he" ? "ערכות תופים" : language === "ru" ? "Барабаны" : language === "ar" ? "الطبول" : "Drum kits",
  onThisPage: language === "he" ? "בעמוד הזה" : language === "ru" ? "На этой странице" : language === "ar" ? "في هذه الصفحة" : "On this page",
});

function packMedia(id: string) {
  const stem = PACK_STEM[id];
  if (!stem) return null;
  const base = `${import.meta.env.BASE_URL}assets/exclusive/${stem}`;
  return { jpg: `${base}.jpg`, webp: `${base}.webp` };
}

export default function Exclusive() {
  const { language, isRtl } = useLanguage();
  const [text, setText] = useState<ExclusiveCopy>(() => emptyExclusive(language));
  const [chrome, setChrome] = useState<ChromeCopy>(() => emptyChrome(language));

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setText(emptyExclusive(language));
    setChrome(emptyChrome(language));
    fetchSiteContent()
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const lang = data.languages?.[language];
        const block = lang?.exclusive as ExclusiveCopy | undefined;
        const presets = lang?.factory64 as { navLabel?: string; back?: string; home?: string; features?: string; architecture?: string; guide?: string; privacy?: string; terms?: string; onThisPage?: string } | undefined;
        const drumsNav = lang?.factoryDrums?.navLabel;
        if (block) {
          setText({
            ...emptyExclusive(language),
            ...block,
            packs: block.packs?.length ? block.packs : FALLBACK_PACKS,
          });
        }
        setChrome({
          ...emptyChrome(language),
          back: presets?.back || emptyChrome(language).back,
          home: presets?.home || emptyChrome(language).home,
          features: presets?.features || emptyChrome(language).features,
          architecture: presets?.architecture || emptyChrome(language).architecture,
          guide: presets?.guide || emptyChrome(language).guide,
          privacy: presets?.privacy || emptyChrome(language).privacy,
          terms: presets?.terms || emptyChrome(language).terms,
          presetsLabel: presets?.navLabel || "Factory 64",
          drumsLabel: typeof drumsNav === "string" && drumsNav ? drumsNav : emptyChrome(language).drumsLabel,
          onThisPage: presets?.onThisPage || emptyChrome(language).onThisPage,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [language]);

  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div className="site-shell factory64-page exclusive-page">
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
            <Link href="/factory-64/drums">{chrome.drumsLabel}</Link>
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
        <section className="exclusive-hero container" dir={dir}>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> {text.eyebrow}
          </div>
          <h1>
            {text.title} <em>{text.titleEm}</em>
          </h1>
          {text.intro ? <p>{text.intro}</p> : null}
          <div className="factory64-hero-actions">
            <span className="exclusive-status" role="status">
              {text.comingSoon}
            </span>
            <Link className="button button--light" href="/factory-64/drums">
              {chrome.drumsLabel}
            </Link>
          </div>
        </section>

        <section className="container exclusive-grid" dir={dir} aria-label={text.navLabel}>
          {text.packs.map((pack, index) => {
            const media = packMedia(pack.id);
            return (
              <article className="exclusive-card" id={pack.id} key={pack.id}>
                {media ? (
                  <figure>
                    <picture>
                      <source srcSet={media.webp} type="image/webp" />
                      <img
                        src={media.jpg}
                        alt={`${pack.name}. ${text.imageAlt}`}
                        width={1600}
                        height={900}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </picture>
                  </figure>
                ) : null}
                <div className="exclusive-card-body">
                  <div className="exclusive-card-head">
                    <h2 dir="ltr">{pack.name}</h2>
                    <span className="exclusive-badge">{text.comingSoon}</span>
                  </div>
                  <p className="exclusive-tagline" dir="ltr">
                    {pack.tagline}
                  </p>
                  <p className="exclusive-meta" dir="ltr">
                    {pack.meta}
                  </p>
                  <h3>{text.stylesHeading}</h3>
                  <ul className="exclusive-styles">
                    {pack.styles.map((style) => (
                      <li key={style} dir="ltr">
                        {style}
                      </li>
                    ))}
                  </ul>
                  <span className="exclusive-status" role="status">
                    {text.comingSoon}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
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
            <Link href="/factory-64/drums">{chrome.drumsLabel}</Link>
            <span>{text.navLabel}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
