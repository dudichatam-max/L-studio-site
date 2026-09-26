import { Fragment, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ChevronDown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { fetchSiteContent } from "@/lib/siteContent";

type GuideSection = {
  id: string;
  tag?: string;
  title: string;
  body: string[];
  tipBeginner: string;
  tipAdvanced: string;
  media?: string;
  mediaSize?: "thumb" | "panel";
  bullets?: string[];
};

type GuideCopy = {
  title: string;
  titleEm: string;
  eyebrow: string;
  intro: string;
  onThisPage: string;
  tipBeginner: string;
  tipAdvanced: string;
  back: string;
  home: string;
  privacy: string;
  terms: string;
  features: string;
  architecture: string;
  demoVideo: string;
  demoVideoTitle: string;
  sections: GuideSection[];
};

const DEMO_VIDEO_EMBED = "https://www.youtube.com/embed/CS5ortNiA3o";

const chrome: Record<Language, Omit<GuideCopy, "sections" | "intro" | "title" | "titleEm" | "eyebrow">> = {
  he: { onThisPage: "בעמוד הזה", tipBeginner: "טיפ למתחילים", tipAdvanced: "טיפ למתקדמים", back: "חזרה לאתר", home: "דף הבית", privacy: "פרטיות", terms: "תנאי שימוש", features: "יכולות", architecture: "איך זה עובד", demoVideo: "סרטון להמחשה (לחיצה)", demoVideoTitle: "סרטון להמחשה" },
  en: { onThisPage: "On this page", tipBeginner: "Beginner tip", tipAdvanced: "Advanced tip", back: "Back to site", home: "Home", privacy: "Privacy", terms: "Terms", features: "Features", architecture: "How it works", demoVideo: "Demo video (tap to play)", demoVideoTitle: "Demo video" },
  ru: { onThisPage: "На этой странице", tipBeginner: "Совет новичкам", tipAdvanced: "Совет продвинутым", back: "Вернуться на сайт", home: "Главная", privacy: "Приватность", terms: "Условия", features: "Возможности", architecture: "Как это работает", demoVideo: "Демо-видео (нажмите для воспроизведения)", demoVideoTitle: "Демо-видео" },
  ar: { onThisPage: "في هذه الصفحة", tipBeginner: "نصيحة للمبتدئين", tipAdvanced: "نصيحة للمتقدمين", back: "العودة إلى الموقع", home: "الرئيسية", privacy: "الخصوصية", terms: "الشروط", features: "المزايا", architecture: "كيف يعمل", demoVideo: "فيديو توضيحي (اضغط للتشغيل)", demoVideoTitle: "فيديو توضيحي" },
};

const emptyCopy = (language: Language): GuideCopy => ({
  title: language === "he" ? "מדריך למשתמש" : language === "ru" ? "Руководство" : language === "ar" ? "دليل المستخدم" : "User guide",
  titleEm: "L Studio.",
  eyebrow: "LEARN / USER GUIDE / L STUDIO",
  intro: "",
  ...chrome[language],
  sections: [],
});

const guideNavLabel: Record<Language, string> = {
  he: "מדריך למשתמש",
  en: "User guide",
  ru: "Руководство",
  ar: "دليل المستخدم",
};

function mediaUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

function sectionNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function GuideDemoVideo({ label, playerTitle }: { label: string; playerTitle: string }) {
  const [open, setOpen] = useState(false);
  const panelId = "guide-demo-video-panel";

  return (
    <div className="guide-demo" id="guide-demo-video" data-open={open ? "true" : "false"}>
      <h2>
        <button
          type="button"
          className="guide-demo-summary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{label}</span>
          <ChevronDown className="guide-demo-chevron" size={18} aria-hidden="true" />
        </button>
      </h2>
      {open ? (
        <div className="guide-demo-player" id={panelId}>
          <iframe
            src={DEMO_VIDEO_EMBED}
            title={playerTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : null}
    </div>
  );
}

export default function Guide() {
  const { language, isRtl } = useLanguage();
  const [text, setText] = useState<GuideCopy>(() => emptyCopy(language));

  useEffect(() => {
    let cancelled = false;
    setText(emptyCopy(language));
    fetchSiteContent()
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const guide = data?.languages?.[language]?.guide as GuideCopy | undefined;
        if (cancelled || !guide) return;
        setText({ ...emptyCopy(language), ...guide, sections: guide.sections ?? [] });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [language]);

  const padIndex = text.sections.findIndex((item) => item.id === "pad");
  const demoIndex = text.sections.length === 0 ? -1 : padIndex >= 0 ? padIndex : Math.min(5, text.sections.length - 1);

  return (
    <div className="site-shell guide-page">
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={text.onThisPage}>
            <Link href="/">{text.home}</Link>
            <a href="/#features">{text.features}</a>
            <a href="/#architecture">{text.architecture}</a>
            <Link href="/privacy">{text.privacy}</Link>
            <Link href="/terms">{text.terms}</Link>
            <span className="nav-current">{guideNavLabel[language]}</span>
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
        <section className="guide-hero container" dir={isRtl ? "rtl" : "ltr"}>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> {text.eyebrow}
          </div>
          <h1>
            {text.title}
            <br />
            <em>{text.titleEm}</em>
          </h1>
          {text.intro ? <p>{text.intro}</p> : null}
          <div className="guide-hero-meta">
            <BookOpen size={16} />
            <span>{String(text.sections.length).padStart(2, "0")} SECTIONS</span>
            <span className="guide-hero-sep">·</span>
            <span>BEGINNER + ADVANCED</span>
          </div>
        </section>

        <section className="guide-content container">
          <aside className="guide-aside" dir={isRtl ? "rtl" : "ltr"}>
            <span className="kicker">{text.onThisPage}</span>
            <div className="guide-toc">
              {text.sections.map((section, index) => (
                <a key={section.id} href={`#guide-${section.id}`}>
                  <span className="guide-toc-num">{sectionNumber(index)}</span>
                  <span className="guide-toc-title">{section.title}</span>
                  {section.tag ? <span className="guide-toc-tag">{section.tag}</span> : null}
                </a>
              ))}
            </div>
          </aside>

          <article className="guide-article" dir={isRtl ? "rtl" : "ltr"}>
            {text.sections.map((section, index) => {
              const mediaClass = [
                "guide-media",
                section.mediaSize === "thumb" ? "guide-media--thumb" : section.media ? "guide-media--panel" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <Fragment key={section.id}>
                  <section className="guide-block" id={`guide-${section.id}`}>
                    <div className="guide-block-head">
                      <span className="guide-number">{sectionNumber(index)}</span>
                      {section.tag ? <span className="guide-tag">{section.tag}</span> : null}
                    </div>
                    <div className="guide-block-body">
                      <div className={section.media ? "guide-block-main" : "guide-block-main guide-block-main--solo"}>
                        <div className="guide-copy">
                          <h2>{section.title}</h2>
                          {section.body.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                          {section.bullets?.length ? (
                            <ul className="guide-bullets">
                              {section.bullets.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        {section.media ? (
                          <figure className={mediaClass}>
                            <img src={mediaUrl(section.media)} alt="" loading="lazy" />
                          </figure>
                        ) : null}
                      </div>
                      <div className="guide-tips">
                        <div className="guide-tip guide-tip--beginner">
                          <span className="guide-tip-label">
                            <Sparkles size={14} /> {text.tipBeginner}
                          </span>
                          <p>{section.tipBeginner}</p>
                        </div>
                        <div className="guide-tip guide-tip--advanced">
                          <span className="guide-tip-label">{text.tipAdvanced}</span>
                          <p>{section.tipAdvanced}</p>
                        </div>
                      </div>
                    </div>
                  </section>
                  {index === demoIndex ? (
                    <GuideDemoVideo key={language} label={text.demoVideo} playerTitle={text.demoVideoTitle} />
                  ) : null}
                </Fragment>
              );
            })}
          </article>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <SiteLogo compact />
          <div className="footer-links">
            <Link href="/">{text.home}</Link>
            <a href="/#features">{text.features}</a>
            <Link href="/privacy">{text.privacy}</Link>
            <Link href="/terms">{text.terms}</Link>
            <span>{guideNavLabel[language]}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
