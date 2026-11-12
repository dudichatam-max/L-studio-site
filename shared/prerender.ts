/**
 * Static semantic HTML injected into the GitHub Pages HTML for crawlers
 * and curl (no JavaScript). React replaces #root on boot, so the visual
 * design of the app is unchanged.
 *
 * Official homepage feature copy is read from content.json (underHood.features
 * and underHood.identity) so the prerendered headings stay in sync with the
 * visible architecture section.
 *
 * Latin product names inside Hebrew and Arabic copy are wrapped in
 * <bdi dir="ltr"> at render time; the content strings stay plain.
 */
import type { Language, SeoPageId } from "./seo";
import { seoDocument } from "./seo";
import { bidiHtml, escapeHtml, shouldIsolateLatin } from "./bidi";

export { escapeHtml };

export type StyleGroup = { genre: string; styles: string[] };

export type FeatureBlock = {
  id: string;
  title: string;
  body: string;
  lead?: string;
  stylesLead?: string;
  styleGroups?: StyleGroup[];
  channels?: string;
  channelsLead?: string;
  channelNames?: string[];
  channelsNote?: string;
  packs?: string;
};

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

export function isStructuredDrums(
  block: FeatureBlock | undefined | null
): block is FeatureBlock & {
  lead: string;
  stylesLead: string;
  styleGroups: StyleGroup[];
  channels: string;
  channelsLead: string;
  channelNames: string[];
  channelsNote: string;
  packs: string;
} {
  return Boolean(
    block &&
      block.id === "drums" &&
      block.lead &&
      block.stylesLead &&
      Array.isArray(block.styleGroups) &&
      block.styleGroups.length === 4 &&
      block.styleGroups.every(
        group => group.genre && Array.isArray(group.styles) && group.styles.length === 4
      ) &&
      block.channels &&
      block.channelsLead &&
      Array.isArray(block.channelNames) &&
      block.channelNames.length === 8 &&
      block.channelsNote &&
      block.packs
  );
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
    if (id === "drums" && !isStructuredDrums(block)) {
      throw new Error(`Missing structured drums fields for ${language}`);
    }
    return {
      id,
      title: block.title,
      body: block.body,
      lead: block.lead,
      stylesLead: block.stylesLead,
      styleGroups: block.styleGroups,
      channels: block.channels,
      channelsLead: block.channelsLead,
      channelNames: block.channelNames,
      channelsNote: block.channelsNote,
      packs: block.packs,
    };
  });
}

function rtlMark(language: Language, text: string): string {
  return bidiHtml(text, shouldIsolateLatin(language));
}

function renderDrumsArticle(feature: FeatureBlock, language: Language): string {
  if (!isStructuredDrums(feature)) {
    throw new Error(`Cannot prerender unstructured drums for ${language}`);
  }
  const items = feature.styleGroups
    .map(group => {
      const styles = group.styles.join(", ");
      return `        <li>${rtlMark(language, group.genre)}: ${rtlMark(language, styles)}</li>`;
    })
    .join("\n");
  return [
    `      <article id="${escapeHtml(feature.id)}">`,
    `        <h2>${rtlMark(language, feature.title)}</h2>`,
    `        <p>${rtlMark(language, feature.lead)}</p>`,
    `        <h3>${rtlMark(language, feature.stylesLead)}</h3>`,
    `        <ul>`,
    items,
    `        </ul>`,
    `        <p>${rtlMark(language, feature.channelsLead)}</p>`,
    `        <ul>`,
    ...feature.channelNames.map(
      name => `          <li>${rtlMark(language, name)}</li>`
    ),
    `        </ul>`,
    `        <p>${rtlMark(language, feature.channelsNote)}</p>`,
    `        <p>${rtlMark(language, feature.packs)}</p>`,
    `      </article>`,
  ].join("\n");
}

function renderFeatureArticle(feature: FeatureBlock, language: Language): string {
  if (feature.id === "drums") return renderDrumsArticle(feature, language);
  return `      <article id="${escapeHtml(feature.id)}">\n        <h2>${rtlMark(language, feature.title)}</h2>\n        <p>${rtlMark(language, feature.body)}</p>\n      </article>`;
}

function renderHome(content: SiteContent, language: Language): string {
  const doc = seoDocument("/", language);
  const isolate = shouldIsolateLatin(language);
  const identity = langCopy(content, language).underHood?.identity ?? "";
  const features = homeFeatureBlocks(content, language);
  const articles = features
    .map(feature => renderFeatureArticle(feature, language))
    .join("\n");
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${escapeHtml(doc.title)}</h1>`,
    identity ? `      <p>${bidiHtml(identity, isolate)}</p>` : "",
    `      <p>${bidiHtml(doc.description, isolate)}</p>`,
    articles,
    `    </main>`,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderUpdates(content: SiteContent, language: Language): string {
  const doc = seoDocument("/updates/", language);
  const isolate = shouldIsolateLatin(language);
  const updates = langCopy(content, language).updates;
  const intro = updates?.pageIntro ?? doc.description;
  const items = (updates?.items ?? [])
    .filter(item => item.title)
    .map(item => `      <h2>${bidiHtml(item.title as string, isolate)}</h2>`)
    .join("\n");
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${bidiHtml(doc.title, isolate)}</h1>`,
    `      <p>${bidiHtml(intro, isolate)}</p>`,
    items,
    `    </main>`,
  ].join("\n");
}

function renderGuide(content: SiteContent, language: Language): string {
  const doc = seoDocument("/guide/", language);
  const isolate = shouldIsolateLatin(language);
  const groups = (langCopy(content, language).guide?.groups ?? [])
    .filter(group => group.title)
    .map(group => `      <h2>${bidiHtml(group.title as string, isolate)}</h2>`)
    .join("\n");
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${bidiHtml(doc.title, isolate)}</h1>`,
    `      <p>${bidiHtml(doc.description, isolate)}</p>`,
    groups,
    `    </main>`,
  ].join("\n");
}

function renderGeneric(pathname: string, language: Language): string {
  const doc = seoDocument(pathname, language);
  const isolate = shouldIsolateLatin(language);
  return [
    `    <main class="seo-prerender" hidden>`,
    `      <h1>${bidiHtml(doc.title, isolate)}</h1>`,
    `      <p>${bidiHtml(doc.description, isolate)}</p>`,
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
