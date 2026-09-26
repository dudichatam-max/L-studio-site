import type { Language } from "@/contexts/LanguageContext";

/** Fallback labels. Editable copy lives in content.json under nav.exclusive. */
export const exclusiveNavLabel: Record<Language, string> = {
  he: "בלעדי",
  en: "Exclusive",
  ru: "Эксклюзив",
  ar: "حصري",
};
