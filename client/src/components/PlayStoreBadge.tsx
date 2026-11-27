import type { Language } from "@/contexts/LanguageContext";

/** The Google Play listing, with the Play UI language matching the site language. */
export const PLAY_HL: Record<Language, string> = { he: "iw", en: "en", ru: "ru", ar: "ar" };
export const PLAY_ALT: Record<Language, string> = {
  he: "כעת ב Google Play",
  en: "Get it on Google Play",
  ru: "Скачать из Google Play",
  ar: "احصل عليه من Google Play",
};
export function playStoreUrl(language: Language): string {
  return `https://play.google.com/store/apps/details?id=com.microtonal.synth&hl=${PLAY_HL[language]}`;
}

/** Official localized Google Play badge, the same one as in the homepage hero. Used in every footer (David, 2026-11-27). */
export default function PlayStoreBadge({ language, className = "" }: { language: Language; className?: string }) {
  return (
    <a className={`play-badge ${className}`.trim()} href={playStoreUrl(language)} target="_blank" rel="noopener">
      <img src={`/assets/badges/google-play-${language}.png`} alt={PLAY_ALT[language]} width={202} height={60} loading="lazy" decoding="async" />
    </a>
  );
}
