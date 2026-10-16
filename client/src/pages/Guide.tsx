import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, ChevronDown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { POSTER_LARGE, POSTER_VER } from "@/lib/posters";
import { fetchSiteContent } from "@/lib/siteContent";
import { exclusiveNavLabel } from "@/lib/exclusiveNav";
import { updatesNavLabel } from "@/lib/updatesCopy";

type GuideSection = {
  id: string;
  title: string;
  body: string[];
  media?: string;
  /** Extra screenshots after `media`, each in its own frame. */
  images?: string[];
  /** Optional alt per image path. Missing entries use the section title. */
  imageAlts?: Record<string, string>;
  /** Pixel size [width, height] per image path. Reserves the space so the page does not jump while images load. */
  imageSizes?: Record<string, [number, number]>;
};

/** A top-level topic. Subtopics sit in `sections`. Tips close the topic. */
type GuideGroup = GuideSection & {
  sections?: GuideSection[];
  tipsBeginner?: string[];
  tipAdvanced?: string;
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
  he: { onThisPage: "נושאים", screens: "נושאים", tipBeginner: "טיפים למתחילים", tipAdvanced: "למתקדמים", back: "חזרה לאתר", home: "דף הבית", privacy: "פרטיות", terms: "תנאי שימוש", features: "יכולות", architecture: "איך זה עובד" },
  en: { onThisPage: "Topics", screens: "Topics", tipBeginner: "Tips for beginners", tipAdvanced: "For advanced users", back: "Back to site", home: "Home", privacy: "Privacy", terms: "Terms", features: "Features", architecture: "How it works" },
  ru: { onThisPage: "Темы", screens: "Темы", tipBeginner: "Советы новичкам", tipAdvanced: "Для продвинутых", back: "Вернуться на сайт", home: "Главная", privacy: "Приватность", terms: "Условия", features: "Возможности", architecture: "Как это работает" },
  ar: { onThisPage: "المواضيع", screens: "المواضيع", tipBeginner: "نصائح للمبتدئين", tipAdvanced: "للمتقدمين", back: "العودة إلى الموقع", home: "الرئيسية", privacy: "الخصوصية", terms: "الشروط", features: "المزايا", architecture: "كيف يعمل" },
};

