import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { fetchSiteContent } from "@/lib/siteContent";
import { exclusiveNavLabel } from "@/lib/exclusiveNav";
import { updatesNavLabel } from "@/lib/updatesCopy";

type GuideSection = {
  id: string;
  tag?: string;
  title: string;
  body: string[];
  /** Render `body` as numbered steps. Older sections stay as paragraphs. */
  layout?: "steps";
  tipBeginner?: string;
  tipAdvanced?: string;
  media?: string;
  /** Extra screenshots after `media`, each in its own frame. */
  images?: string[];
  mediaSize?: "thumb" | "panel";
  bullets?: string[];
};

type GuideGroup = {
  id: string;
  title: string;
  body: string[];
  media?: string;
  images?: string[];
  mediaSize?: "thumb" | "panel";
  sections?: GuideSection[];
};

type GuideCopy = {
  title: string;
  titleEm: string;
  eyebrow: string;
  intro: string;
  onThisPage: string;
  screens: string;
  tipBeginner: string;
  tipAdvanced: string;
  back: string;
  home: string;
  privacy: string;
  terms: string;
  features: string;
  architecture: string;
  groups: GuideGroup[];
};

const chrome: Record<Language, Omit<GuideCopy, "groups" | "intro" | "title" | "titleEm" | "eyebrow">> = {
  he: { onThisPage: "בעמוד הזה", screens: "מסכים", tipBeginner: "טיפ למתחילים", tipAdvanced: "טיפ למתקדמים", back: "חזרה לאתר", home: "דף הבית", privacy: "פרטיות", terms: "תנאי שימוש", features: "יכולות", architecture: "איך זה עובד" },
  en: { onThisPage: "On this page", screens: "Screens", tipBeginner: "Beginner tip", tipAdvanced: "Advanced tip", back: "Back to site", home: "Home", privacy: "Privacy", terms: "Terms", features: "Features", architecture: "How it works" },
  ru: { onThisPage: "На этой странице", screens: "Экраны", tipBeginner: "Совет новичкам", tipAdvanced: "Совет продвинутым", back: "Вернуться на сайт", home: "Главная", privacy: "Приватность", terms: "Условия", features: "Возможности", architecture: "Как это работает" },
  ar: { onThisPage: "في هذه الصفحة", screens: "الشاشات", tipBeginner: "نصيحة للمبتدئين", tipAdvanced: "نصيحة للمتقدمين", back: "العودة إلى الموقع", home: "الرئيسية", privacy: "الخصوصية", terms: "الشروط", features: "المزايا", architecture: "كيف يعمل" },
};

