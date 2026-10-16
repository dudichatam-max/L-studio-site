import type { Language } from "@/contexts/LanguageContext";
import { POSTER_LARGE, POSTER_SMALL, POSTER_VER, posterFolder, posterUrl, type PosterId } from "@/lib/posters";
import { DESIGNED } from "@/lib/carouselDesigned";

export type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";

/**
 * Home "Play with sound" carousels. One list per tab, in display order.
 * Image sources, best first:
 *  1. A designed store poster for this language: assets/carousel/{lang}/{id}-w360|w630.{webp,jpg}
 *     (listed in carouselDesigned.ts, written by scripts/import-carousel-posters).
 *  2. An approved 1.10 poster (assets/posters, HE or EN folder).
 *  3. A real phone shot (assets/carousel/shots, the app UI is the same in every language).
 * Slide texts live in content.json under languages.*.carousel.slides[id].
 */
type SlideSource = { poster: PosterId } | { shot: string; width: number; height: number };

/** designed = file stem the designer used (<tab>-<n>), mapped to the slide id by scripts/import-carousel-posters.py. */
export type SlideDef = { id: string; designed?: string; source: SlideSource };

/**
 * The counter n/N is baked into each designed poster, so a tab must list exactly the slides the designer made for it.
 * To add a slide (for example the two keyboard posters in Sound), the designer rebakes that tab with the new N, then add the slide here.
 * Slides that are defined but not listed stay in `parkedSlides` with their text in content.json.
 */
export const carouselSlides: Record<PlayId, SlideDef[]> = {
  sound: [
    { id: "sound-presets", designed: "sound-1", source: { shot: "presets", width: 720, height: 1472 } },
    { id: "sound-scales", designed: "sound-2", source: { shot: "scales", width: 720, height: 1472 } },
    { id: "sound-frequencies", designed: "sound-3", source: { shot: "custom-frequency", width: 720, height: 1462 } },
  ],
  mic: [
    { id: "mic-channels", designed: "mic-1", source: { poster: "mic" } },
    { id: "mic-fx", designed: "mic-2", source: { shot: "mic-fx", width: 720, height: 1472 } },
    { id: "mic-lyrics", designed: "mic-3", source: { shot: "lyrics", width: 720, height: 1460 } },
    { id: "mic-console", designed: "mic-4", source: { shot: "load-console", width: 720, height: 1472 } },
  ],
  loop: [
    { id: "loop-looper", designed: "loop-1", source: { poster: "looper" } },
    { id: "loop-editor", designed: "loop-2", source: { poster: "loopEditor" } },
    { id: "loop-fx", designed: "loop-3", source: { shot: "looper-fx", width: 720, height: 1472 } },
    { id: "loop-page-name", designed: "loop-4", source: { shot: "page-name", width: 720, height: 1472 } },
  ],
  pad: [{ id: "pad-live", source: { poster: "pad" } }],
  drum: [
    { id: "drum-samples", designed: "drum-1", source: { shot: "drum-samples", width: 720, height: 1462 } },
    { id: "drum-fx", designed: "drum-2", source: { shot: "drum-fx", width: 720, height: 1472 } },
    { id: "drum-repeats", designed: "drum-3", source: { shot: "pattern-repeats", width: 720, height: 1472 } },
  ],
};

/** Approved posters and shots that are not in a carousel now (no designed poster with a matching counter yet). */
export const parkedSlides: SlideDef[] = [
  { id: "sound-keys", source: { poster: "sound" } },
  { id: "sound-live", source: { poster: "soundLive" } },
  { id: "drum-beat", source: { poster: "drums" } },
  { id: "drum-styles", source: { poster: "drumStyles" } },
  { id: "drum-voice", source: { shot: "voice", width: 720, height: 1454 } },
];

export type SlideImage = {
  webp: string;
  jpg: string;
  /** srcset strings: "<url> 360w, <url> 630w" */
  webpSet: string;
  jpgSet: string;
  width: number;
  height: number;
  /** "designed" = store poster made for this language, "poster" = approved 1.10 poster, "shot" = real phone shot. */
  kind: "designed" | "poster" | "shot";
};

const base = () => import.meta.env.BASE_URL;

export function slideImage(language: Language, slide: SlideDef): SlideImage {
  if (DESIGNED[language]?.includes(slide.id)) {
    const dir = `${base()}assets/carousel/${language}/${slide.id}`;
    const v = `?v=${POSTER_VER}`;
    return {
      kind: "designed",
      webp: `${dir}-w630.webp${v}`,
      jpg: `${dir}-w630.jpg${v}`,
      webpSet: `${dir}-w360.webp${v} ${POSTER_SMALL.width}w, ${dir}-w630.webp${v} ${POSTER_LARGE.width}w`,
      jpgSet: `${dir}-w360.jpg${v} ${POSTER_SMALL.width}w, ${dir}-w630.jpg${v} ${POSTER_LARGE.width}w`,
      width: POSTER_LARGE.width,
      height: POSTER_LARGE.height,
    };
  }
  const src = slide.source;
  if ("poster" in src) {
    return {
      kind: "poster",
      webp: posterUrl(language, src.poster, "w630", "webp"),
      jpg: posterUrl(language, src.poster, "w630", "jpg"),
      webpSet: `${posterUrl(language, src.poster, "w360", "webp")} ${POSTER_SMALL.width}w, ${posterUrl(language, src.poster, "w630", "webp")} ${POSTER_LARGE.width}w`,
      jpgSet: `${posterUrl(language, src.poster, "w360", "jpg")} ${POSTER_SMALL.width}w, ${posterUrl(language, src.poster, "w630", "jpg")} ${POSTER_LARGE.width}w`,
      width: POSTER_LARGE.width,
      height: POSTER_LARGE.height,
    };
  }
  const dir = `${base()}assets/carousel/shots/${src.shot}`;
  return {
    kind: "shot",
    webp: `${dir}-w720.webp`,
    jpg: `${dir}-w720.jpg`,
    webpSet: `${dir}-w360.webp 360w, ${dir}-w720.webp 720w`,
    jpgSet: `${dir}-w360.jpg 360w, ${dir}-w720.jpg 720w`,
    width: src.width,
    height: src.height,
  };
}

export { posterFolder };
