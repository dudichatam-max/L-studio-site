import type { Language } from "@/contexts/LanguageContext";

export type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";
/** "store" = the 8 homepage slides under the hero title (same 8 screens as the Google Play listing, 1.12 poster style; not a windows tab).
 * "update112" = the 1.12 screenshots on /updates (analog mixer, wave EQ, Mastering), attached to the 1.12 item. */
export type CarouselId = PlayId | "store" | "update112";

/**
 * Home "Play with sound" carousels: one list per tab, in display order.
 * Every slide is a designed store poster (Google Play style) made per language, with its own counter n/N baked in
 * (N = slides of that tab). The site draws no counter. Files: assets/carousel/{lang}/{id}-w360|w630.{webp,jpg},
 * written by scripts/import-carousel-posters.py from /workspace/store-posters/carousel/{lang}/{designed}.png.
 * Slide titles and texts live in content.json under languages.*.carousel.slides[id].
 * To add or remove a slide the designer must rebake that tab's counters, then update this list.
 */
export type SlideDef = { id: string; designed: string };

export const carouselSlides: Record<CarouselId, SlideDef[]> = {
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
  // Homepage top carousel: the same 8 screens as the Google Play listing (01..08), rendered in the 1.12 updates-carousel
  // poster style (counter n/8, gold + white title, caption, one real capture). Captions per language (he, en, ru, ar).
  store: [
    { id: "store-sound", designed: "home-1" },
    { id: "store-keyboards", designed: "home-2" },
    { id: "store-pad", designed: "home-3" },
    { id: "store-voice", designed: "home-4" },
    { id: "store-loop", designed: "home-5" },
    { id: "store-layers", designed: "home-6" },
    { id: "store-beat", designed: "home-7" },
    { id: "store-drum-styles", designed: "home-8" },
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
    { id: "drum-main", designed: "drum-2" },
    { id: "drum-banks", designed: "drum-3" },
    { id: "drum-loaded", designed: "drum-4" },
    { id: "drum-fx", designed: "drum-5" },
    { id: "drum-repeats", designed: "drum-6" },
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

export const CAROUSEL_VER = "carousel-7";
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
