/**
 * Google-facing document metadata for the public site.
 * Visible page copy stays in the React pages. This module only builds
 * titles, descriptions, canonical URLs, hreflang, and JSON-LD.
 */

export const SITE_ORIGIN = "https://l-studio.studio";

export const LANGUAGES = ["en", "he", "ru", "ar"] as const;
export type Language = (typeof LANGUAGES)[number];

export type SeoPageId =
  | "home"
  | "privacy"
  | "terms"
  | "guide"
  | "buy"
  | "buy-success"
  | "factory-64"
  | "factory-drums"
  | "exclusive"
  | "updates"
  | "not-found";

type SeoCopy = {
  title: string;
  description: string;
  /** Social description when it already differs from the document description. */
  socialDescription?: string;
};

const OG_LOCALE: Record<Language, string> = {
  en: "en_US",
  he: "he_IL",
  ru: "ru_RU",
  ar: "ar_SA",
};

/** Public path that returns HTTP 200 on GitHub Pages (directory indexes use a trailing slash). */
const CANONICAL_PATH: Record<Exclude<SeoPageId, "not-found">, string> = {
  home: "/",
  privacy: "/privacy/",
  terms: "/terms/",
  guide: "/guide/",
  buy: "/buy/",
  "buy-success": "/buy/success/",
  "factory-64": "/factory-64/",
  "factory-drums": "/factory-64/drums/",
  exclusive: "/exclusive/",
  updates: "/updates/",
};