const emptyCopy = (language: Language): GuideCopy => ({
  title: language === "he" ? "מדריך למשתמש" : language === "ru" ? "Руководство" : language === "ar" ? "دليل المستخدم" : "User guide",
  titleEm: "L Studio.",
  eyebrow: "LEARN / USER GUIDE / L STUDIO",
  intro: language === "he"
    ? "חמישה מסכים: Sound, Pad, Drum, Loop, ו-Mic. הקשה על שם המסך פותחת אותו. הטקסט אומר מה עושה הקשה, גרירה, או לחיצה ארוכה."
    : language === "ru"
      ? "Пять экранов: Sound, Pad, Drum, Loop и Mic. Нажатие на имя экрана открывает его. Текст говорит, что делает нажатие, перетаскивание или долгое нажатие."
      : language === "ar"
        ? "خمس شاشات: Sound وPad وDrum وLoop وMic. الضغط على اسم الشاشة يفتحها. النص يقول ماذا يفعل الضغط أو السحب أو الضغط المطوّل."
        : "Five screens: Sound, Pad, Drum, Loop, and Mic. A tap on a screen name opens it. The text says what a tap, a drag, or a long-press does.",
  ...chrome[language],
  groups: [],
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

function sectionShots(section: { media?: string; images?: string[] }) {
  const shots: string[] = [];
  if (section.media) shots.push(section.media);
  for (const extra of section.images ?? []) {
    if (extra && !shots.includes(extra)) shots.push(extra);
  }
  return shots;
}

function guideEntries(groups: GuideGroup[]) {
  const entries: Array<{ id: string; title: string; body: string[]; media?: string; images?: string[]; mediaSize?: "thumb" | "panel"; layout?: "steps"; bullets?: string[]; tipBeginner?: string; tipAdvanced?: string; tag?: string; nested: boolean }> = [];
  for (const group of groups) {
    entries.push({ ...group, nested: false });
    for (const section of group.sections ?? []) {
      entries.push({ ...section, nested: true });
    }
  }
  return entries;
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
        setText({ ...emptyCopy(language), ...guide, groups: guide.groups ?? [] });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [language]);

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
            <Link href="/updates">{updatesNavLabel[language]}</Link>
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
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
            <span>{String(guideEntries(text.groups).length).padStart(2, "0")} SECTIONS</span>
            <span className="guide-hero-sep">·</span>
            <span>BEGINNER + ADVANCED</span>
          </div>
        </section>

        <section className="guide-content container">
          <aside className="guide-aside" dir={isRtl ? "rtl" : "ltr"}>
            <span className="kicker">{text.screens}</span>
            <div className="guide-toc">
              {text.groups.map((group) => (
                <div className="guide-toc-group" key={group.id}>
                  <a className="guide-toc-screen" href={`#guide-${group.id}`}>{group.title}</a>
                  <div className="guide-toc-sub">
                    {(group.sections ?? []).map((section) => (
                      <a key={section.id} href={`#guide-${section.id}`}>
                        <span className="guide-toc-title">{section.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <article className="guide-article" dir={isRtl ? "rtl" : "ltr"}>
            {guideEntries(text.groups).map((section, index) => {
              const shots = sectionShots(section);
              const mediaClass = [
                "guide-media",
                section.mediaSize === "thumb" ? "guide-media--thumb" : shots.length ? "guide-media--panel" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const paragraphs = section.body ?? [];
              const showTips = Boolean(section.tipBeginner || section.tipAdvanced);

              return (
                <section className={section.nested ? "guide-block guide-block--sub" : "guide-block"} id={`guide-${section.id}`} key={section.id}>
                    <div className="guide-block-head">
                      <span className="guide-number">{sectionNumber(index)}</span>
                      {section.tag ? <span className="guide-tag">{section.tag}</span> : null}
                    </div>
                    <div className="guide-block-body">
                      <div className={shots.length ? "guide-block-main" : "guide-block-main guide-block-main--solo"}>
                        <div className="guide-copy">
                          <h2>{section.title}</h2>
                          {section.layout === "steps" ? (
                            <ol className="guide-steps">
                              {paragraphs.map((step, stepIndex) => (
                                <li key={`${section.id}-${stepIndex}`}>{step}</li>
                              ))}
                            </ol>
                          ) : (
                            paragraphs.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))
                          )}
                          {section.bullets?.length ? (
                            <ul className="guide-bullets">
                              {section.bullets.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        {shots.length ? (
                          <div className="guide-shots">
                            {shots.map((src) => (
                              <figure className={mediaClass} key={src}>
                                <img src={mediaUrl(src)} alt={section.title} loading="lazy" />
                              </figure>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {showTips ? (
                        <div className="guide-tips">
                          {section.tipBeginner ? (
                            <div className="guide-tip guide-tip--beginner">
                              <span className="guide-tip-label">
                                <Sparkles size={14} /> {text.tipBeginner}
                              </span>
                              <p>{section.tipBeginner}</p>
                            </div>
                          ) : null}
                          {section.tipAdvanced ? (
                            <div className="guide-tip guide-tip--advanced">
                              <span className="guide-tip-label">{text.tipAdvanced}</span>
                              <p>{section.tipAdvanced}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                </section>
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
            <Link href="/updates">{updatesNavLabel[language]}</Link>
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
            <span>{guideNavLabel[language]}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
