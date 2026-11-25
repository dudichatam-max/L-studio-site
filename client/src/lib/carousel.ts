import type { Language } from "@/contexts/LanguageContext";

export type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";
/** "update112" = the 1.12 screenshots (analog mixer, wave EQ, Mastering) on /updates, in the 1.12 item.
 * "home112" = the homepage top carousel: Google Play 1.17 store images 01-08 (Drive "1.17 Smoked", HE+EN). */
export type CarouselId = PlayId | "update112" | "home112";

/**
 * Home feature tabs (Sound, Mic, Loop, Pad, Drum).
 *
 * 1.17 slides, four per tab (two for Pad), in NN order. The FIG. number baked
 * into each poster matches its NN slot. Append a later slide by adding `{ id, designed }` to the tab array and
 * `languages.*.carousel.slides[id]` in he, en, ru, and ar.
 *
 * Hebrew uses `assets/carousel/he/`. English, Russian, and Arabic use the
 * English artwork: the ru and ar folders are copies of en (the site has no
 * separate Russian or Arabic posters).
 *
 * The hero carousel (`home112`) and the 1.12 updates carousel stay on their
 * existing sets. Do not run scripts/import-carousel-posters.py against this
 * tree without every source PNG: it deletes files it does not reimport.
 *
 * Slide titles and texts live in content.json under languages.*.carousel.slides[id].
 */
export type SlideDef = { id: string; designed: string };

/** Official Google Play 1.17 stills 01-08, in store order (FIG. 01-08 is baked into each file). */
export const play117: Record<string, SlideDef> = {
  sound: { id: "home-sound", designed: "01-sound" },
  soundFx: { id: "home-sound-fx", designed: "02-sound-fx" },
  mic: { id: "home-mic", designed: "03-mic" },
  looper: { id: "home-looper", designed: "04-looper" },
  pad: { id: "home-pad", designed: "05-pad" },
  drums: { id: "home-drums", designed: "06-drums" },
  samples: { id: "home-samples", designed: "07-samples" },
  mixMastering: { id: "home-mix-mastering", designed: "08-mix-mastering" },
};

const slide = (id: string): SlideDef => ({ id, designed: id });

export const carouselSlides: Record<CarouselId, SlideDef[]> = {
  sound: [
    slide("sound-01"), // effect knobs on long press
    slide("sound-02"), // scales
    slide("sound-03"), // two keyboards
    slide("sound-04"), // Sound FX: 16 worlds, chain up to four
  ],
  mic: [
    slide("mic-01"),
    slide("mic-02"),
    slide("mic-03"),
    slide("mic-04"),
  ],
  loop: [
    slide("loop-01"),
    slide("loop-02"),
    slide("loop-03"),
    slide("loop-04"),
  ],
  pad: [
    slide("pad-01"),
    slide("pad-02"),
  ],
  drum: [
    slide("drum-01"),
    slide("drum-02"),
    slide("drum-03"),
    slide("drum-04"),
  ],
  home112: [
    play117.sound,
    play117.soundFx,
    play117.mic,
    play117.looper,
    play117.pad,
    play117.drums,
    play117.samples,
    play117.mixMastering,
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

export const CAROUSEL_VER = "carousel-r6";
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