const COPY: Record<SeoPageId, Record<Language, SeoCopy>> = {
  home: {
    en: {
      title: "L Studio: Microtonal Music Workstation",
      description:
        "L Studio: microtonal music workstation for Android. Real-time creation, local audio, SOUND / LOOP / DRUM / MIC.",
      socialDescription:
        "Real-time microtonal music creation for Android. Local audio, SOUND / LOOP / DRUM / MIC.",
    },
    he: {
      title: "L Studio: תחנת עבודה מוזיקלית מיקרוטונלית",
      description:
        "L Studio: תחנת עבודה מוזיקלית מיקרוטונלית לאנדרואיד. יצירה בזמן אמת, אודיו מקומי, SOUND / LOOP / DRUM / MIC.",
    },
    ru: {
      title: "L Studio: микротональная музыкальная рабочая станция",
      description:
        "L Studio: микротональная музыкальная рабочая станция для Android. Создание в реальном времени, локальное аудио, SOUND / LOOP / DRUM / MIC.",
    },
    ar: {
      title: "L Studio: محطة عمل موسيقية ميكروتونية",
      description:
        "L Studio: محطة عمل موسيقية ميكروتونية لأندرويد. إنشاء في الوقت الفعلي، صوت محلي، SOUND / LOOP / DRUM / MIC.",
    },
  },
  privacy: {
    en: {
      title: "Privacy | L Studio",
      description:
        "How L Studio on Android treats permissions, audio, and information created while you make music.",
    },
    he: {
      title: "פרטיות | L Studio",
      description:
        "איך L Studio באנדרואיד מתייחסת להרשאות, לאודיו ולמידע שנוצר בזמן היצירה.",
    },
    ru: {
      title: "Конфиденциальность | L Studio",
      description:
        "Как L Studio на Android относится к разрешениям, аудио и данным, которые появляются во время создания музыки.",
    },
    ar: {
      title: "الخصوصية | L Studio",
      description:
        "كيف تتعامل L Studio على أندرويد مع الأذونات والصوت والمعلومات التي تُنشأ أثناء صناعة الموسيقى.",
    },
  },
  terms: {
    en: {
      title: "Terms of use | L Studio",
      description: "Terms for using the L Studio Android app and this website.",
    },
    he: {
      title: "תנאי שימוש | L Studio",
      description: "תנאי השימוש באפליקציית L Studio לאנדרואיד ובאתר הזה.",
    },
    ru: {
      title: "Условия использования | L Studio",
      description:
        "Условия использования приложения L Studio для Android и этого сайта.",
    },
    ar: {
      title: "شروط الاستخدام | L Studio",
      description: "شروط استخدام تطبيق L Studio لأندرويد وهذا الموقع.",
    },
  },
  guide: {
    en: {
      title: "User guide | L Studio",
      description:
        "User guide for L Studio on Android: SOUND, LOOP, DRUM, and MIC.",
    },
    he: {
      title: "מדריך למשתמש | L Studio",
      description:
        "מדריך למשתמש של L Studio באנדרואיד: SOUND, LOOP, DRUM ו-MIC.",
    },
    ru: {
      title: "Руководство | L Studio",
      description:
        "Руководство по L Studio на Android: SOUND, LOOP, DRUM и MIC.",
    },
    ar: {
      title: "دليل المستخدم | L Studio",
      description: "دليل مستخدم L Studio على أندرويد: SOUND وLOOP وDRUM وMIC.",
    },
  },
  "factory-64": {
    en: {
      title: "Factory Pack | L Studio",
      description:
        "Eight preset pages and sixty-four voices in the L Studio Factory Pack for Android.",
    },
    he: {
      title: "Factory Pack | L Studio",
      description:
        "שמונה עמודי פריסטים ושישים וארבעה קולות ב-Factory Pack של L Studio לאנדרואיד.",
    },
    ru: {
      title: "Factory Pack | L Studio",
      description:
        "Восемь страниц пресетов и шестьдесят четыре голоса в Factory Pack L Studio для Android.",
    },
    ar: {
      title: "Factory Pack | L Studio",
      description:
        "ثماني صفحات إعدادات وأربعة وستون صوتاً في Factory Pack من L Studio لأندرويد.",
    },
  },
  "factory-drums": {
    en: {
      title: "Drum kits | L Studio",
      description:
        "Eight Factory drum kits for L Studio on Android, with eight styles in each kit.",
    },
    he: {
      title: "ערכות תופים | L Studio",
      description:
        "שמונה ערכות תופים של Factory ל-L Studio באנדרואיד, עם שמונה סגנונות בכל ערכה.",
    },
    ru: {
      title: "Барабаны | L Studio",
      description:
        "Восемь ударных наборов Factory для L Studio на Android, по восемь стилей в каждом.",
    },
    ar: {
      title: "حزم الطبول | L Studio",
      description:
        "ثماني حزم طبول Factory لـ L Studio على أندرويد، مع ثمانية أساليب في كل حزمة.",
    },
  },
  exclusive: {
    en: {
      title: "Exclusive | L Studio",
      description:
        "Eleven Exclusive drum packs for L Studio, outside the Factory Drums set. Included with Pro at no extra cost.",
    },
    he: {
      title: "בלעדי | L Studio",
      description:
        "אחת עשרה חבילות תופים בלעדיות ל-L Studio, מחוץ לערכות Factory Drums. כלולות ב-Pro בלי עלות נוספת.",
    },
    ru: {
      title: "Эксклюзив | L Studio",
      description:
        "Одиннадцать эксклюзивных ударных паков L Studio вне набора Factory Drums. Входят в Pro без доплаты.",
    },
    ar: {
      title: "حصري | L Studio",
      description:
        "إحدى عشرة حزمة طبول حصرية لـ L Studio خارج مجموعة Factory Drums. مضمّنة مع Pro بلا تكلفة إضافية.",
    },
  },
  updates: {
    en: {
      title: "Updates | L Studio",
      description:
        "What's new in L Studio for Android. Version 1.08 is in the Google Play test now. L Studio Pro comes to Google Play in October 2026, for $8.",
    },
    he: {
      title: "עדכונים | L Studio",
      description: "מה חדש ב-L Studio לאנדרואיד. גרסה 1.08 בבדיקה ב-Google Play עכשיו. L Studio Pro מגיע ל-Google Play באוקטובר 2026, ב-8$.",
    },
    ru: {
      title: "Обновления | L Studio",
      description:
        "Что нового в L Studio для Android. Версия 1.08 сейчас в тесте Google Play. L Studio Pro выйдет в Google Play в октябре 2026, за $8.",
    },
    ar: {
      title: "التحديثات | L Studio",
      description: "ما الجديد في L Studio لأندرويد. الإصدار 1.08 في اختبار Google Play الآن. يصل L Studio Pro إلى Google Play في أكتوبر 2026، بسعر 8$.",
    },
  },
  buy: {
    en: {
      title: "L Studio Pro",
      description:
        "L Studio Pro for Android comes to Google Play in October 2026, for $8. Purchases are not available on this website right now.",
    },
    he: {
      title: "L Studio Pro",
      description: "L Studio Pro לאנדרואיד מגיע ל-Google Play באוקטובר 2026, ב-8$. רכישה באתר אינה זמינה כרגע.",
    },
    ru: {
      title: "L Studio Pro",
      description:
        "L Studio Pro для Android выйдет в Google Play в октябре 2026, за $8. Покупка на этом сайте сейчас недоступна.",
    },
    ar: {
      title: "L Studio Pro",
      description:
        "L Studio Pro لأندرويد يصل إلى Google Play في أكتوبر 2026، بسعر 8$. الشراء غير متاح على هذا الموقع حالياً.",
    },
  },
  "buy-success": {
    en: {
      title: "Download | L Studio Pro",
      description: "Download page after a confirmed L Studio Pro purchase.",
    },
    he: {
      title: "הורדה | L Studio Pro",
      description: "עמוד הורדה אחרי רכישה מאושרת של L Studio Pro.",
    },
    ru: {
      title: "Загрузка | L Studio Pro",
      description:
        "Страница загрузки после подтверждённой покупки L Studio Pro.",
    },
    ar: {
      title: "التنزيل | L Studio Pro",
      description: "صفحة التنزيل بعد عملية شراء مؤكدة لـ L Studio Pro.",
    },
  },
  "not-found": {
    en: {
      title: "Page not found | L Studio",
      description: "This page is not on the L Studio site.",
    },
    he: {
      title: "העמוד לא נמצא | L Studio",
      description: "העמוד הזה לא קיים באתר L Studio.",
    },
    ru: {
      title: "Страница не найдена | L Studio",
      description: "Этой страницы нет на сайте L Studio.",
    },
    ar: {
      title: "الصفحة غير موجودة | L Studio",
      description: "هذه الصفحة غير موجودة في موقع L Studio.",
    },
  },
};

