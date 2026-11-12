/**
 * Static semantic HTML injected into the GitHub Pages HTML for crawlers
 * and curl (no JavaScript). React replaces #root on boot, so the visual
 * design of the app is unchanged.
 *
 * Official homepage feature copy is read from content.json (underHood.features
 * and underHood.identity) so the prerendered headings stay in sync with the
 * visible architecture section.
 */
import type { Language, SeoPageId } from "./seo";
import { seoDocument } from "./seo";

type FeatureBlock = { id: string; title: string; body: string };

type LangCopy = {
  underHood?: { identity?: string; features?: FeatureBlock[] };
  updates?: { pageIntro?: string; items?: Array<{ title?: string }> };
  guide?: { groups?: Array<{ title?: string }> };
};

export type SiteContent = {
  languages?: Partial<Record<Language, LangCopy>>;
};

const REQUIRED_HOME_HEADING_IDS = [
  "free-tuning",
  "sound-design",
  "sound-fx",
  "looper",
  "drums",
  "mic-studio",
  "performance-pad",
  "analog-mixer",
  "mastering",
] as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function langCopy(content: SiteContent, language: Language): LangCopy {
  return content.languages?.[language] ?? {};
}

export function homeFeatureBlocks(
  content: SiteContent,
  language: Language
): FeatureBlock[] {
  const features = langCopy(content, language).underHood?.features ?? [];
  return REQUIRED_HOME_HEADING_IDS.map(id => {
    const block = features.find(item => item.id === id);
    if (!block?.title || !block.body) {
      throw new Error(`Missing underHood.features[${id}] for ${language}`);
    }
    return { id, title: block.title, body: block.body };
  });
}

function renderHome(content: SiteContent, language: Language): string {
  const doc = seoDocument("/", language);
  const identity = langCopy(content, language).underHood?.identity ?? "";
  const features = homeFeatureBlocks(content, language);
  const articles = features
    .map(
      feature =>
        `      <article id="${escapeHtml(feature.id)}">\n        <h2>${escapeHtml(feature.title)}</h2>\n        <p>${escapeHtml(feature.body)}</p>\n      </article>`
    )
    .join("\n");
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${escapeHtml(doc.title)}</h1>`,
    identity ? `      <p>${escapeHtml(identity)}</p>` : "",
    `      <p>${escapeHtml(doc.description)}</p>`,
    articles,
    `    </main>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderUpdates(content: SiteContent, language: Language): string {
  const doc = seoDocument("/updates/", language);
  const updates = langCopy(content, language).updates;
  const intro = updates?.pageIntro ?? doc.description;
  const items = (updates?.items ?? [])
    .filter(item => item.title)
    .map(item => `      <h2>${escapeHtml(item.title as string)}</h2>`)
    .join("\n");
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${escapeHtml(doc.title)}</h1>`,
    `      <p>${escapeHtml(intro)}</p>`,
    items,
    `    </main>`,
  ].join("\n");
}

function renderGuide(content: SiteContent, language: Language): string {
  const doc = seoDocument("/guide/", language);
  const groups = (langCopy(content, language).guide?.groups ?? [])
    .filter(group => group.title)
    .map(group => `      <h2>${escapeHtml(group.title as string)}</h2>`)
    .join("\n");
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${escapeHtml(doc.title)}</h1>`,
    `      <p>${escapeHtml(doc.description)}</p>`,
    groups,
    `    </main>`,
  ].join("\n");
}

function renderGeneric(pathname: string, language: Language): string {
  const doc = seoDocument(pathname, language);
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${escapeHtml(doc.title)}</h1>`,
    `      <p>${escapeHtml(doc.description)}</p>`,
    `    </main>`,
  ].join("\n");
}

/** Semantic snapshot for a public page, or null when the page is not prerendered. */
export function renderPrerenderInner(
  pageId: SeoPageId,
  pathname: string,
  language: Language,
  content: SiteContent
): string | null {
  if (pageId === "home") return renderHome(content, language);
  if (pageId === "updates") return renderUpdates(content, language);
  if (pageId === "guide") return renderGuide(content, language);
  if (pageId === "not-found" || pageId === "buy" || pageId === "buy-success") {
    return null;
  }
  return renderGeneric(pathname, language);
}

/**
 * Puts a hidden semantic snapshot inside #root. Crawlers and curl see the
 * headings; React's createRoot replaces #root, so the designed UI is unchanged.
 */
export function injectPrerender(
  html: string,
  pageId: SeoPageId,
  pathname: string,
  language: Language,
  content: SiteContent
): string {
  const inner = renderPrerenderInner(pageId, pathname, language, content);
  if (!inner) return html;
  const wrapped = `<div id="root">\n${inner}\n  </div>`;
  if (!html.includes('<div id="root"></div>')) {
    throw new Error("index.html is missing an empty #root for prerender injection");
  }
  return html.replace('<div id="root"></div>', wrapped);
}
