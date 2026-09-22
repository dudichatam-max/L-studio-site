import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "he" | "en" | "ru" | "ar";

export const languages: Array<{ id: Language; label: string; native: string }> = [
  { id: "he", label: "עברית", native: "עברית" },
  { id: "en", label: "English", native: "EN" },
  { id: "ru", label: "Русский", native: "РУ" },
  { id: "ar", label: "العربية", native: "عربي" },
];

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; isRtl: boolean };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem("l-studio-language") as Language | null;
    return saved && languages.some((item) => item.id === saved) ? saved : "en";
  });
  const isRtl = language === "he" || language === "ar";

  useEffect(() => {
    window.localStorage.setItem("l-studio-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [isRtl, language]);

  const value = useMemo(() => ({ language, setLanguage, isRtl }), [isRtl, language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
