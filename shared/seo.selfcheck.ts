/**
 * Checks Google document metadata: four languages, public URLs, and the sitemap.
 * Run: pnpm check:seo
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LANGUAGES,
  SITEMAP_PAGES,
  applySeoToHtml,
  buildJsonLd,
  pageIdFromPath,
  renderSitemapXml,
  seoDocument,
  type Language,
  type SeoPageId,
} from "./seo";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

const pages: SeoPageId[] = [
  "home",
  "privacy",
  "terms",
  "guide",
  "buy",
  "buy-success",
  "factory-64",
  "factory-drums",
  "exclusive",
  "updates",
  "not-found",
];

const paths: Record<SeoPageId, string> = {
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
  "not-found": "/404",
};

for (const page of pages) {
  assert(
    pageIdFromPath(paths[page]) === page,
    `${paths[page]} resolves to ${page}`
  );
  assert(
    pageIdFromPath(paths[page].replace(/\/$/, "") || "/") === page,
    `${page} matches without a trailing slash`
  );
  const seen = new Set<string>();
  for (const language of LANGUAGES) {
    const doc = seoDocument(paths[page], language);
    assert(doc.title.trim().length > 0, `${page}/${language} title`);
    assert(
      doc.description.trim().length > 0,
      `${page}/${language} description`
    );
    assert(
      !doc.title.includes("—") && !doc.description.includes("—"),
      `${page}/${language} has an em dash`
    );
    assert(
      !doc.title.includes("–") && !doc.description.includes("–"),
      `${page}/${language} has an en dash`
    );
    assert(
      !/daw/i.test(doc.title) && !/daw/i.test(doc.description),
      `${page}/${language} calls the product a DAW`
    );
    assert(
      doc.jsonLd["@graph"][1].applicationCategory === "MusicApplication",
      "applicationCategory"
    );
    assert(
      doc.jsonLd["@graph"][1].operatingSystem === "Android",
      "operatingSystem"
    );
    assert(doc.jsonLd["@graph"][1].name === "L Studio", "app name");
    assert(
      !JSON.stringify(doc.jsonLd).includes("offers"),
      `${page}/${language} invents an offer`
    );
    assert(
      !JSON.stringify(doc.jsonLd).includes("price"),
      `${page}/${language} invents a price`
    );
    seen.add(doc.description);
    const hreflang = doc.alternates.map(item => item.hreflang).join(",");
    assert(
      hreflang === "en,he,ru,ar,x-default",
      `${page}/${language} hreflang set`
    );
    if (language === "en") {
      assert(
        !doc.canonical.includes("lang="),
        `${page} English canonical has no lang query`
      );
    } else {
      assert(
        doc.canonical.endsWith(`?lang=${language}`),
        `${page}/${language} canonical`
      );
    }
    if (page === "not-found" || page === "buy-success") {
      assert(doc.robots === "noindex, follow", `${page} robots`);
    } else {
      assert(doc.robots === "index, follow", `${page} robots`);
    }
  }
  assert(
    seen.size === LANGUAGES.length,
    `${page} descriptions are distinct per language`
  );
}

assert(
  seoDocument("/", "en").canonical === "https://l-studio.studio/",
  "home canonical"
);
assert(
  seoDocument("/guide", "he").canonical ===
    "https://l-studio.studio/guide/?lang=he",
  "guide Hebrew canonical"
);
assert(
  seoDocument("/exclusive/", "en").canonical ===
    "https://l-studio.studio/exclusive/",
  "exclusive canonical"
);
assert(
  seoDocument("/nope", "en").robots === "noindex, follow",
  "unknown path noindex"
);
assert(
  seoDocument("/nope", "en").canonical === "https://l-studio.studio/nope",
  "unknown path self canonical"
);
assert(
  pageIdFromPath("/L-studio-site/guide/") === "guide",
  "project pages base"
);

const homeEn = buildJsonLd("en");
const homeHe = buildJsonLd("he");
assert(homeEn["@graph"][0]["@type"] === "WebSite", "WebSite node");
assert(
  homeEn["@graph"][1]["@type"] === "SoftwareApplication",
  "SoftwareApplication node"
);
assert(homeHe["@graph"][0].inLanguage === "he", "Hebrew inLanguage");
assert(
  homeEn["@graph"][0].description !== homeHe["@graph"][0].description,
  "JSON-LD description changes with language"
);

const indexHtml = readFileSync(join(root, "client/index.html"), "utf8");
const homeDoc = seoDocument("/", "en");
const applied = applySeoToHtml(indexHtml, homeDoc);
assert(
  applied === indexHtml,
  "client/index.html already matches the English homepage head"
);
const guideHtml = applySeoToHtml(indexHtml, seoDocument("/guide/", "en"));
assert(
  guideHtml.includes("<title>User guide | L Studio</title>"),
  "guide title injection"
);
assert(
  guideHtml.includes('rel="canonical" href="https://l-studio.studio/guide/"'),
  "guide canonical injection"
);
assert(guideHtml.includes('lang="en"'), "guide html lang");
const hebrewHome = applySeoToHtml(indexHtml, seoDocument("/", "he"));
assert(
  hebrewHome.includes('<html lang="he" dir="rtl"'),
  "Hebrew html lang and dir"
);
assert(
  hebrewHome.includes("תחנת עבודה מוזיקלית מיקרוטונלית"),
  "Hebrew title injection"
);

const sitemapPath = join(root, "client/public/sitemap.xml");
const sitemap = readFileSync(sitemapPath, "utf8");
assert(
  sitemap === renderSitemapXml(),
  "sitemap.xml matches renderSitemapXml()"
);
for (const page of SITEMAP_PAGES) {
  assert(
    sitemap.includes(
      `<loc>${seoDocument(paths[page.id], "en").canonical}</loc>`
    ),
    `sitemap lists ${page.id}`
  );
}
assert(
  !sitemap.includes("/buy/success"),
  "sitemap omits the download return page"
);
assert(!sitemap.includes("/404"), "sitemap omits the not-found page");
assert(
  sitemap.includes("https://l-studio.studio/exclusive/"),
  "sitemap lists exclusive"
);

const robots = readFileSync(join(root, "client/public/robots.txt"), "utf8");
assert(robots.includes("Allow: /"), "robots allows /");
assert(
  robots.includes("Sitemap: https://l-studio.studio/sitemap.xml"),
  "robots points at the sitemap"
);

const languages: Language[] = ["en", "he", "ru", "ar"];
assert(
  languages.every(language => seoDocument("/", language).ogLocale.length > 0),
  "og:locale"
);

if (failures.length) {
  console.error(failures.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(
  `SEO self-check passed (${pages.length} pages, ${LANGUAGES.length} languages).`
);
