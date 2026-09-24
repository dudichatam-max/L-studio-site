import { useEffect, useState } from "react";
import { ArrowLeft, Layers } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

type FactoryPreset = { name: string; blurb: string };
type FactoryPage = {
  id: string;
  name: string;
  tagline: string;
  body: string;
  presets: FactoryPreset[];
};

type Factory64Copy = {
  eyebrow: string;
  title: string;
  titleEm: string;
  subtitle: string;
  intro: string[];
  includes: string;
  coverAlt: string;
  back: string;
  home: string;
  features: string;
  architecture: string;
  guide: string;
  privacy: string;
  terms: string;
  navLabel: string;
  onThisPage: string;
  pagesMeta: string;
  voicesMeta: string;
  presetsHeading: string;
  oneLineList: string;
  storeBlurb: string;
  earlyAccessCta: string;
  pages: FactoryPage[];
};

const emptyCopy = (language: Language): Factory64Copy => ({
  eyebrow: "L-STUDIO / FACTORY PACK / 64 VOICES",
  title: "L Studio",
  titleEm: "Factory Pack.",
  subtitle: language === "he" ? "שמונה עמודים. שישים וארבעה קולות." : language === "ru" ? "Восемь страниц. Шестьдесят четыре голоса." : language === "ar" ? "ثماني صفحات. أربعة وستون صوتاً." : "Eight Pages. Sixty-Four Voices.",
  intro: [],
  includes: "",
  coverAlt: "L Studio Factory Pack cover art",
  back: language === "he" ? "חזרה לאתר" : language === "ru" ? "Вернуться на сайт" : language === "ar" ? "العودة إلى الموقع" : "Back to site",
  home: language === "he" ? "דף הבית" : language === "ru" ? "Главная" : language === "ar" ? "الرئيسية" : "Home",
  features: language === "he" ? "יכולות" : language === "ru" ? "Возможности" : language === "ar" ? "المزايا" : "Features",
  architecture: language === "he" ? "איך זה עובד" : language === "ru" ? "Как это работает" : language === "ar" ? "كيف يعمل" : "How it works",
  guide: language === "he" ? "מדריך למשתמש" : language === "ru" ? "Руководство" : language === "ar" ? "دليل المستخدم" : "User guide",
  privacy: language === "he" ? "פרטיות" : language === "ru" ? "Приватность" : language === "ar" ? "الخصوصية" : "Privacy",
  terms: language === "he" ? "תנאי שימוש" : language === "ru" ? "Условия" : language === "ar" ? "الشروط" : "Terms",
  navLabel: "Factory 64",
  onThisPage: language === "he" ? "בעמוד הזה" : language === "ru" ? "На этой странице" : language === "ar" ? "في هذه الصفحة" : "On this page",
  pagesMeta: "8 PAGES",
  voicesMeta: "64 VOICES",
  presetsHeading: language === "he" ? "פריסטים" : language === "ru" ? "Пресеты" : language === "ar" ? "إعدادات مسبقة" : "Presets",
  oneLineList: "",
  storeBlurb: "",
  earlyAccessCta: language === "he" ? "לקבלת גישה מוקדמת" : language === "ru" ? "Получить ранний доступ" : language === "ar" ? "احصل على وصول مبكر" : "Get early access",
  pages: [],
});

const coverUrl = `${import.meta.env.BASE_URL}assets/factory-64-cover.png`;

function sectionNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

export default function Factory64() {
  const { language, isRtl } = useLanguage();
  const [text, setText] = useState<Factory64Copy>(() => emptyCopy(language));

  useEffect(() => {
    let cancelled = false;
    setText(emptyCopy(language));
    fetch(`${import.meta.env.BASE_URL}content.json`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const block = data?.languages?.[language]?.factory64 as Factory64Copy | undefined;
        if (cancelled || !block) return;
        setText({
          ...emptyCopy(language),
          ...block,
          intro: block.intro ?? [],
          pages: block.pages ?? [],
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div className="site-shell factory64-page">
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={text.onThisPage}>
            <Link href="/">{text.home}</Link>
            <a href="/#features">{text.features}</a>
            <a href="/#architecture">{text.architecture}</a>
            <Link href="/guide">{text.guide}</Link>
            <Link href="/privacy">{text.privacy}</Link>
            <Link href="/terms">{text.terms}</Link>
            <span className="nav-current">{text.navLabel}</span>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <Link className="button button--small button--light" href="/">
              {text.back} <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="factory64-hero container" dir={isRtl ? "rtl" : "ltr"}>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> {text.eyebrow}
          </div>
          <div className="factory64-hero-grid">
            <div className="factory64-hero-copy">
              <h1>
                {text.title}
                <br />
                <em>{text.titleEm}</em>
              </h1>
              <p className="factory64-subtitle">{text.subtitle}</p>
              {text.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {text.includes ? <p className="factory64-includes">{text.includes}</p> : null}
              <div className="factory64-hero-meta">
                <Layers size={16} />
                <span>{text.pagesMeta}</span>
                <span className="factory64-hero-sep">·</span>
                <span>{text.voicesMeta}</span>
              </div>
              <div className="factory64-hero-actions">
                <a className="button button--primary" href="/#early-access">
                  {text.earlyAccessCta}
                </a>
                <a className="button button--light" href="#factory64-pages">
                  {text.pagesMeta}
                </a>
              </div>
            </div>
            <figure className="factory64-cover">
              <img src={coverUrl} alt={text.coverAlt} />
            </figure>
          </div>
          {text.oneLineList ? <p className="factory64-oneline">{text.oneLineList}</p> : null}
        </section>

        <section className="factory64-content container" id="factory64-pages">
          <aside className="factory64-aside" dir={isRtl ? "rtl" : "ltr"}>
            <span className="kicker">{text.onThisPage}</span>
            <div className="factory64-toc">
              {text.pages.map((page, index) => (
                <a key={page.id} href={`#factory64-${page.id}`}>
                  <span className="factory64-toc-num">{sectionNumber(index)}</span>
                  <span className="factory64-toc-title">{page.name}</span>
                </a>
              ))}
            </div>
          </aside>

          <article className="factory64-article" dir={isRtl ? "rtl" : "ltr"}>
            {text.pages.map((page, index) => (
              <section className="factory64-card" id={`factory64-${page.id}`} key={page.id}>
                <div className="factory64-card-head">
                  <span className="factory64-number">{sectionNumber(index)}</span>
                  <div>
                    <h2>{page.name}</h2>
                    <p className="factory64-tagline">{page.tagline}</p>
                  </div>
                </div>
                <p className="factory64-body">{page.body}</p>
                <h3 className="factory64-presets-heading">{text.presetsHeading}</h3>
                <ul className="factory64-presets">
                  {page.presets.map((preset) => (
                    <li key={preset.name}>
                      <strong>{preset.name}</strong>
                      <span>{preset.blurb}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {text.storeBlurb ? (
              <section className="factory64-blurb" id="factory64-blurb">
                <p>{text.storeBlurb}</p>
              </section>
            ) : null}
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <SiteLogo compact />
          <div className="footer-links">
            <Link href="/">{text.home}</Link>
            <a href="/#features">{text.features}</a>
            <Link href="/guide">{text.guide}</Link>
            <Link href="/privacy">{text.privacy}</Link>
            <Link href="/terms">{text.terms}</Link>
            <span>{text.navLabel}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