export type SeoAlternate = { hreflang: string; href: string };

export type SeoDocument = {
  pageId: SeoPageId;
  language: Language;
  title: string;
  description: string;
  socialDescription: string;
  canonical: string;
  robots: string;
  htmlLang: Language;
  dir: "rtl" | "ltr";
  ogLocale: string;
  ogLocaleAlternates: string[];
  alternates: SeoAlternate[];
  jsonLd: SeoJsonLd;
};

type SeoJsonLd = {
  "@context": "https://schema.org";
  "@graph": [SeoWebSite, SeoSoftwareApplication];
};

type SeoWebSite = {
  "@type": "WebSite";
  "@id": string;
  name: "L Studio";
  url: string;
  inLanguage: Language;
  description: string;
};

type SeoSoftwareApplication = {
  "@type": "SoftwareApplication";
  "@id": string;
  name: "L Studio";
  operatingSystem: "Android";
  applicationCategory: "MusicApplication";
  url: string;
  inLanguage: Language;
  description: string;
  author: { "@type": "Person"; name: "David Chatam" };
};

export const SITEMAP_PAGES: Array<{
  id: Exclude<SeoPageId, "not-found" | "buy-success">;
  changefreq: "weekly" | "monthly";
  priority: "1.0" | "0.8" | "0.7" | "0.6";
}> = [
  { id: "home", changefreq: "weekly", priority: "1.0" },
  { id: "privacy", changefreq: "monthly", priority: "0.6" },
  { id: "terms", changefreq: "monthly", priority: "0.6" },
  { id: "updates", changefreq: "weekly", priority: "0.7" },
  { id: "guide", changefreq: "monthly", priority: "0.7" },
  { id: "factory-64", changefreq: "monthly", priority: "0.8" },
  { id: "buy", changefreq: "monthly", priority: "0.7" },
  { id: "factory-drums", changefreq: "monthly", priority: "0.8" },
  { id: "exclusive", changefreq: "monthly", priority: "0.7" },
];

