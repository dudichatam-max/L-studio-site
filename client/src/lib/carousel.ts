import type { Language } from "@/contexts/LanguageContext";

export type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";
/** "update112" = the 1.12 screenshots (analog mixer, wave EQ, Mastering) on /updates, in the 1.12 item.
 * "home112" = the homepage top carousel under the hero title: David's 8 Google Play 1.12 store images (Drive "נכסים 1.12"). */
export type CarouselId = PlayId | "update112" | "home112";

/**
 * Home "Play with sound" carousels: one list per tab, in display order.
 * Every slide is a designed store poster (Google Play style) made per language, with its own counter n/N baked in
 * (N = slides of that tab). The site draws no counter. Files: assets/carousel/{lang}/{id}-w360|w630.{webp,jpg},
 * written by scripts/import-carousel-posters.py from a source dir of {lang}/{designed}.png (1.13 set: /workspace/site-v113fx-src).
 * Only real screens of the version on Google Play (1.13). No slide may show an older interface.
 * Slide titles and texts live in content.json under languages.*.carousel.slides[id].
 * To add or remove a slide the designer must rebake that tab's counters, then update this list.
 */
export type SlideDef = { id: string; designed: string };

export const carouselSlides: Record<CarouselId, SlideDef[]> = {
  sound: [
    { id: "sound-fx", designed: "sound-1" },
    { id: "sound-fx-knobs", designed: "sound-2" },
    { id: "sound-fm", designed: "sound-3" },
    { id: "sound-scales", designed: "sound-4" },
    { id: "sound-frequencies", designed: "sound-5" },
    { id: "sound-wave-panel", designed: "sound-6" },
    { id: "sound-two-keyboards", designed: "sound-7" },
  ],
  mic: [
    { id: "mic-channels", designed: "mic-1" },
    { id: "mic-editor", designed: "mic-2" },
    { id: "mic-lyrics", designed: "mic-3" },
    { id: "mic-mastering", designed: "mic-4" },
  ],
  loop: [
    { id: "loop-looper", designed: "loop-1" },
    { id: "loop-fx", designed: "loop-2" },
    { id: "loop-editor", designed: "loop-3" },
    { id: "loop-page-name", designed: "loop-4" },
    { id: "loop-mixer", designed: "loop-5" },
  ],
  pad: [
    { id: "pad-live", designed: "pad-1" },
  ],
  // Home top carousel: 7 of the 8 Google Play 1.12 store images from David's Drive folder "נכסים 1.12".
  // play112-2 (the old Sound FX window) was dropped for 1.13; the counter pill was redrawn as n/7 (site 1.13, Oct 28 2026).
  // he = the Hebrew set (עברית), en, ru, ar = the English set.
  home112: [
    { id: "home-sound", designed: "play112-1" },
    { id: "home-looper", designed: "play112-3" },
    { id: "home-live-pad", designed: "play112-4" },
    { id: "home-drums", designed: "play112-5" },
    { id: "home-mixer", designed: "play112-6" },
    { id: "home-mastering-style", designed: "play112-7" },
    { id: "home-mastering-measure", designed: "play112-8" },
  ],
  // /updates, 1.12 item (counter n/10 baked in): mixer first, then Mastering. Real 1.12 smoke captures (David, Oct 21).
  // he and en have their own captions; ru and ar use the English posters for now (TODO in CONTENT_EDITING.md).
  update112: [
    { id: "upd-mixer", designed: "upd112-1" },
    { id: "upd-wave-eq", designed: "upd112-2" },
    { id: "upd-wave-pages", designed: "upd112-3" },
    { id: "upd-wave-octave", designed: "upd112-4" },
    { id: "upd-master-beginner", designed: "upd112-5" },
    { id: "upd-master-styles", designed: "upd112-6" },
    { id: "upd-master-advanced", designed: "upd112-7" },
    { id: "upd-master-tone", designed: "upd112-8" },
    { id: "upd-master-stereo", designed: "upd112-9" },
    { id: "upd-master-saved", designed: "upd112-10" },
  ],
  drum: [
    { id: "drum-rows", designed: "drum-1" },
    { id: "drum-fx", designed: "drum-2" },
    { id: "drum-banks", designed: "drum-3" },
    { id: "drum-loaded", designed: "drum-4" },
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

export const CAROUSEL_VER = "carousel-12";
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
