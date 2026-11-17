import type { Language } from "@/contexts/LanguageContext";

export type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";
/** "update112" = the 1.12 screenshots (analog mixer, wave EQ, Mastering) on /updates, in the 1.12 item.
 * "home112" = the homepage top carousel under the hero title: Google Play 1.15 store images (Drive folder, HE+EN). */
export type CarouselId = PlayId | "update112" | "home112";

/**
 * Home carousels.
 *
 * `play115` is the official 1.15 Google Play set already on disk
 * (`assets/carousel/{lang}/home-*-w360|w630.{webp,jpg}`). Hebrew uses the Hebrew
 * files. English, Russian, and Arabic use the English files. Do not draw or
 * generate new slides here. A designer is making extra 1.15-style slides; add
 * one later by appending `{ id, designed }` to a tab array, adding
 * `languages.*.carousel.slides[id]` in he, en, ru, and ar, and dropping in the
 * four files per language. Mixer and mastering stay on `home112` until a tab
 * is the right place for them.
 *
 * Files are written by scripts/import-carousel-posters.py only when the source
 * PNG for that `designed` name exists. Do not run that script against this set
 * without those sources: it deletes files it does not reimport.
 *
 * Slide titles and texts live in content.json under languages.*.carousel.slides[id].
 */
export type SlideDef = { id: string; designed: string };

/** Official 1.15 Google Play stills, in store order (the n/8 counter is baked into each file). */
export const play115: Record<string, SlideDef> = {
  sound: { id: "home-sound", designed: "01-sound" },
  soundFx: { id: "home-sound-fx", designed: "02-sound-fx" },
  pad: { id: "home-pad", designed: "03-pad" },
  looper: { id: "home-looper", designed: "04-looper-live" },
  drums: { id: "home-drums", designed: "05-drum" },
  mic: { id: "home-mic", designed: "06-mic" },
  mixer: { id: "home-mixer", designed: "07-mixer" },
  mastering: { id: "home-mastering", designed: "08-mastering" },
};

export const carouselSlides: Record<CarouselId, SlideDef[]> = {
  // One or two existing 1.15 stills per tab. Append a later designer slide to the array.
  sound: [play115.sound, play115.soundFx],
  mic: [play115.mic],
  loop: [play115.looper],
  pad: [play115.pad],
  drum: [play115.drums],
  home112: [
    play115.sound,
    play115.soundFx,
    play115.pad,
    play115.looper,
    play115.drums,
    play115.mic,
    play115.mixer,
    play115.mastering,
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

export const CAROUSEL_VER = "carousel-115";
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
