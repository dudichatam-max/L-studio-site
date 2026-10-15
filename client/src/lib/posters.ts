import type { Language } from "@/contexts/LanguageContext";

/**
 * Approved store/site posters (1080x1920 sources, 9:16). Files live in assets/posters/{en,he}/.
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

export const POSTER_VER = "poster-2";
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
    sound: "פוסטר: עצבו את הסאונד. מסך Sound עם בחירת גל, מעטפת, פילטר והד, והמקלדת מתחת.",
    soundLive: "פוסטר: שתי מקלדות, בלייב. מסך Sound עם שתי מקלדות ומצב LIVE שנועל חלק מהכפתורים.",
    pad: "פוסטר: פד לנגינה חיה. מסך ה-Pad: מחליקים על הפד כדי להזיז את הצליל, והידיות Wah, Oct ו-Vibrato מוסיפות אפקטים חיים.",
    mic: "פוסטר: הקליטו את הקול. מסך Mic עם ערוצים נפרדים, ולכל ערוץ HPF, נוכחות, Mic FX, השתקה וסולו.",
    loopEditor: "פוסטר: ערכו כל לופ. עורך הלופ עם גל, גזירה ולופ, קשירה לקצבי התופים, EQ ו-SQUEEZE.",
    looper: "פוסטר: בנו שכבות של לופים. מסך הלופר עם עמודים 1 עד 8, ערוצים וצבעים.",
    drums: "פוסטר: בנו את הביט. מסך Drum עם תבניות צעדים בארבעה ערוצים ומקלדת מתחת.",
    drumStyles: "פוסטר: סגנונות תופים. חלון Drum Styles עם חבילת EXPERIMENTAL וכפתורי Load, Edit, Import ו-Export.",
  },
  en: {
    sound: "Poster: Shape Your Sound. The Sound screen with a waveform, envelope, filter and echo, and the keyboard below.",
    soundLive: "Poster: Two Keyboards, Live. The Sound screen with two keyboards and LIVE mode, which locks some buttons.",
    pad: "Poster: Live Performance Pad. The Pad screen: slide on the pad to move the sound, and the Wah, Oct and Vibrato knobs add live effects.",
    mic: "Poster: Record Your Voice. The Mic screen with separate channels, each with its own high-pass, presence, FX, mute and solo.",
    loopEditor: "Poster: Edit Every Loop. The Loop Editor with the waveform, trim and loop, drum rhythms, EQ and squeeze.",
    looper: "Poster: Layer Your Loops. The looper with pages 1 to 8, channels and page colors.",
    drums: "Poster: Build Your Beat. The Drum screen with step patterns on four channels and the keyboard below.",
    drumStyles: "Poster: Drum Styles. The Drum Styles window with the EXPERIMENTAL pack and Load, Edit, Import and Export.",
  },
  ru: {
    sound: "Постер (на английском): Shape Your Sound. Экран Sound с волной, огибающей, фильтром и эхо, а внизу клавиатура.",
    soundLive: "Постер (на английском): Two Keyboards, Live. Экран Sound с двумя клавиатурами и режимом LIVE, который блокирует часть кнопок.",
    pad: "Постер (на английском): Live Performance Pad. Экран Pad: скольжение по паду двигает звук, а ручки Wah, Oct и Vibrato добавляют живые эффекты.",
    mic: "Постер (на английском): Record Your Voice. Экран Mic с отдельными каналами, у каждого свои фильтр высоких частот, presence, FX, mute и solo.",
    loopEditor: "Постер (на английском): Edit Every Loop. Редактор лупа с волной, обрезкой и циклом, ритмами барабанов, EQ и squeeze.",
    looper: "Постер (на английском): Layer Your Loops. Лупер со страницами с 1 по 8, каналами и цветами страниц.",
    drums: "Постер (на английском): Build Your Beat. Экран Drum с шаговыми паттернами на четырех каналах и клавиатурой внизу.",
    drumStyles: "Постер (на английском): Drum Styles. Окно Drum Styles с паком EXPERIMENTAL и кнопками Load, Edit, Import и Export.",
  },
  ar: {
    sound: "ملصق (بالإنجليزية): Shape Your Sound. شاشة Sound مع الموجة والغلاف والفلتر والصدى، وتحتها لوحة المفاتيح.",
    soundLive: "ملصق (بالإنجليزية): Two Keyboards, Live. شاشة Sound مع لوحتي مفاتيح ووضع LIVE الذي يقفل بعض الأزرار.",
    pad: "ملصق (بالإنجليزية): Live Performance Pad. شاشة Pad: الانزلاق على اللوحة يحرّك الصوت، ومقابض Wah وOct وVibrato تضيف مؤثرات حية.",
    mic: "ملصق (بالإنجليزية): Record Your Voice. شاشة Mic بقنوات منفصلة، ولكل قناة فلتر الترددات العالية وpresence وFX وmute وsolo.",
    loopEditor: "ملصق (بالإنجليزية): Edit Every Loop. محرر اللوب مع الموجة والقص والتكرار وإيقاعات الطبول وEQ وsqueeze.",
    looper: "ملصق (بالإنجليزية): Layer Your Loops. اللوبر مع الصفحات من 1 إلى 8 والقنوات وألوان الصفحات.",
    drums: "ملصق (بالإنجليزية): Build Your Beat. شاشة Drum مع أنماط خطوات على أربع قنوات ولوحة المفاتيح تحتها.",
    drumStyles: "ملصق (بالإنجليزية): Drum Styles. نافذة Drum Styles مع حزمة EXPERIMENTAL وأزرار Load وEdit وImport وExport.",
  },
} satisfies Record<Language, Record<PosterId, string>>;
