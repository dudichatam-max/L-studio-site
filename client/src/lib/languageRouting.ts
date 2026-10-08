import { useBrowserLocation, navigate as browserNavigate } from "wouter/use-browser-location";
import { languageFromPath, localizedPath, stripLanguagePrefix, type Language } from "@shared/seo";

/**
 * Language lives in the URL path: English at "/", Hebrew at "/he/", Russian at
 * "/ru/", Arabic at "/ar/". Routes and <Link href> stay language-free ("/guide");
 * this module adds and removes the prefix.
 */
let activeLanguage: Language = "en";

export function setActiveLanguage(language: Language) {
  activeLanguage = language;
}

function splitBase(path: string, base: string): [string, string] {
  if (base && path.toLowerCase().startsWith(base.toLowerCase())) return [base, path.slice(base.length) || "/"];
  return ["", path];
}

/** Moves the address bar to the same page in `language` without a reload. */
export function replaceUrlLanguage(language: Language, base = "") {
  const url = new URL(window.location.href);
  const hadLang = url.searchParams.has("lang");
  url.searchParams.delete("lang");
  const [prefix, rest] = splitBase(url.pathname, base);
  const nextPath = `${prefix}${localizedPath(rest, language)}`;
  if (nextPath === url.pathname && !hadLang) return;
  url.pathname = nextPath;
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function languageInUrl(base = ""): Language {
  const [, rest] = splitBase(window.location.pathname, base);
  return languageFromPath(rest) ?? "en";
}

type RouterLike = { base: string };

/** Adds the language prefix to a path and keeps any ?query or #hash. */
function localizeTarget(target: string, language: Language): string {
  const cut = target.search(/[?#]/);
  const path = cut === -1 ? target : target.slice(0, cut);
  const suffix = cut === -1 ? "" : target.slice(cut);
  return `${localizedPath(path || "/", language)}${suffix}`;
}

/** wouter location hook: hides the language prefix from routes and adds it back on navigation. */
export function useLanguageLocation(router: RouterLike): [string, (to: string, options?: { replace?: boolean; state?: unknown }) => void] {
  const [path] = useBrowserLocation();
  const [prefix, rest] = splitBase(path, router.base);
  const navigate = (to: string, options?: { replace?: boolean; state?: unknown }) => {
    const [toPrefix, toRest] = splitBase(to, router.base);
    browserNavigate(`${toPrefix}${localizeTarget(toRest, activeLanguage)}`, options);
  };
  return [`${prefix}${stripLanguagePrefix(rest)}`, navigate];
}

/** wouter hrefs option: "/guide" renders as "/he/guide" on the Hebrew site. */
export function languageHref(href: string, router: RouterLike): string {
  const [prefix, rest] = splitBase(href, router.base);
  if (!rest.startsWith("/")) return href;
  return `${prefix}${localizeTarget(rest, activeLanguage)}`;
}
