import type { Language } from "@/contexts/LanguageContext";

export type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";
/** "update112" = the 1.12 screenshots (analog mixer, wave EQ, Mastering) on /updates, in the 1.12 item.
 * "home112" = the homepage top carousel under the hero title: Google Play 1.15 store images (Drive folder, HE+EN). */
export type CarouselId = PlayId | "update112" | "home112";

/**
 * Home feature tabs (Sound, Mic, Loop, Pad, Drum).
 *
 * Round-2 designer slides, in NN order. Each id replaces one previous poster
 * (named in the comment). `loop-page-name` was removed and has no replacement.
 * Append a later slide by adding `{ id, designed }` to the tab array and
 * `languages.*.carousel.slides[id]` in he, en, ru, and ar. `pad-02` and
 * `drum-05` are the next two and are not in this set yet.
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

const slide = (id: string): SlideDef => ({ id, designed: id });

export const carouselSlides: Record<CarouselId, SlideDef[]> = {
  sound: [
    slide("sound-01"), // replaces sound-fx
    slide("sound-02"), // replaces sound-fx-knobs
    slide("sound-03"), // replaces sound-fm
    slide("sound-04"), // replaces sound-scales
    slide("sound-05"), // replaces sound-frequencies
    slide("sound-06"), // replaces sound-wave-panel
    slide("sound-07"), // replaces sound-two-keyboards
  ],
  mic: [
    slide("mic-01"), // replaces mic-channels
    slide("mic-02"), // replaces mic-editor
    slide("mic-03"), // replaces mic-lyrics
    slide("mic-04"), // replaces mic-mastering
  ],
  loop: [
    slide("loop-01"), // replaces loop-looper
    slide("loop-02"), // replaces loop-fx
    slide("loop-03"), // replaces loop-editor
    // loop-page-name removed (feature gone in 1.15), no replacement
    slide("loop-04"), // replaces loop-mixer
  ],
  pad: [
    slide("pad-01"), // replaces pad-live
    // pad-02 arrives in a later set; append it here
  ],
  drum: [
    slide("drum-01"), // replaces drum-rows
    slide("drum-02"), // replaces drum-fx
    slide("drum-03"), // replaces drum-banks
    slide("drum-04"), // replaces drum-loaded
    // drum-05 arrives in a later set; append it here
  ],
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

export const CAROUSEL_VER = "carousel-r2";
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