export function isLanguage(
  value: string | null | undefined
): value is Language {
  return value === "en" || value === "he" || value === "ru" || value === "ar";
}

export function languageFromSearch(search: string): Language | null {
  const query = search.includes("?")
    ? search.slice(search.indexOf("?") + 1)
    : search.replace(/^\?/, "");
  const value = new URLSearchParams(query.split("#")[0]).get("lang");
  return isLanguage(value) ? value : null;
}

export function normalizePathname(pathname: string): string {
  let path = pathname.split("?")[0]?.split("#")[0] || "/";
  if (path.startsWith("/L-studio-site")) {
    path = path.slice("/L-studio-site".length) || "/";
  }
  if (!path.startsWith("/")) path = `/${path}`;
  return path;
}

function knownPath(pathname: string): string {
  const path = normalizePathname(pathname);
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function pageIdFromPath(pathname: string): SeoPageId {
  switch (knownPath(pathname)) {
    case "":
    case "/":
      return "home";
    case "/privacy":
      return "privacy";
    case "/terms":
      return "terms";
    case "/guide":
      return "guide";
    case "/buy":
      return "buy";
    case "/buy/success":
      return "buy-success";
    case "/factory-64":
      return "factory-64";
    case "/factory-64/drums":
      return "factory-drums";
    case "/exclusive":
      return "exclusive";
    case "/updates":
      return "updates";
    case "/404":
      return "not-found";
    default:
      return "not-found";
  }
}

function safeRequestPath(pathname: string): string {
  const path = normalizePathname(pathname);
  if (path === "/") return "/";
  if (path.includes("//")) return "/404";
  if (!/^\/(?:[A-Za-z0-9_\-.]+\/?)*$/.test(path)) return "/404";
  return path;
}

function canonicalBase(pageId: SeoPageId, requestedPath: string): string {
  if (pageId === "not-found") {
    const path = safeRequestPath(requestedPath);
    return `${SITE_ORIGIN}${path === "/" ? "/404" : path}`;
  }
  return `${SITE_ORIGIN}${CANONICAL_PATH[pageId]}`;
}

export function canonicalUrl(
  pageId: SeoPageId,
  language: Language,
  requestedPath = "/"
): string {
  const base = canonicalBase(pageId, requestedPath);
  if (language === "en") return base;
  return `${base}?lang=${language}`;
}

function alternatesFor(
  pageId: SeoPageId,
  requestedPath: string
): SeoAlternate[] {
  const en = canonicalUrl(pageId, "en", requestedPath);
  return [
    { hreflang: "en", href: en },
    { hreflang: "he", href: canonicalUrl(pageId, "he", requestedPath) },
    { hreflang: "ru", href: canonicalUrl(pageId, "ru", requestedPath) },
    { hreflang: "ar", href: canonicalUrl(pageId, "ar", requestedPath) },
    { hreflang: "x-default", href: en },
  ];
}

function appDescription(language: Language): string {
  return COPY.home[language].description;
}

export function buildJsonLd(language: Language): SeoJsonLd {
  const description = appDescription(language);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_ORIGIN}/#website`,
        name: "L Studio",
        url: `${SITE_ORIGIN}/`,
        inLanguage: language,
        description,
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_ORIGIN}/#app`,
        name: "L Studio",
        operatingSystem: "Android",
        applicationCategory: "MusicApplication",
        url: `${SITE_ORIGIN}/`,
        inLanguage: language,
        description,
        author: {
          "@type": "Person",
          name: "David Chatam",
        },
      },
    ],
  };
}

