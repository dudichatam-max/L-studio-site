import type { Language } from "@/contexts/LanguageContext";

export type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";

/**
 * Home "Play with sound" carousels: one list per tab, in display order.
 * Every slide is a designed store poster (Google Play style) made per language, with its own counter n/N baked in
 * (N = slides of that tab). The site draws no counter. Files: assets/carousel/{lang}/{id}-w360|w630.{webp,jpg},
 * written by scripts/import-carousel-posters.py from /workspace/store-posters/carousel/{lang}/{designed}.png.
 * Slide titles and texts live in content.json under languages.*.carousel.slides[id].
 * To add or remove a slide the designer must rebake that tab's counters, then update this list.
 */
export type SlideDef = { id: string; designed: string };

export const carouselSlides: Record<PlayId, SlideDef[]> = {
  sound: [
    { id: "sound-fx", designed: "sound-1" },
    { id: "sound-keyboards", designed: "sound-2" },
    { id: "sound-presets", designed: "sound-3" },
    { id: "sound-scales", designed: "sound-4" },
  ],
  mic: [
    { id: "mic-channels", designed: "mic-1" },
    { id: "mic-editor", designed: "mic-2" },
    { id: "mic-fx", designed: "mic-3" },
    { id: "mic-lyrics", designed: "mic-4" },
  ],
  loop: [
    { id: "loop-looper", designed: "loop-1" },
    { id: "loop-editor", designed: "loop-2" },
    { id: "loop-fx", designed: "loop-3" },
    { id: "loop-page-name", designed: "loop-4" },
  ],
  pad: [
    { id: "pad-live", designed: "pad-1" },
    { id: "pad-keyboard", designed: "pad-2" },
    { id: "pad-targets", designed: "pad-3" },
  ],
  drum: [
    { id: "drum-banks", designed: "drum-1" },
    { id: "drum-shape", designed: "drum-2" },
    { id: "drum-fx", designed: "drum-3" },
    { id: "drum-repeats", designed: "drum-4" },
  ],
};

export type SlideImage = {
  webp: string;
  jpg: string;
  /** srcset strings: "<url> 360w, <url> 630w" */
  webpSet: string;
  jpgSet: string;
  width: number;
  height: number;
};

export const CAROUSEL_VER = "carousel-2";
const SMALL = 360;
const LARGE = 630;

/** Each language uses its own set: assets/carousel/{language}/. */
export function slideImage(language: Language, slide: SlideDef): SlideImage {
  const dir = `${import.meta.env.BASE_URL}assets/carousel/${language}/${slide.id}`;
  const v = `?v=${CAROUSEL_VER}`;
  return {
    webp: `${dir}-w${LARGE}.webp${v}`,
    jpg: `${dir}-w${LARGE}.jpg${v}`,
    webpSet: `${dir}-w${SMALL}.webp${v} ${SMALL}w, ${dir}-w${LARGE}.webp${v} ${LARGE}w`,
    jpgSet: `${dir}-w${SMALL}.jpg${v} ${SMALL}w, ${dir}-w${LARGE}.jpg${v} ${LARGE}w`,
    width: LARGE,
    height: 1120,
  };
}