const emptyCopy = (language: Language): GuideCopy => ({
  title: language === "he" ? "מדריך למשתמש" : language === "ru" ? "Руководство" : language === "ar" ? "دليل المستخدم" : "User guide",
  titleEm: "L Studio.",
  eyebrow: "LEARN / USER GUIDE / L STUDIO",
  intro: language === "he"
    ? "בוחרים נושא מהתפריט. כל נושא נגמר בשלושה טיפים למתחילים ובטיפ אחד למתקדמים."
    : language === "ru"
      ? "Выберите тему в меню. В конце каждой темы три совета новичкам и один совет для продвинутых."
      : language === "ar"
        ? "اختر موضوعاً من القائمة. ينتهي كل موضوع بثلاث نصائح للمبتدئين ونصيحة واحدة للمتقدمين."
        : "Pick a topic from the menu. Every topic ends with three tips for beginners and one tip for advanced users.",
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

/** Approved store posters (assets/posters/{en,he}/...-w630.jpg) ship a webp twin and a fixed 630x1120 size. */
function isPoster(path: string) {
  return /^\/?assets\/posters\//.test(path);
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

/** Copy and screenshots of one topic or subtopic. */
function GuideBlock({ item }: { item: GuideSection }) {
  const shots = sectionShots(item);
  return (
    <div className={shots.length ? "guide-block-main" : "guide-block-main guide-block-main--solo"}>
      <div className="guide-copy">
        {(item.body ?? []).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {shots.length ? (
        <div className="guide-shots">
          {shots.map((src) => (
            <figure className="guide-media guide-media--panel" key={src}>
              {isPoster(src) ? (
                <picture>
                  <source type="image/webp" srcSet={`${mediaUrl(src.replace(/\.jpe?g$/i, ".webp"))}?v=${POSTER_VER}`} />
                  <img src={`${mediaUrl(src)}?v=${POSTER_VER}`} alt={item.imageAlts?.[src] || item.title} width={POSTER_LARGE.width} height={POSTER_LARGE.height} loading="lazy" decoding="async" />
                </picture>
              ) : (
                <img src={mediaUrl(src)} alt={item.imageAlts?.[src] || item.title} width={item.imageSizes?.[src]?.[0]} height={item.imageSizes?.[src]?.[1]} loading="lazy" decoding="async" />
              )}
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const NAV_OFFSET = 130;

/** Id of the topic and subtopic that are at the top of the viewport. */
function useActiveGuideIds(ready: boolean) {
  const [active, setActive] = useState<{ topic: string; sub: string }>({ topic: "", sub: "" });
  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let topic = "";
      let sub = "";
      document.querySelectorAll<HTMLElement>("[data-gtopic]").forEach((el) => {
        if (el.getBoundingClientRect().top <= NAV_OFFSET) topic = el.dataset.gtopic || "";
      });
      document.querySelectorAll<HTMLElement>(`[data-gsub-of="${topic}"]`).forEach((el) => {
        if (el.getBoundingClientRect().top <= NAV_OFFSET) sub = el.dataset.gsub || "";
      });
      if (!topic) topic = document.querySelector<HTMLElement>("[data-gtopic]")?.dataset.gtopic || "";
      setActive((prev) => (prev.topic === topic && prev.sub === sub ? prev : { topic, sub }));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ready]);
  return active;
}

export default function Guide() {
  const { language, isRtl } = useLanguage();
  const [text, setText] = useState<GuideCopy>(() => emptyCopy(language));
  const [menuOpen, setMenuOpen] = useState(false);
  const hashHandled = useRef(false);
  const ready = text.groups.length > 0;
  const active = useActiveGuideIds(ready);

  useEffect(() => {
    let cancelled = false;
    hashHandled.current = false;
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

  // The copy loads after the first paint, so a link such as /guide#guide-drum scrolls once it is in.
  useEffect(() => {
    if (!ready || hashHandled.current) return;
    hashHandled.current = true;
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, [ready]);

  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(`guide-${id}`);
    setMenuOpen(false);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#guide-${id}`);
  };

  const currentTopic = text.groups.find((group) => group.id === active.topic) ?? text.groups[0];

  return (
    <div className="site-shell guide-page">
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={guideNavLabel[language]}>
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
            <span>{String(text.groups.length).padStart(2, "0")} TOPICS</span>
            <span className="guide-hero-sep">·</span>
            <span>BEGINNER + ADVANCED</span>
          </div>
        </section>

        <section className="guide-content container">
          <aside className={menuOpen ? "guide-aside is-open" : "guide-aside"} dir={isRtl ? "rtl" : "ltr"}>
            <button type="button" className="gtoc-toggle" aria-expanded={menuOpen} aria-controls="guide-toc" onClick={() => setMenuOpen((open) => !open)}>
              <span className="gtoc-toggle-label">{text.screens}</span>
              <span className="gtoc-toggle-current">{currentTopic?.title}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            <nav className="gtoc" id="guide-toc" aria-label={text.screens}>
              <span className="kicker gtoc-kicker">{text.screens}</span>
              <ol className="gtoc-list">
                {text.groups.map((group, index) => {
                  const isActive = group.id === active.topic;
                  return (
                    <li key={group.id} className={isActive ? "gtoc-item is-active" : "gtoc-item"}>
                      <a className="gtoc-topic" href={`#guide-${group.id}`} aria-current={isActive ? "true" : undefined} onClick={(event) => goTo(event, group.id)}>
                        <span className="gtoc-num">{sectionNumber(index)}</span>
                        <span>{group.title}</span>
                      </a>
                      {isActive && group.sections?.length ? (
                        <ul className="gtoc-subs">
                          {group.sections.map((section) => (
                            <li key={section.id}>
                              <a className={section.id === active.sub ? "is-active" : undefined} href={`#guide-${section.id}`} onClick={(event) => goTo(event, section.id)}>
                                {section.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          <article className="guide-article" dir={isRtl ? "rtl" : "ltr"}>
            {text.groups.map((group, index) => (
              <section className="gtopic" id={`guide-${group.id}`} data-gtopic={group.id} key={group.id}>
                <header className="gtopic-head">
                  <span className="guide-number">{sectionNumber(index)}</span>
                  <h2>{group.title}</h2>
                </header>
                {group.body?.length || sectionShots(group).length ? <GuideBlock item={group} /> : null}
                {(group.sections ?? []).map((section) => (
                  <section className="gsub" id={`guide-${section.id}`} data-gsub={section.id} data-gsub-of={group.id} key={section.id}>
                    <h3>{section.title}</h3>
                    <GuideBlock item={section} />
                  </section>
                ))}
                {group.tipsBeginner?.length || group.tipAdvanced ? (
                  <div className="gtips">
                    {group.tipsBeginner?.length ? (
                      <div className="guide-tip guide-tip--beginner">
                        <span className="guide-tip-label">
                          <Sparkles size={14} /> {text.tipBeginner}
                        </span>
                        <ol className="gtips-list">
                          {group.tipsBeginner.map((tip) => (
                            <li key={tip}>{tip}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    {group.tipAdvanced ? (
                      <div className="guide-tip guide-tip--advanced">
                        <span className="guide-tip-label">{text.tipAdvanced}</span>
                        <p>{group.tipAdvanced}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ))}
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
