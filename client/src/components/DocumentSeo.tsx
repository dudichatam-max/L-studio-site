import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { seoDocument, syncLanguageUrl } from "@shared/seo";

function setContent(selector: string, content: string) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute("content", content);
}

/** Keeps the document head aligned with the active route and language. */
export default function DocumentSeo() {
  const [location] = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const doc = seoDocument(window.location.pathname, language);
    document.title = doc.title;
    document.documentElement.lang = doc.htmlLang;
    document.documentElement.dir = doc.dir;
    setContent('meta[name="description"]', doc.description);
    setContent('meta[name="robots"]', doc.robots);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", doc.canonical);
    for (const alt of doc.alternates) {
      document
        .querySelector(`link[rel="alternate"][hreflang="${alt.hreflang}"]`)
        ?.setAttribute("href", alt.href);
    }
    setContent('meta[property="og:locale"]', doc.ogLocale);
    const localeAlternates = document.querySelectorAll(
      'meta[property="og:locale:alternate"]'
    );
    doc.ogLocaleAlternates.forEach((locale, index) => {
      localeAlternates[index]?.setAttribute("content", locale);
    });
    setContent('meta[property="og:url"]', doc.canonical);
    setContent('meta[property="og:title"]', doc.title);
    setContent('meta[property="og:description"]', doc.socialDescription);
    setContent('meta[name="twitter:title"]', doc.title);
    setContent('meta[name="twitter:description"]', doc.socialDescription);
    const script = document.getElementById("l-studio-jsonld");
    if (script) script.textContent = JSON.stringify(doc.jsonLd);
    syncLanguageUrl(language);
  }, [language, location]);

  return null;
}
