/**
 * Checks Google document metadata: four languages, public URLs, and the sitemap.
 * Run: pnpm check:seo
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  homeFeatureBlocks,
  injectPrerender,
  renderPrerenderInner,
  type SiteContent,
} from "./prerender";
import { bidiHtml, splitLatinRuns } from "./bidi";
import {
  APP_FACTS,
  LANGUAGES,
  languageFromPath,
  localizedPath,
  stripLanguagePrefix,
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

const APPROVED_HOME_TITLES: Record<Language, string> = {
  en: "L Studio: Microtonal Synth, Looper, Drums, Mic & Mastering — A Full Studio in Your Phone",
  he: "L Studio: סינתיסייזר מיקרוטונאלי, לופר, תופים, מיקרופון ומאסטרינג — אולפן מלא בפלאפון",
  ru: "L Studio: микротональный синтезатор, лупер, ударные, микрофон и мастеринг — полная студия в вашем телефоне",
  ar: "L Studio: سنث مايكروتونال، لوبر، طبول، ميكروفون وماسترنغ — استوديو كامل في هاتفك",
};

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
    // David's exact home title (and its localized equivalents) may keep the
    // typographic dash and the phrase "A Full Studio in Your Phone".
    const titleForDash = doc.title === APPROVED_HOME_TITLES[language] ? "L Studio" : doc.title;
    const studioText = `${titleForDash} ${doc.description}`
      .replace(/L Studio/g, "")
      .replace(/A Full Studio in Your Phone/gi, "")
      .replace(/אולפן מלא בפלאפון/g, "")
      .replace(/полная студия в вашем телефоне/gi, "")
      .replace(/استوديو كامل في هاتفك/g, "")
      .replace(/mic studio/gi, "")
      .replace(/סטודיו מיקרופון/g, "");
    assert(
      !titleForDash.includes("—") && !doc.description.includes("—"),
      `${page}/${language} has an em dash`
    );
    assert(
      !titleForDash.includes("–") && !doc.description.includes("–"),
      `${page}/${language} has an en dash`
    );
    assert(
      !/daw/i.test(doc.title) && !/daw/i.test(doc.description),
      `${page}/${language} calls the product a DAW`
    );
    assert(
      !/workstation|תחנת עבודה|рабочая станция|محطة عمل|studio(?! *L)|סטודיו/i.test(studioText),
      `${page}/${language} uses workstation or studio wording`
    );
    const app = doc.jsonLd["@graph"][1];
    assert(app["@type"] === "MobileApplication", "MobileApplication node");
    assert(
      app.applicationCategory === "MultimediaApplication",
      "applicationCategory"
    );
    assert(app.operatingSystem === "Android 7.0+", "operatingSystem (minSdk 24)");
    assert(app.softwareVersion === APP_FACTS.softwareVersion, "softwareVersion");
    assert(app.name === "L Studio", "app name");
    // Price set by David for the public Google Play launch: $8. Do not change without him.
    assert(
      app.offers.price === "8" && app.offers.priceCurrency === "USD",
      `${page}/${language} offer must be 8 USD`
    );
    const json = JSON.stringify(doc.jsonLd);
    assert(!/installUrl|play\.google|\.apk/i.test(json), `${page}/${language} has a store or APK link`);
    assert(app.screenshot.length > 0, "screenshots");
    assert(
      app.screenshot.every(url => url.startsWith("https://l-studio.studio/assets/")),
      "screenshots are on the site"
    );
    seen.add(doc.description);
    const hreflang = doc.alternates.map(item => item.hreflang).join(",");
    assert(
      hreflang === "en,he,ru,ar,x-default",
      `${page}/${language} hreflang set`
    );
    assert(!doc.canonical.includes("lang="), `${page}/${language} canonical has no lang query`);
    if (language === "en") {
      assert(
        !/l-studio\.studio\/(he|ru|ar)(\/|$)/.test(doc.canonical),
        `${page} English canonical has no language prefix`
      );
    } else {
      assert(
        doc.canonical.startsWith(`https://l-studio.studio/${language}/`),
        `${page}/${language} canonical uses /${language}/`
      );
    }
    // The prefixed path resolves to the same page and canonical.
    const prefixed = seoDocument(localizedPath(paths[page], language), language);
    assert(prefixed.pageId === page, `${page}/${language} prefixed path resolves`);
    assert(prefixed.canonical === doc.canonical, `${page}/${language} prefixed canonical`);
    if (page === "not-found" || page === "buy-success" || page === "buy") {
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
    "https://l-studio.studio/he/guide/",
  "guide Hebrew canonical"
);
assert(
  seoDocument("/he/guide/", "he").canonical ===
    "https://l-studio.studio/he/guide/",
  "Hebrew guide path canonical"
);
assert(
  seoDocument("/", "ar").canonical === "https://l-studio.studio/ar/",
  "Arabic home canonical"
);
assert(languageFromPath("/he/") === "he", "language from /he/");
assert(languageFromPath("/ru/guide/") === "ru", "language from /ru/guide/");
assert(languageFromPath("/help/") === null, "no language from /help/");
assert(languageFromPath("/") === null, "no language at root");
assert(stripLanguagePrefix("/ar/factory-64/drums/") === "/factory-64/drums/", "strip prefix");
assert(localizedPath("/he/guide/", "en") === "/guide/", "back to English path");
assert(localizedPath("/", "he") === "/he/", "Hebrew home path");
assert(
  seoDocument("/he/nope", "he").canonical === "https://l-studio.studio/he/nope",
  "unknown Hebrew path self canonical"
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
  homeEn["@graph"][1]["@type"] === "MobileApplication",
  "MobileApplication node"
);
assert(homeHe["@graph"][1].url === "https://l-studio.studio/he/", "Hebrew app url");
assert(Boolean(APP_FACTS.softwareVersion), "app facts version is set");
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
  hebrewHome.includes('rel="canonical" href="https://l-studio.studio/he/"'),
  "Hebrew canonical injection"
);
assert(
  hebrewHome.includes('hreflang="he" href="https://l-studio.studio/he/"'),
  "Hebrew hreflang injection"
);
assert(
  hebrewHome.includes("סינתיסייזר מיקרוטונאלי"),
  "Hebrew title injection"
);

const sitemapPath = join(root, "client/public/sitemap.xml");
const sitemap = readFileSync(sitemapPath, "utf8");
assert(
  sitemap === renderSitemapXml(),
  "sitemap.xml matches renderSitemapXml()"
);
for (const page of SITEMAP_PAGES) {
  for (const language of LANGUAGES) {
    assert(
      sitemap.includes(
        `<loc>${seoDocument(paths[page.id], language).canonical}</loc>`
      ),
      `sitemap lists ${page.id}/${language}`
    );
  }
}
assert(!sitemap.includes("?lang="), "sitemap has no ?lang= URLs");
assert(!sitemap.includes("/buy/"), "sitemap omits /buy/ (no purchase on the site)");
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


const siteContent = JSON.parse(
  readFileSync(join(root, "content.json"), "utf8")
) as SiteContent;
for (const language of LANGUAGES) {
  const homeTitle = seoDocument("/", language).title;
  assert(
    homeTitle === APPROVED_HOME_TITLES[language],
    `${language} home title matches the approved wording`
  );
  const blocks = homeFeatureBlocks(siteContent, language);
  assert(blocks.length === 9, `${language} has 9 official feature blocks`);
  const inner = renderPrerenderInner("home", "/", language, siteContent) ?? "";
  assert(inner.includes("<h2>"), `${language} home prerender has h2`);
  const visible = (html: string) => html.replace(/<[^>]+>/g, "");
  const articleOf = (id: string) => {
    const match = inner.match(new RegExp(`<article id="${id}">([\\s\\S]*?)</article>`));
    return match?.[1] ?? "";
  };
  for (const block of blocks) {
    const article = articleOf(block.id);
    assert(
      visible(article).includes(block.title),
      `${language} prerender heading ${block.id}`
    );
    if (block.id === "drums") {
      assert(article.includes("<h3>"), `${language} drums prerender has h3`);
      assert(article.includes("<ul>"), `${language} drums prerender has ul`);
      assert(Boolean(block.lead) && visible(article).includes(block.lead as string), `${language} drums lead`);
      assert(Boolean(block.stylesLead) && visible(article).includes(block.stylesLead as string), `${language} drums styles lead`);
      assert(Boolean(block.channelsLead) && visible(article).includes(block.channelsLead as string), `${language} drums channels lead`);
      assert(Boolean(block.channelsNote) && visible(article).includes(block.channelsNote as string), `${language} drums channels note`);
      for (const name of block.channelNames ?? []) {
        assert(visible(article).includes(name), `${language} drums channel ${name}`);
      }
      assert(Boolean(block.packs) && visible(article).includes(block.packs as string), `${language} drums packs`);
      for (const group of block.styleGroups ?? []) {
        assert(visible(article).includes(group.genre), `${language} drums genre ${group.genre}`);
        for (const style of group.styles) {
          assert(visible(article).includes(style), `${language} drums style ${style}`);
        }
      }
    } else {
      assert(
        visible(article).includes(block.body),
        `${language} prerender body ${block.id}`
      );
    }
  }
  const identity = siteContent.languages?.[language]?.underHood?.identity ?? "";
  assert(Boolean(identity), `${language} identity`);
  assert(visible(inner).includes(identity), `${language} prerender identity`);
  const injected = injectPrerender(
    '<html><body><div id="root"></div></body></html>',
    "home",
    "/",
    language,
    siteContent
  );
  assert(
    injected.includes('<main class="seo-prerender" hidden>'),
    `${language} prerender is in #root`
  );
  const updatesInner = renderPrerenderInner("updates", "/updates/", language, siteContent) ?? "";
  assert(updatesInner.includes("<h1>"), `${language} updates prerender h1`);
  const guideInner = renderPrerenderInner("guide", "/guide/", language, siteContent) ?? "";
  assert(guideInner.includes("<h1>"), `${language} guide prerender h1`);
}
assert(
  (renderPrerenderInner("home", "/", "en", siteContent) ?? "").includes("<h2>Free Tuning</h2>"),
  "English prerender uses Free Tuning"
);
assert(
  (renderPrerenderInner("home", "/", "en", siteContent) ?? "").includes("<h2>Sound FX / 8 Bass Worlds</h2>"),
  "English prerender uses Sound FX / 8 Bass Worlds"
);

const heHome = renderPrerenderInner("home", "/", "he", siteContent) ?? "";
assert(heHome.includes('<bdi dir="ltr">'), "Hebrew prerender isolates Latin runs");
assert(heHome.includes('<bdi dir="ltr">Random</bdi>'), "Hebrew prerender isolates Random");
assert(heHome.includes('<bdi dir="ltr">FX 1</bdi>'), "Hebrew prerender isolates FX 1");
assert(heHome.includes('<bdi dir="ltr">Performance Pad</bdi>'), "Hebrew prerender isolates Performance Pad");
assert(heHome.includes('<bdi dir="ltr">3,696</bdi>'), "Hebrew prerender isolates 3,696");
assert(
  !heHome.includes("Rap Techno"),
  "Hebrew prerender does not glue Rap and Techno together"
);
const arHome = renderPrerenderInner("home", "/", "ar", siteContent) ?? "";
assert(arHome.includes('<bdi dir="ltr">Random</bdi>'), "Arabic prerender isolates Random");
assert(arHome.includes('<bdi dir="ltr">FX 2</bdi>'), "Arabic prerender isolates FX 2");
assert(
  splitLatinRuns("FX 1 ו-FX 2").map(part => part.text).join("|") === "FX 1| ו-|FX 2",
  "FX 1 and FX 2 stay as separate LTR runs in Hebrew"
);
assert(
  bidiHtml("ל-WAV, FLAC ו-MP3", true).includes('<bdi dir="ltr">WAV, FLAC</bdi>'),
  "mastering export formats are isolated as LTR"
);

if (failures.length) {
  console.error(failures.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(
  `SEO self-check passed (${pages.length} pages, ${LANGUAGES.length} languages).`
);
