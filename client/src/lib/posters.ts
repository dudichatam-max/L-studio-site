import type { Language } from "@/contexts/LanguageContext";

/**
 * Approved store/site posters, 1.10 set of Oct 16 (1080x1920 sources, 9:16, black background, 3 screens, L STUDIO logo). Files live in assets/posters/{en,he}/.
 * HE uses the Hebrew posters. EN, RU and AR use the English posters (there are no RU or AR posters).
 */
export type PosterId = "sound" | "soundLive" | "pad" | "mic" | "loopEditor" | "looper" | "drums" | "drumStyles";

const FILES: Record<PosterId, string> = {
  sound: "p01-sound",
  soundLive: "p02-sound-live",
  pad: "p03-pad",
  mic: "p04-mic",
  loopEditor: "p05-loop-editor",
  looper: "p06-looper",
  drums: "p07-drums",
  drumStyles: "p08-drum-styles",
};

export const POSTER_VER = "poster-3";
export const POSTER_SMALL = { width: 360, height: 640 };
export const POSTER_LARGE = { width: 630, height: 1120 };

export function posterFolder(language: Language) {
  return language === "he" ? "he" : "en";
}

export function posterUrl(language: Language, id: PosterId, size: "w360" | "w630", ext: "jpg" | "webp") {
  return `${import.meta.env.BASE_URL}assets/posters/${posterFolder(language)}/${FILES[id]}-${size}.${ext}?v=${POSTER_VER}`;
}

export const posterAlt = {
  he: {
    sound: "פוסטר: נגינה עם צלילים משלך. מסך Sound עם חמישה גלי קול, מעטפת, פילטר והד.",
    soundLive: "פוסטר: שתי מקלדות, נגינה חיה. מסך Sound עם 16 קלידים ומצב LIVE שנועל חלק מהכפתורים.",
    pad: "פוסטר: משטח נגינה חי. מסך Pad: גוררים על המשטח כדי לעצב את הצליל בזמן אמת.",
    mic: "פוסטר: הקליטו את הקול. מסך Mic עם שלושה ערוצי שירה, גיטרה, בס וכלי נגינה, ולכל ערוץ עורך סאונד.",
    loopEditor: "פוסטר: ערכו כל לולאה. עורך הלופ: חיתוך, חזרות, איזון וקשירה לקצב התופים.",
    looper: "פוסטר: בנו שכבות של לולאות. מסך הלופר עם 32 ערוצים ב-8 עמודים, עם שמות וצבעים.",
    drums: "פוסטר: בנו את הקצב. מסך Drum עם עד 8 ערוצים ו-16 צעדים, ודגימה מובנית לכל ערוץ ולכל קצב.",
    drumStyles: "פוסטר: ערכות תופים מוכנות. חלון Drum Styles עם 8 חבילות סגנון ועוד 11 עמודים בלעדיים, ויותר מ-1,000 דגימות מובנות.",
  },
  en: {
    sound: "Poster: Play Your Own Sound. The Sound screen with five waveforms, envelope, filter and echo.",
    soundLive: "Poster: Two Keyboards, Live. The Sound screen with two keyboards (16 keys) and LIVE mode, which locks some buttons on stage.",
    pad: "Poster: A Live Performance Pad. The Pad screen: drag on the pad to shape the sound in real time.",
    mic: "Poster: Record Your Voice. The Mic screen with three vocal channels, guitar, bass and instrument, each with its own sound editor.",
    loopEditor: "Poster: Edit Every Loop. The Loop Editor: trim, repeat, EQ, and lock it to the drum rhythm.",
    looper: "Poster: Build Layers of Loops. The looper with 32 channels across 8 pages, named and colored.",
    drums: "Poster: Build the Beat. The Drum screen with up to 8 channels and 16 steps, and a built-in sample for each channel and rhythm.",
    drumStyles: "Poster: Drum Styles. The Drum Styles window with 8 style packs and 11 Exclusive pages, with 1,000+ built-in samples.",
  },
  ru: {
    sound: "Постер (на английском): Play Your Own Sound. Экран Sound с пятью волнами, огибающей, фильтром и эхо.",
    soundLive: "Постер (на английском): Two Keyboards, Live. Экран Sound с двумя клавиатурами (16 клавиш) и режимом LIVE, который блокирует часть кнопок на сцене.",
    pad: "Постер (на английском): A Live Performance Pad. Экран Pad: проведите по паду, чтобы менять звук в реальном времени.",
    mic: "Постер (на английском): Record Your Voice. Экран Mic: три вокальных канала, гитара, бас и инструмент, у каждого свой редактор звука.",
    loopEditor: "Постер (на английском): Edit Every Loop. Редактор лупа: обрезка, повторы, EQ и привязка к ритму ударных.",
    looper: "Постер (на английском): Build Layers of Loops. Лупер: 32 канала на 8 страницах, с названиями и цветами.",
    drums: "Постер (на английском): Build the Beat. Экран Drum: до 8 каналов и 16 шагов, встроенный сэмпл для каждого канала и ритма.",
    drumStyles: "Постер (на английском): Drum Styles. Окно Drum Styles: 8 пакетов стилей и 11 страниц Exclusive, более 1000 встроенных сэмплов.",
  },
  ar: {
    sound: "ملصق (بالإنجليزية): Play Your Own Sound. شاشة Sound مع خمس موجات والغلاف والفلتر والصدى.",
    soundLive: "ملصق (بالإنجليزية): Two Keyboards, Live. شاشة Sound مع لوحتي مفاتيح (16 مفتاحاً) ووضع LIVE الذي يقفل بعض الأزرار على المسرح.",
    pad: "ملصق (بالإنجليزية): A Live Performance Pad. شاشة Pad: اسحب على اللوحة لتشكيل الصوت في الوقت الفعلي.",
    mic: "ملصق (بالإنجليزية): Record Your Voice. شاشة Mic: ثلاث قنوات صوت وغيتار وباس وآلة، ولكل قناة محرر صوت خاص.",
    loopEditor: "ملصق (بالإنجليزية): Edit Every Loop. محرر اللوب: قص وتكرار وEQ وربط بإيقاع الطبول.",
    looper: "ملصق (بالإنجليزية): Build Layers of Loops. اللوبر: 32 قناة على 8 صفحات، بأسماء وألوان.",
    drums: "ملصق (بالإنجليزية): Build the Beat. شاشة Drum: حتى 8 قنوات و16 خطوة، وعينة مدمجة لكل قناة ولكل إيقاع.",
    drumStyles: "ملصق (بالإنجليزية): Drum Styles. نافذة Drum Styles: 8 حزم أنماط و11 صفحة Exclusive، وأكثر من 1000 عينة مدمجة.",
  },
} satisfies Record<Language, Record<PosterId, string>>;
