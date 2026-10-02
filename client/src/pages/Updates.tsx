import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { fetchSiteContent } from "@/lib/siteContent";
import { exclusiveNavLabel } from "@/lib/exclusiveNav";
import { groupUpdates, mergeUpdates, updateScreenshots, type UpdatesCopy } from "@/lib/updatesCopy";

type ChromeCopy = {
  back: string;
  home: string;
  features: string;
  architecture: string;
  guide: string;
  privacy: string;
  terms: string;
  onThisPage: string;
};

type GuideChrome = Partial<ChromeCopy>;

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

function webpUrl(path: string) {
  return assetUrl(path.replace(/\.jpe?g$/i, ".webp"));
}

const emptyChrome = (language: Language): ChromeCopy => ({
  back: language === "he" ? "חזרה לאתר" : language === "ru" ? "Вернуться на сайт" : language === "ar" ? "العودة إلى الموقع" : "Back to site",
  home: language === "he" ? "דף הבית" : language === "ru" ? "Главная" : language === "ar" ? "الرئيسية" : "Home",
  features: language === "he" ? "יכולות" : language === "ru" ? "Возможности" : language === "ar" ? "المزايا" : "Features",
  architecture: language === "he" ? "איך זה עובד" : language === "ru" ? "Как это работает" : language === "ar" ? "كيف يعمل" : "How it works",
  guide: language === "he" ? "מדריך למשתמש" : language === "ru" ? "Руководство" : language === "ar" ? "دليل المستخدم" : "User guide",
  privacy: language === "he" ? "פרטיות" : language === "ru" ? "Приватность" : language === "ar" ? "الخصوصية" : "Privacy",
  terms: language === "he" ? "תנאי שימוש" : language === "ru" ? "Условия" : language === "ar" ? "الشروط" : "Terms",
  onThisPage: language === "he" ? "בעמוד הזה" : language === "ru" ? "На этой странице" : language === "ar" ? "في هذه الصفحة" : "On this page",
});

export default function Updates() {
  const { language, isRtl } = useLanguage();
  const [copy, setCopy] = useState<UpdatesCopy>(() => mergeUpdates(language));
  const [chrome, setChrome] = useState<ChromeCopy>(() => emptyChrome(language));

  useEffect(() => {
    let cancelled = false;
    setCopy(mergeUpdates(language));
    setChrome(emptyChrome(language));
    fetchSiteContent()
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const lang = data.languages?.[language];
        const guide = lang?.guide as GuideChrome | undefined;
        setCopy(mergeUpdates(language, lang?.updates));
        if (guide) {
          const base = emptyChrome(language);
          setChrome({
            back: guide.back || base.back,
            home: guide.home || base.home,
            features: guide.features || base.features,
            architecture: guide.architecture || base.architecture,
            guide: base.guide,
            privacy: guide.privacy || base.privacy,
            terms: guide.terms || base.terms,
            onThisPage: guide.onThisPage || base.onThisPage,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [language]);

  const dir = isRtl ? "rtl" : "ltr";
  const groups = groupUpdates(copy);

  return (
    <div className="site-shell factory64-page updates-page">
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
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
            <span className="nav-current">{copy.navLabel}</span>
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
        <section className="exclusive-hero updates-hero container" dir={dir}>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> {copy.pageKicker}
          </div>
          <h1>{copy.pageTitle}</h1>
          {copy.pageIntro ? <p>{copy.pageIntro}</p> : null}
          <nav className="updates-jump" aria-label={chrome.onThisPage}>
            {groups.map((group) => (
              <a key={group.status} href={`#updates-${group.status}`}>
                {group.title}
              </a>
            ))}
          </nav>
        </section>

        <div className="container updates-groups" dir={dir}>
          {groups.map((group, index) => (
            <section className="updates-group" id={`updates-${group.status}`} key={group.status} aria-labelledby={`updates-heading-${group.status}`}>
              <header className="updates-group-head">
                <span className="updates-index">{String(index + 1).padStart(2, "0")}</span>
                <h2 id={`updates-heading-${group.status}`}>{group.title}</h2>
              </header>
              <div className="updates-list">
                {group.items.map((item) => {
                  const shots = updateScreenshots(item);
                  return (
                    <article className={shots.length ? "updates-card updates-card--media" : "updates-card"} id={item.id} key={item.id}>
                      <div className="updates-card-copy">
                        <div className="updates-card-head">
                          <h3>{item.title}</h3>
                          <span className="exclusive-badge">{copy.statusLabels?.[item.status] ?? group.title}</span>
                        </div>
                        <p>{item.summary}</p>
                        {item.detail ? <p className="updates-detail">{item.detail}</p> : null}
                        {item.dateLabel ? <p className="updates-date">{item.dateLabel}</p> : null}
                      </div>
                      {shots.length ? (
                        <div className="updates-card-shots">
                          {shots.map((shot) => (
                            <figure className="updates-shot" key={shot.src}>
                              <picture>
                                {/\.jpe?g$/i.test(shot.src) ? <source srcSet={webpUrl(shot.src)} type="image/webp" /> : null}
                                <img src={assetUrl(shot.src)} alt={shot.alt} width={720} height={1530} loading="lazy" decoding="async" />
                              </picture>
                            </figure>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
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
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
            <span>{copy.navLabel}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