export function seoDocument(pathname: string, language: Language): SeoDocument {
  const pageId = pageIdFromPath(pathname);
  const copy = COPY[pageId][language];
  const indexable = pageId !== "not-found" && pageId !== "buy-success";
  return {
    pageId,
    language,
    title: copy.title,
    description: copy.description,
    socialDescription: copy.socialDescription ?? copy.description,
    canonical: canonicalUrl(pageId, language, pathname),
    robots: indexable ? "index, follow" : "noindex, follow",
    htmlLang: language,
    dir: language === "he" || language === "ar" ? "rtl" : "ltr",
    ogLocale: OG_LOCALE[language],
    ogLocaleAlternates: LANGUAGES.filter(item => item !== language).map(
      item => OG_LOCALE[item]
    ),
    alternates: alternatesFor(pageId, pathname),
    jsonLd: buildJsonLd(language),
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderSeoTags(doc: SeoDocument): string {
  const json = JSON.stringify(doc.jsonLd).replace(/</g, "\\u003c");
  const lines = [
    `<title>${escapeHtml(doc.title)}</title>`,
    `<meta name="description" content="${escapeHtml(doc.description)}" />`,
    `<meta name="robots" content="${doc.robots}" />`,
    `<link rel="canonical" href="${doc.canonical}" />`,
    ...doc.alternates.map(
      alt =>
        `<link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`
    ),
    `<meta property="og:locale" content="${doc.ogLocale}" />`,
    ...doc.ogLocaleAlternates.map(
      locale => `<meta property="og:locale:alternate" content="${locale}" />`
    ),
    `<meta property="og:url" content="${doc.canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(doc.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(doc.socialDescription)}" />`,
    `<meta name="twitter:title" content="${escapeHtml(doc.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(doc.socialDescription)}" />`,
    `<script type="application/ld+json" id="l-studio-jsonld">${json}</script>`,
  ];
  return lines.map(line => `    ${line}`).join("\n");
}

const SEO_BLOCK =
  /[ \t]*<!-- l-studio-seo:start -->[\s\S]*?<!-- l-studio-seo:end -->/;

export function applySeoToHtml(html: string, doc: SeoDocument): string {
  if (!SEO_BLOCK.test(html)) {
    throw new Error("index.html is missing l-studio-seo markers");
  }
  const block = `    <!-- l-studio-seo:start -->\n${renderSeoTags(doc)}\n    <!-- l-studio-seo:end -->`;
  const withBlock = html.replace(SEO_BLOCK, block);
  return withBlock.replace(
    /<html\s+lang="[^"]*"\s+dir="[^"]*"/,
    `<html lang="${doc.htmlLang}" dir="${doc.dir}"`
  );
}

export function renderSitemapXml(): string {
  const urls = SITEMAP_PAGES.map(page => {
    const doc = seoDocument(CANONICAL_PATH[page.id], "en");
    const links = doc.alternates
      .map(
        alt =>
          `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`
      )
      .join("\n");
    return [
      "  <url>",
      `    <loc>${doc.canonical}</loc>`,
      links,
      `    <changefreq>${page.changefreq}</changefreq>`,
      `    <priority>${page.priority}</priority>`,
      "  </url>",
    ].join("\n");
  }).join("\n");
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

export function syncLanguageSearch(language: Language): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (language === "en") url.searchParams.delete("lang");
  else url.searchParams.set("lang", language);
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}
