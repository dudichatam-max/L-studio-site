import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isLanguage, languageFromPath, languageFromSearch, type Language } from "@shared/seo";
import { replaceUrlLanguage, setActiveLanguage } from "@/lib/languageRouting";

export type { Language };

export const languages: Array<{ id: Language; label: string; native: string }> =
  [
    { id: "he", label: "עברית", native: "עברית" },
    { id: "en", label: "English", native: "EN" },
    { id: "ru", label: "Русский", native: "РУ" },
    { id: "ar", label: "العربية", native: "عربي" },
  ];

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  isRtl: boolean;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Old GitHub project-pages path. The live site uses the root. */
export function legacyBase(): string {
  return window.location.pathname.startsWith("/L-studio-site") ? "/L-studio-site" : "";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Order: /he/ path, legacy ?lang=he, saved choice, English.
    const saved = window.localStorage.getItem("l-studio-language");
    const initial =
      languageFromPath(window.location.pathname) ??
      languageFromSearch(window.location.search) ??
      (isLanguage(saved) ? saved : "en");
    setActiveLanguage(initial);
    // Keep the address bar on the matching language path before the first render.
    replaceUrlLanguage(initial, legacyBase());
    return initial;
  });
  const setLanguage = useCallback((next: Language) => {
    setActiveLanguage(next);
    replaceUrlLanguage(next, legacyBase());
    setLanguageState(next);
  }, []);
  const isRtl = language === "he" || language === "ar";

  useEffect(() => {
    window.localStorage.setItem("l-studio-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [isRtl, language]);

  const value = useMemo(
    () => ({ language, setLanguage, isRtl }),
    [isRtl, language, setLanguage]
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
