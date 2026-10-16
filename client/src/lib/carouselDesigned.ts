import type { Language } from "@/contexts/LanguageContext";

/**
 * Slide ids that have a designed store poster per language in assets/carousel/{lang}/.
 * Written by scripts/import-carousel-posters.py. Leave a slide out to fall back to the approved poster or the real phone shot.
 */
export const DESIGNED: Record<Language, string[]> = {
  he: ["drum-fx", "drum-repeats", "drum-samples", "loop-editor", "loop-fx", "loop-looper", "loop-page-name", "mic-channels", "mic-console", "mic-fx", "mic-lyrics", "sound-frequencies", "sound-presets", "sound-scales"],
  en: ["drum-fx", "drum-repeats", "drum-samples", "loop-editor", "loop-fx", "loop-looper", "loop-page-name", "mic-channels", "mic-console", "mic-fx", "mic-lyrics", "sound-frequencies", "sound-presets", "sound-scales"],
  ru: ["drum-fx", "drum-repeats", "drum-samples", "loop-editor", "loop-fx", "loop-looper", "loop-page-name", "mic-channels", "mic-console", "mic-fx", "mic-lyrics", "sound-frequencies", "sound-presets", "sound-scales"],
  ar: ["drum-fx", "drum-repeats", "drum-samples", "loop-editor", "loop-fx", "loop-looper", "loop-page-name", "mic-channels", "mic-console", "mic-fx", "mic-lyrics", "sound-frequencies", "sound-presets", "sound-scales"],
};
