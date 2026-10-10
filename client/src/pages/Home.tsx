import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, AudioWaveform, ChevronRight, Disc3, Drum, Facebook, Menu, Mic2, Music2, SlidersHorizontal, Sparkles, X, Instagram } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import WaveScope from "@/components/WaveScope";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { fetchSiteContent } from "@/lib/siteContent";
import { exclusiveNavLabel } from "@/lib/exclusiveNav";
import UpdatesTicker from "@/components/UpdatesTicker";
import { mergeUpdates, updatesNavLabel } from "@/lib/updatesCopy";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import YouTubeFacade from "@/components/YouTubeFacade";

const factoryHero = {
  webp800: `${import.meta.env.BASE_URL}assets/factory-pack-hero-v4-800.webp`,
  webp1254: `${import.meta.env.BASE_URL}assets/factory-pack-hero-v4-1254.webp`,
  jpg800: `${import.meta.env.BASE_URL}assets/factory-pack-hero-v4-800.jpg`,
};
const factoryBoxJpg = `${import.meta.env.BASE_URL}assets/factory-pack-box.jpg?v=108-packs`;
const factoryBoxWebp = `${import.meta.env.BASE_URL}assets/factory-pack-box.webp?v=108-packs`;
const factoryBoxWebp800 = `${import.meta.env.BASE_URL}assets/factory-pack-box-800.webp?v=108-packs`;
const featureGraphic = {
  webp800: `${import.meta.env.BASE_URL}assets/feature-graphic-800.webp`,
  webp1024: `${import.meta.env.BASE_URL}assets/feature-graphic-1024.webp`,
  jpg: `${import.meta.env.BASE_URL}assets/feature-graphic-1024.jpg`,
};
const featureGraphicAlt = {
  he: "L Studio, אפליקציית מוזיקה לאנדרואיד: מסך Sound עם גלים, נובים וקלידים, ומסך Pad עם WAH, OCT ו-Vibrato. Sound, Mic, Loop, Pad, Drum.",
  en: "L Studio, an Android music app: the Sound screen with waves, knobs and keys, and the Pad screen with WAH, OCT and Vibrato. Sound, Mic, Loop, Pad, Drum.",
  ru: "L Studio, музыкальное приложение для Android: экран Sound с волнами, ручками и клавишами и экран Pad с WAH, OCT и Vibrato. Sound, Mic, Loop, Pad, Drum.",
  ar: "L Studio، تطبيق موسيقى لأندرويد: شاشة Sound مع الموجات والمقابض والمفاتيح، وشاشة Pad مع WAH وOCT وVibrato. Sound وMic وLoop وPad وDrum.",
} satisfies Record<Language, string>;
const developerImage = {
  webp: `${import.meta.env.BASE_URL}assets/Developer-720.webp`,
  jpg: `${import.meta.env.BASE_URL}assets/Developer-720.jpg`,
};
// Hidden for now (David, 2026-10-09) until a new video with the new interface exists.
// To restore: set the flag back to true. Files, copy and styles are kept.
// SHOW_HERO_SHOT: hero app screenshot (assets/hero/app-looper-*).
// SHOW_MEET_VIDEO: the "Meet L-studio" section with the intro Short, the hero
// "Watch the short" button (hero.ctaPrimary) and the header button (nav.cta), all linking to #meet.
const SHOW_HERO_SHOT: boolean = false;
const SHOW_MEET_VIDEO: boolean = false;
const heroShot = {
  webp420: `${import.meta.env.BASE_URL}assets/hero/app-looper-420.webp`,
  webp720: `${import.meta.env.BASE_URL}assets/hero/app-looper-720.webp`,
  jpg720: `${import.meta.env.BASE_URL}assets/hero/app-looper-720.jpg`,
};
// Real 1.08 screenshot (LOOP tab), status bar and nav bar cropped off.
const heroShotAlt = {
  he: "מסך הלופר ב-L Studio: עמודים 1 עד 8 עם צבעים, 4 ערוצים בעמוד, ומתחת הקלידים עם התדר של כל קליד.",
  en: "The L Studio looper: pages 1 to 8 with colors, 4 channels per page, and the keys below with each key's frequency.",
  ru: "Лупер в L Studio: страницы с 1 по 8 с цветами, 4 канала на странице, а внизу клавиши с частотой каждой клавиши.",
  ar: "اللوبر في L Studio: الصفحات من 1 إلى 8 بألوان، 4 قنوات في كل صفحة، وتحتها المفاتيح مع تردد كل مفتاح.",
} satisfies Record<Language, string>;
const meetPoster = {
  webp: `${import.meta.env.BASE_URL}assets/meet-short-poster.webp`,
  jpg: `${import.meta.env.BASE_URL}assets/meet-short-poster.jpg`,
};

type PlayId = "sound" | "mic" | "loop" | "pad" | "drum";

const PLAY_SHOT_VER = "109-play";
const playShotFiles: Record<PlayId, string> = {
  sound: "01-layer-waveforms",
  loop: "03-looper-pages",
  drum: "04-drum-machine",
  pad: "05-live-pad",
  mic: "07-mic-fx",
};
function playShotUrl(id: PlayId, ext: "jpg" | "webp") {
  return `${import.meta.env.BASE_URL}assets/play/${playShotFiles[id]}.${ext}?v=${PLAY_SHOT_VER}`;
}

const playShotAlt = {
  he: {
    sound: "תמונת Google Play: Layer Waveforms, כמה גלים יחד כמו Sine ו-Saw, מנגנים אותם ביחד.",
    mic: "תמונת Google Play: ערוצי מיקרופון ואפקטי Mic FX.",
    loop: "תמונת Google Play: לופר עם 8 עמודים, צבע ושם לכל עמוד, 4 ערוצים בעמוד.",
    pad: "תמונת Google Play: ה-Pad עם Wah, Octave ו-Vibrato.",
    drum: "תמונת Google Play: מכונת תופים ב-16 צעדים עם ערכות ו-BPM.",
  },
  en: {
    sound: "Google Play shot: Layer Waveforms, stack Sine, Saw and more and play them together.",
    mic: "Google Play shot: mic channels and Mic FX.",
    loop: "Google Play shot: looper with 8 pages, colour-coded and named, 4 channels per page.",
    pad: "Google Play shot: the Pad with Wah, Octave and Vibrato.",
    drum: "Google Play shot: 16-step drum machine with kits and BPM.",
  },
  ru: {
    sound: "Скриншот Google Play: Layer Waveforms, несколько волн вместе, например Sine и Saw, звучат сразу.",
    mic: "Скриншот Google Play: каналы микрофона и Mic FX.",
    loop: "Скриншот Google Play: лупер с 8 страницами, у страниц цвет и имя, 4 канала на странице.",
    pad: "Скриншот Google Play: Pad с Wah, Octave и Vibrato.",
    drum: "Скриншот Google Play: барабанная машина на 16 шагов с наборами и BPM.",
  },
  ar: {
    sound: "لقطة Google Play: Layer Waveforms، عدة موجات معاً مثل Sine وSaw تُعزف في الوقت نفسه.",
    mic: "لقطة Google Play: قنوات الميكروفون ومؤثرات Mic FX.",
    loop: "لقطة Google Play: لوبر بـ 8 صفحات، لكل صفحة لون واسم، و4 قنوات في كل صفحة.",
    pad: "لقطة Google Play: الـ Pad مع Wah وOctave وVibrato.",
    drum: "لقطة Google Play: آلة طبول بـ 16 خطوة مع أطقم وBPM.",
  },
} satisfies Record<Language, Record<PlayId, string>>;

// Small chrome-only labels that are not part of the editable site copy in content.json
// (menu open/close).
const chromeUi = {
  he: { close: "סגירת תפריט", open: "פתיחת תפריט" },
  en: { close: "Close menu", open: "Open menu" },
  ru: { close: "Закрыть меню", open: "Открыть меню" },
  ar: { close: "إغلاق القائمة", open: "فتح القائمة" },
} satisfies Record<Language, { close: string; open: string }>;

const developerAlt = {
  he: "דוד חתם, המפתח של L Studio",
  en: "David Chatam, the developer of L Studio",
  ru: "Давид Хатам, разработчик L Studio",
  ar: "دافيد حاتام، مطوّر L Studio",
} satisfies Record<Language, string>;

const instagramLabel = {
  he: "הצטרפו לקהילה באינסטגרם",
  en: "Join the community on Instagram",
  ru: "Присоединиться к сообществу в Instagram",
  ar: "انضم إلى المجتمع على Instagram",
} satisfies Record<Language, string>;

const facebookLabel = {
  he: "הצטרפו לקהילה בפייסבוק",
  en: "Join the community on Facebook",
  ru: "Присоединиться к сообществу в Facebook",
  ar: "انضم إلى المجتمع على Facebook",
} satisfies Record<Language, string>;

const flowLabels = {
  he: ["פותחים", "נוגעים", "מקשיבים", "יוצרים"],
  en: ["OPEN", "TOUCH", "LISTEN", "CREATE"],
  ru: ["ОТКРЫТЬ", "КОСНУТЬСЯ", "СЛУШАТЬ", "СОЗДАВАТЬ"],
  ar: ["افتح", "المس", "استمع", "أنشئ"],
} satisfies Record<Language, string[]>;

const featureData = {
  he: [
    { id: "sound", label: "SOUND", title: "תכנת את הקלידים בדרך שלך.", description: "אפשר לקבוע ידנית את התדר של כל קליד ולבנות את המקלדת בדרך שמתאימה לך. בנוסף יש לך שליטה על דברים כמו Attack, Release, Decay, Volume, Glide, Cutoff ו-Resonance. לא צריך להבין הכול לפני שמתחילים. אפשר פשוט להתחיל לשחק.", icon: SlidersHorizontal, meta: "SOUND / KEYS" },
    { id: "mic", label: "MIC", title: "תכניס את הקול שלך פנימה.", description: "קול, כלי נגינה או כל דבר אחר שאתה רוצה להקליט. המיקרופון נמצא בתוך האפליקציה, כך שלא צריך לעבור לאפליקציה אחרת בשביל להמשיך ליצור.", icon: Mic2, meta: "MIC / RECORD" },
    { id: "loop", label: "LOOP", title: "יש רעיון? אל תיתן לו לברוח.", description: "הלופר מאפשר להקליט שכבות ולבנות מהן קטע. מתחילים ממשהו קטן, מוסיפים עוד משהו ורואים לאן זה הולך.", icon: Disc3, meta: "LOOP / LAYERS / WAV" },
    { id: "pad", label: "PAD", title: "לשחק עם הסאונד בזמן אמת.", description: "ה-Pad מאפשר לשלוט בסאונד בזמן שאתה מנגן. לא רק לכוון את הסאונד לפני הנגינה, אלא לשחק איתו תוך כדי.", icon: SlidersHorizontal, meta: "PAD / PLAY LIVE" },
    { id: "drum", label: "DRUM", title: "התופים שלך. החוקים שלך.", description: "אפשר לעבוד עם סאמפלים, לבנות מקצבים, לקבוע איך הם יחזרו ולהפעיל אותם גם בזמן אמת.", icon: Drum, meta: "DRUM / BEATS / BPM" },
  ],
  en: [
    { id: "sound", label: "SOUND", title: "Program the keys your way.", description: "Manually set the frequency of every key and build your keyboard the way that suits you. You also get control over things like Attack, Release, Decay, Volume, Glide, Cutoff and Resonance. You don't need to understand it all before you start. You can just start playing.", icon: SlidersHorizontal, meta: "SOUND / KEYS" },
    { id: "mic", label: "MIC", title: "Bring your voice in.", description: "Your voice, an instrument, or anything else you want to record. The microphone lives inside the app, so you never have to switch apps to keep creating.", icon: Mic2, meta: "MIC / RECORD" },
    { id: "loop", label: "LOOP", title: "Got an idea? Don't let it get away.", description: "The looper lets you record layers and build a piece from them. Start with something small, add another layer, and see where it goes.", icon: Disc3, meta: "LOOP / LAYERS / WAV" },
    { id: "pad", label: "PAD", title: "Play with the sound in real time.", description: "The Pad lets you control the sound while you're playing. Not just shape it before you play, but play with it as you go.", icon: SlidersHorizontal, meta: "PAD / PLAY LIVE" },
    { id: "drum", label: "DRUM", title: "Your drums. Your rules.", description: "Work with samples, build rhythms, set how they repeat, and trigger them live too.", icon: Drum, meta: "DRUM / BEATS / BPM" },
  ],
  ru: [
    { id: "sound", label: "SOUND", title: "Настрой клавиши по-своему.", description: "Вручную задавай частоту каждой клавиши и строй клавиатуру так, как удобно тебе. Также есть контроль над Attack, Release, Decay, Volume, Glide, Cutoff и Resonance. Не нужно понимать всё сразу, можно просто начать играть.", icon: SlidersHorizontal, meta: "SOUND / KEYS" },
    { id: "mic", label: "MIC", title: "Впусти свой голос.", description: "Голос, инструмент или что угодно ещё, что хочешь записать. Микрофон живёт внутри приложения, так что не нужно переключаться в другое приложение, чтобы продолжать творить.", icon: Mic2, meta: "MIC / RECORD" },
    { id: "loop", label: "LOOP", title: "Есть идея? Не дай ей уйти.", description: "Лупер позволяет записывать слои и строить из них трек. Начинаешь с малого, добавляешь ещё, и смотришь, куда это приведёт.", icon: Disc3, meta: "LOOP / LAYERS / WAV" },
    { id: "pad", label: "PAD", title: "Играй со звуком в реальном времени.", description: "Pad позволяет управлять звуком прямо во время игры. Не только настроить звук заранее, а играть с ним на ходу.", icon: SlidersHorizontal, meta: "PAD / PLAY LIVE" },
    { id: "drum", label: "DRUM", title: "Твои барабаны. Твои правила.", description: "Работай с семплами, строй ритмы, задавай, как они повторяются, и запускай их вживую.", icon: Drum, meta: "DRUM / BEATS / BPM" },
  ],
  ar: [
    { id: "sound", label: "SOUND", title: "برمج المفاتيح بطريقتك.", description: "اضبط تردد كل مفتاح يدوياً وابنِ لوحة المفاتيح بالطريقة التي تناسبك. لديك أيضاً تحكم في أشياء مثل Attack وRelease وDecay وVolume وGlide وCutoff وResonance. لا تحتاج لفهم كل شيء قبل أن تبدأ. يمكنك فقط البدء باللعب.", icon: SlidersHorizontal, meta: "SOUND / KEYS" },
    { id: "mic", label: "MIC", title: "أدخل صوتك إلى الداخل.", description: "صوتك، آلة موسيقية، أو أي شيء آخر تريد تسجيله. الميكروفون موجود داخل التطبيق، لذا لا تحتاج للانتقال إلى تطبيق آخر لمواصلة الإبداع.", icon: Mic2, meta: "MIC / RECORD" },
    { id: "loop", label: "LOOP", title: "لديك فكرة؟ لا تدعها تفلت.", description: "يتيح لك اللوبر تسجيل طبقات وبناء مقطع منها. تبدأ بشيء صغير، تضيف شيئاً آخر، وترى إلى أين يأخذك ذلك.", icon: Disc3, meta: "LOOP / LAYERS / WAV" },
    { id: "pad", label: "PAD", title: "العب بالصوت في الوقت الفعلي.", description: "يتيح لك الـPad التحكم بالصوت أثناء العزف. ليس فقط ضبط الصوت قبل العزف، بل اللعب به أثناء العزف.", icon: SlidersHorizontal, meta: "PAD / PLAY LIVE" },
    { id: "drum", label: "DRUM", title: "إيقاعاتك. قواعدك.", description: "اعمل مع العينات، ابنِ إيقاعات، حدد كيفية تكرارها، وشغّلها أيضاً في الوقت الفعلي.", icon: Drum, meta: "DRUM / BEATS / BPM" },
  ],
} satisfies Record<Language, Array<{ id: PlayId; label: string; title: string; description: string; icon: typeof SlidersHorizontal; meta: string }>>;

// Fallback copy, used only if content.json fails to load.
const navDefault = { features: "What's inside", architecture: "How it works", vision: "Vision", faq: "FAQ", guide: "User guide", privacy: "Privacy", terms: "Terms", pro: "Pro", cta: "Meet L-Studio", exclusive: "Exclusive", updates: "Updates" };
const heroDefault = { kicker: "Android music app · Version 1.09", title: "Make music on your phone.", body: "L Studio is a music-making app for your Android phone. Record loops, add drums, sing with the lyrics in front of you, and if you want to go beyond the usual notes, tune every key to its own frequency.", ctaPrimary: "Watch the short", ctaSecondary: "How it started", stat1: "60.6 MB", stat2: "Android 7.0+", stat3: "No ads" };
const launchDefaults: Record<Language, { headline: string; price: string; note: string }> = {
  he: {headline: "מגיע ל-Google Play באוקטובר 2026.", price: "L Studio Pro, 8$.", note: "מגיע ל-Google Play באוקטובר 2026. L Studio Pro, 8$."},
  en: {headline: "Coming to Google Play in October 2026.", price: "L Studio Pro, $8.", note: "Coming to Google Play in October 2026. L Studio Pro, $8."},
  ru: {headline: "Выходит в Google Play в октябре 2026.", price: "L Studio Pro, $8.", note: "Выходит в Google Play в октябре 2026. L Studio Pro, $8."},
  ar: {headline: "قادم إلى Google Play في أكتوبر 2026.", price: "L Studio Pro، 8$.", note: "قادم إلى Google Play في أكتوبر 2026. L Studio Pro، 8$."},
};
const signalDefault = { text: "From key to sound to loop to recording", note: "All inside L-Studio" };
const INTRO_SHORT_ID = "a2CGFDQkZ80";
const meetDefaults = {
  he: {
    kicker: "L-STUDIO / היכרות",
    title: "הכירו את L-studio",
    body: "פתחו את הסרטון הקצר והכירו את האפליקציה.",
    videoTitle: "היכרות עם L-studio",
  },
  en: {
    kicker: "L-STUDIO / INTRO",
    title: "Meet L-studio",
    body: "Open the short and meet the app.",
    videoTitle: "Meet L-studio intro",
  },
  ru: {
    kicker: "L-STUDIO / ЗНАКОМСТВО",
    title: "Знакомьтесь: L-studio",
    body: "Откройте короткое видео и познакомьтесь с приложением.",
    videoTitle: "Знакомство с L-studio",
  },
  ar: {
    kicker: "L-STUDIO / مقدمة",
    title: "تعرّف على L-studio",
    body: "افتحوا الفيديو القصير وتعرّفوا على التطبيق.",
    videoTitle: "تعرّف على L-studio",
  },
} satisfies Record<Language, { kicker: string; title: string; body: string; videoTitle: string }>;
const storyDefault = { kicker: "01 / THE EIGHTH NOTE", title: "It all started with a note that wasn't there.", body: ["I wanted to build a keyboard where I could set which frequency belongs to each key myself.", "From there it grew into recording, a looper, drums, a microphone and more."], closing: "What started as a search for the eighth note became L-Studio." };
const featuresIntroDefault = { kicker: "02 / PLAY WITH SOUND", title: "Just open it and play.", body: "You don't need to know music to start. Open it, touch it, change it, listen, and see what happens." };
const hoodDefault = { kicker: "03 / UNDER THE HOOD", title: "There's a lot going on behind the scenes.", body: "A local signal path for sound, performance and capture.", closing: "The complexity lives in the engine. Not in the way you have to use it.", details: [] as Array<{ label: string; value: string }>, pipeline: ["KEYS", "SOUND", "FX", "WAV"], specsTitle: "Technical signal map", specsBody: "A practical view of what happens between touch and sound." };
const justStartDefault = { kicker: "04 / JUST START", title: "There's a lot to do. You don't need to know it all.", body: ["L-Studio was built differently. There's a lot here, but you can start without taking a course."], closing: "Start playing. The rest will come." };
const factoryDefault = { kicker: "L-STUDIO / FACTORY PACK", lede: "The sound is already waiting for you.", shortText: "8 preset pages. 8 drum kits. Ready to play.", description: "L Studio Pro comes with the full Factory Pack: 8 synth preset pages (64 voices), then 8 drum kits with 8 styles in each kit (64 styles in all, not 64 kits).", detailCta: "Explore Factory 64", drumsCta: "Drum kits", coverAlt: "L Studio Pro pack covers side by side: Factory 64 with 64 presets on 8 pages, Drum Kits with 8 kits and 8 styles, and Exclusive with 11 drum packs" };
const exclusiveFan = {
  jpg: `${import.meta.env.BASE_URL}assets/exclusive/exclusive-hero-homepage-fan.jpg`,
  webp: `${import.meta.env.BASE_URL}assets/exclusive/exclusive-hero-homepage-fan.webp`,
  webp960: `${import.meta.env.BASE_URL}assets/exclusive/exclusive-hero-homepage-fan-960.webp`,
};
const exclusiveDefaults: Record<Language, { navLabel: string; comingSoon: string; homeKicker: string; homeTitle: string; homeBody: string; homeCta: string; homeImageAlt: string }> = {
  he: { navLabel: "בלעדי", comingSoon: "כלול ב-Pro", homeKicker: "L-STUDIO / EXCLUSIVE", homeTitle: "אחת עשרה חבילות מיוחדות. כלול ב-Pro.", homeBody: "אחת עשרה חבילות תופים בלעדיות יושבות מחוץ לערכות Factory Drums. שמונה ערוצים ושמונה סגנונות בכל חבילה. מי שקונה Pro מקבל גם את חבילת Exclusive בחינם, בלי עלות נוספת, ואין כפתור הורדה.", homeCta: "לעמוד הבלעדי", homeImageAlt: "מניפה של תשע כרזות לחבילות תופים בלעדיות של L Studio" },
  en: { navLabel: "Exclusive", comingSoon: "Included with Pro", homeKicker: "L-STUDIO / EXCLUSIVE", homeTitle: "Eleven special packs. Included with Pro.", homeBody: "Eleven Exclusive drum packs sit outside the Factory Drums set. Eight channels and eight styles in each pack. Whoever buys Pro also gets the Exclusive pack free, at no extra cost, and there is no download button.", homeCta: "See Exclusive", homeImageAlt: "Fan of nine L Studio Exclusive drum pack posters" },
  ru: { navLabel: "Эксклюзив", comingSoon: "Входит в Pro", homeKicker: "L-STUDIO / EXCLUSIVE", homeTitle: "Одиннадцать особых паков. Входит в Pro.", homeBody: "Одиннадцать эксклюзивных ударных паков стоят вне набора Factory Drums. Восемь каналов и восемь стилей в каждом паке. Кто покупает Pro, получает пак Exclusive бесплатно, без доплаты, и кнопки скачивания нет.", homeCta: "Смотреть эксклюзив", homeImageAlt: "Веер из девяти постеров эксклюзивных ударных паков L Studio" },
  ar: { navLabel: "حصري", comingSoon: "مع Pro", homeKicker: "L-STUDIO / EXCLUSIVE", homeTitle: "إحدى عشرة حزمة خاصة. مع Pro.", homeBody: "إحدى عشرة حزمة طبول حصرية خارج مجموعة Factory Drums. ثماني قنوات وثمانية أساليب في كل حزمة. من يشتري Pro يحصل أيضاً على حزمة Exclusive مجاناً، بلا تكلفة إضافية، ولا يوجد زر تنزيل.", homeCta: "شاهد الحصري", homeImageAlt: "مروحة من تسعة ملصقات لحزم طبول حصرية من L Studio" },
};
const visionDefault = { kicker: "05 / THE VISION", title: "I built the app I needed.", author: "David Chatam, L-Studio developer", body: ["I just love music and wanted to control sound in a way that felt natural to me."], mainLine: "It's for analog people in a digital world.", cards: [{ no: "01", title: "Just start", body: "Open the app and start creating." }, { no: "02", title: "Play with sound", body: "Touch the sound, change it, and discover things you didn't plan." }, { no: "03", title: "Take your music with you", body: "Creating shouldn't have to wait for a computer." }] };
const faqDefault = { kicker: "06 / FAQ", title: "Questions and answers", items: [] as Array<{ question: string; answer: string[] }> };
const finalCtaDefault = { kicker: "07 / YOUR SOUND", title: "Maybe it's time to find your sound.", body: "You can start from one sound, a beat, a loop, or a small idea." };
type TesterCopy = {
  kicker: string;
  title: string;
  body: string;
  status: string;
  spotsLabel: string;
  spotsStatus: string;
  imageAlt: string;
  freeAccess: string;
  localAudio: string;
};

const testerDefaults = {
  he: {
    kicker: "EARLY ACCESS",
    title: "ההרשמה לבודקים נסגרה.",
    body: "כל 44 המקומות נתפסו. תודה לכל מי שהצטרף לבדיקה ב-Google Play. אחרי הבדיקה, L Studio Pro מגיע ל-Google Play באוקטובר 2026, ב-8$.",
    status: "ההרשמה לבודקים נסגרה. כל 44 המקומות נתפסו.",
    spotsLabel: "נתפסו",
    spotsStatus: "ההרשמה נסגרה",
    imageAlt: "קופסת L Studio Factory Pack שחורה עם הכיתוב GET THE PACK והמילים Small instrument. A lot of sound.",
    freeAccess: "ההרשמה נסגרה",
    localAudio: "אודיו מקומי",
  },
  en: {
    kicker: "EARLY ACCESS",
    title: "Tester signup is closed.",
    body: "All 44 spots are taken. Thank you to everyone who joined the Google Play test. After the test, L Studio Pro comes to Google Play in October 2026, for $8.",
    status: "Tester signup is closed. All 44 spots are taken.",
    spotsLabel: "taken",
    spotsStatus: "Signup closed",
    imageAlt: "Black L Studio Factory Pack box with the words GET THE PACK and Small instrument. A lot of sound.",
    freeAccess: "SIGNUP CLOSED",
    localAudio: "LOCAL AUDIO",
  },
  ru: {
    kicker: "РАННИЙ ДОСТУП",
    title: "Запись в тестеры закрыта.",
    body: "Все 44 места заняты. Спасибо всем, кто присоединился к тесту в Google Play. После теста L Studio Pro выйдет в Google Play в октябре 2026, за $8.",
    status: "Запись в тестеры закрыта. Все 44 места заняты.",
    spotsLabel: "занято",
    spotsStatus: "Запись закрыта",
    imageAlt: "Чёрная коробка L Studio Factory Pack с надписью GET THE PACK и словами Small instrument. A lot of sound.",
    freeAccess: "ЗАПИСЬ ЗАКРЫТА",
    localAudio: "ЛОКАЛЬНЫЙ ЗВУК",
  },
  ar: {
    kicker: "وصول مبكر",
    title: "التسجيل للمختبرين مغلق.",
    body: "جميع الأماكن الـ44 محجوزة. شكراً لكل من انضم إلى الاختبار على Google Play. بعد الاختبار، يصل L Studio Pro إلى Google Play في أكتوبر 2026، بسعر 8$.",
    status: "التسجيل للمختبرين مغلق. جميع الأماكن الـ44 محجوزة.",
    spotsLabel: "محجوزة",
    spotsStatus: "التسجيل مغلق",
    imageAlt: "صندوق L Studio Factory Pack أسود مع عبارة GET THE PACK والكلمات Small instrument. A lot of sound.",
    freeAccess: "التسجيل مغلق",
    localAudio: "صوت محلي",
  },
} satisfies Record<Language, TesterCopy>;
const footerDefault = { tagline: "It's for analog people in a digital world." };

const visionIcons = [Sparkles, Music2, ArrowDownLeft];


function FeatureMedia({ id, alt }: { id: PlayId; alt: string }) {
  return (
    <picture>
      <source srcSet={playShotUrl(id, "webp")} type="image/webp" />
      <img className="preview-media" src={playShotUrl(id, "jpg")} alt={alt} width={720} height={1280} loading="lazy" decoding="async" />
    </picture>
  );
}

// Renders a headline as "lead words" + a line break + the last word in the accent color,
// matching the site's existing typographic style (see h1 em / h2 em in index.css).

/** Published Early Access meters (hero ribbon and form). Edit content.json; do not use the signup API. */
const MANUAL_SPOTS = { available: 0, total: 44 };

function readSpotCount(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN;
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 100_000) return fallback;
  return parsed;
}

function manualEarlyAccessSpots(raw: unknown): { available: number; total: number } {
  const source = raw && typeof raw === "object" ? (raw as { spotsAvailable?: unknown; spotsTotal?: unknown }) : {};
  return {
    available: readSpotCount(source.spotsAvailable, MANUAL_SPOTS.available),
    total: readSpotCount(source.spotsTotal, MANUAL_SPOTS.total),
  };
}

function EarlyAccessMeter({ available, total, label }: { available: number; total: number; label: string }) {
  const taken = Math.max(0, Math.min(total, total - available));
  const width = total > 0 ? (taken / total) * 100 : 0;
  return (
    <div className="tester-meter" dir="ltr">
      <p className="tester-spots">
        <span className="tester-spots__count">{taken}/{total}</span>{" "}
        <span className="tester-spots__label">{label}</span>
      </p>
      <div className="tester-spots__track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function HeroSpotsRibbon({
  available,
  total,
  label,
  status,
  kicker,
}: {
  available: number;
  total: number;
  label: string;
  status: string;
  kicker: string;
}) {
  const taken = Math.max(0, Math.min(total, total - available));
  const ratio = total > 0 ? taken / total : 0;
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * ratio;
  return (
    <div className="spots-ribbon">
      <div className="spots-ribbon__link spots-ribbon__link--static container">
        <span className="spots-ribbon__kicker">{kicker}</span>
        <span
          className="spots-ribbon__meter"
          role="meter"
          aria-valuenow={taken}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuetext={`${taken}/${total} ${label}`}
        >
          <svg className="spots-ribbon__ring" viewBox="0 0 22 22" aria-hidden="true">
            <circle className="spots-ribbon__ring-track" cx="11" cy="11" r={radius} />
            <circle className="spots-ribbon__ring-value" cx="11" cy="11" r={radius} strokeDasharray={`${dash} ${circumference}`} />
          </svg>
          <span className="spots-ribbon__count" dir="ltr">
            <b>{taken}</b>
            <span>/{total}</span>
          </span>
          <span className="spots-ribbon__label">{label}</span>
        </span>
        <span className="spots-ribbon__cta">{status}</span>
      </div>
    </div>
  );
}

function ClosedSignupPanel({
  tester,
  launch,
  spots,
}: {
  tester: TesterCopy;
  launch: { headline: string; price: string };
  spots: { available: number; total: number };
}) {
  return (
    <div className="tester-form tester-form--closed">
      <EarlyAccessMeter available={spots.available} total={spots.total} label={tester.spotsLabel} />
      <p className="tester-status" role="status">{tester.status}</p>
      <p className="launch-note"><strong>{launch.headline}</strong> <span>{launch.price}</span></p>
    </div>
  );
}

function Headline({ text }: { text: string }) {
  const words = text.trim().split(" ").filter(Boolean);
  if (words.length < 2) return <em>{text}</em>;
  const lead = words.slice(0, -1).join(" ");
  const tail = words[words.length - 1];
  return (
    <>
      {lead}
      {" "}<em>{tail}</em>
    </>
  );
}

export default function Home() {
  const { language, isRtl } = useLanguage();
  const [editableContent, setEditableContent] = useState<any>(null);
  useEffect(() => {
    fetchSiteContent()
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setEditableContent(data);
      })
      .catch(() => undefined);
  }, []);

  const copy = editableContent?.languages?.[language] ?? {};
  const nav = copy.nav ?? navDefault;
  const hero = { ...heroDefault, ...(copy.hero ?? {}) };
  const launch = { ...launchDefaults[language], ...(copy.launch ?? {}) };
  const meet = { ...meetDefaults[language], ...(copy.meet ?? {}) };
  const signal = copy.signalStrip ?? signalDefault;
  const story = copy.story ?? storyDefault;
  const featuresIntro = copy.featuresIntro ?? featuresIntroDefault;
  const hood = copy.underHood ?? hoodDefault;
  const justStart = copy.justStart ?? justStartDefault;
  const factory = copy.factoryPack ?? factoryDefault;
  const exclusive = { ...exclusiveDefaults[language], ...(copy.exclusive ?? {}) };
  const updates = mergeUpdates(language, copy.updates);
  const vision = copy.vision ?? visionDefault;
  const faq = copy.faq ?? faqDefault;
  const finalCta = copy.finalCta ?? finalCtaDefault;
  const tester: TesterCopy = { ...testerDefaults[language], ...(copy.tester ?? {}) };
  const spots = manualEarlyAccessSpots(editableContent?.earlyAccess);
  const footer = copy.footer ?? footerDefault;
  const chrome = chromeUi[language];

  const features = featureData[language];
  const [mobileOpen, setMobileOpen] = useState(false);
  // First feature open so a real screenshot shows without a click.
  const [activeFeature, setActiveFeature] = useState("sound");
  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div className="site-shell" dir={dir}>
      <div className="noise" aria-hidden="true" />
      <header className={`site-header${mobileOpen ? " site-header--open" : ""}`}>
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={nav.features}>
            <a href="#features">{nav.features}</a>
            <a href="#architecture">{nav.architecture}</a>
            <a href="#vision">{nav.vision}</a>
            <a href="#faq">{nav.faq}</a>
            <Link href="/guide">{nav.guide ?? "User guide"}</Link>
            <Link href="/privacy">{nav.privacy}</Link>
            <Link href="/terms">{nav.terms ?? "Terms"}</Link>
            <Link href="/updates">{nav.updates ?? updates.navLabel ?? updatesNavLabel[language]}</Link>
            <Link className="nav-exclusive" href="/exclusive">{nav.exclusive ?? exclusiveNavLabel[language]}</Link>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            {SHOW_MEET_VIDEO && <a className="button button--small button--light" href="#meet"><span>{nav.cta}</span><ArrowUpRight size={15} /></a>}
            <button className="menu-toggle" type="button" aria-label={mobileOpen ? chrome.close : chrome.open} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mobile-nav" aria-label={nav.features}>
            <LanguageSwitcher />
            {SHOW_MEET_VIDEO && <a href="#meet" onClick={() => setMobileOpen(false)}>{nav.cta}</a>}
            <a href="#features" onClick={() => setMobileOpen(false)}>{nav.features}</a>
            <a href="#architecture" onClick={() => setMobileOpen(false)}>{nav.architecture}</a>
            <a href="#vision" onClick={() => setMobileOpen(false)}>{nav.vision}</a>
            <a href="#faq" onClick={() => setMobileOpen(false)}>{nav.faq}</a>
            <Link href="/guide" onClick={() => setMobileOpen(false)}>{nav.guide ?? "User guide"}</Link>
            <Link href="/privacy" onClick={() => setMobileOpen(false)}>{nav.privacy}</Link>
            <Link href="/terms" onClick={() => setMobileOpen(false)}>{nav.terms ?? "Terms"}</Link>
            <Link href="/updates" onClick={() => setMobileOpen(false)}>{nav.updates ?? updates.navLabel ?? updatesNavLabel[language]}</Link>
            <Link className="nav-exclusive" href="/exclusive" onClick={() => setMobileOpen(false)}>{nav.exclusive ?? exclusiveNavLabel[language]}</Link>
          </nav>
        )}
      </header>

      <HeroSpotsRibbon
        available={spots.available}
        total={spots.total}
        label={tester.spotsLabel}
        status={tester.spotsStatus}
        kicker={tester.kicker}
      />

      <UpdatesTicker copy={updates} isRtl={isRtl} />

      {/* Feature graphic under the ticker (David, 2026-10-10). Image used as is. */}
      <div className="container feature-graphic-wrap">
      <figure className="feature-graphic">
        <picture>
          <source srcSet={`${featureGraphic.webp800} 800w, ${featureGraphic.webp1024} 1024w`} sizes="(max-width: 1024px) 100vw, 1024px" type="image/webp" />
          <img src={featureGraphic.jpg} alt={featureGraphicAlt[language]} width={1024} height={500} loading="eager" decoding="async" />
        </picture>
      </figure>
      </div>

      <main>
        {/* 1. Hero */}
        <section className={`hero container${SHOW_HERO_SHOT ? "" : " hero--solo"}`} aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> {hero.kicker}</div>
            <h1 id="hero-title"><Headline text={hero.title} /></h1>
            <div className="hero-offer hero-offer--static">
              <strong>{launch.headline}</strong>
              <span>{launch.price} {tester.status}</span>
            </div>
            <p className="hero-lede">{hero.body}</p>
            <div className="hero-actions">
              {SHOW_MEET_VIDEO && <a className="button button--primary" href="#meet">{hero.ctaPrimary} <ArrowUpRight size={17} /></a>}
              <a className="text-link" href="#story">{hero.ctaSecondary} <ChevronRight size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><b>{hero.stat1}</b></span>
              <span><b>{hero.stat2}</b></span>
              <span><b>{hero.stat3}</b></span>
            </div>
          </div>
          {SHOW_HERO_SHOT && <figure className="hero-shot">
            <picture>
              <source srcSet={`${heroShot.webp420} 420w, ${heroShot.webp720} 720w`} sizes="(max-width: 1000px) min(78vw, 340px), 360px" type="image/webp" />
              <img src={heroShot.jpg720} alt={heroShotAlt[language]} width={720} height={1478} fetchPriority="high" decoding="async" />
            </picture>
          </figure>}
        </section>

        {SHOW_MEET_VIDEO && <section className="meet-section container" id="meet" dir={dir} aria-labelledby="meet-title">
          <div className="meet-copy">
            <span className="kicker">{meet.kicker}</span>
            <h2 id="meet-title"><Headline text={meet.title} /></h2>
            <p>{meet.body}</p>
          </div>
          <div className="meet-short">
            <YouTubeFacade videoId={INTRO_SHORT_ID} title={meet.videoTitle} poster={meetPoster} />
          </div>
        </section>}

        {/* Signal strip: hero → story bridge */}
        <div className="signal-strip"><div className="container signal-inner"><b>{signal.text}</b><span className="strip-note">{signal.note}</span></div></div>

        {/* 2. The story of L-Studio */}
        <section className="story-section container" id="story" dir={dir}>
          <div className="editorial-copy">
            <span className="kicker">{story.kicker}</span>
            <h2><Headline text={story.title} /></h2>
            <div className="story-body">{story.body.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div>
            <p className="lead-line">{story.closing}</p>
          </div>
          <WaveScope />
        </section>

        {/* 3. Product capabilities: SOUND / MIC / LOOP / PAD / DRUM */}
        <section className="interface-section container" id="features">
          <div className="section-heading">
            <div><span className="kicker">{featuresIntro.kicker}</span><h2><Headline text={featuresIntro.title} /></h2></div>
            <p>{featuresIntro.body}</p>
          </div>
          <div className="interface-grid">
            <div className="interface-feature-list">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === feature.id;
                return (
                  <div className={`interface-feature-item ${isActive ? "is-active" : ""}`} key={feature.id}>
                    <button
                      type="button"
                      aria-expanded={isActive}
                      aria-pressed={isActive}
                      aria-controls={`feature-panel-${feature.id}`}
                      className="interface-feature"
                      onClick={() => setActiveFeature((current) => current === feature.id ? "" : feature.id)}
                    >
                      <span className="feature-index">0{index + 1}</span>
                      <span className="feature-icon"><Icon size={20} /></span>
                      <span className="feature-label">{feature.label}</span>
                      <ChevronRight size={16} />
                    </button>
                    {isActive && (
                      <div className="interface-preview" id={`feature-panel-${feature.id}`}>
                        <div className="preview-image-wrap">
                          <FeatureMedia id={feature.id as PlayId} alt={playShotAlt[language][feature.id as PlayId]} />
                        </div>
                        <div className="preview-copy">
                          <span className="kicker">{feature.meta}</span>
                          <h3>{feature.title}</h3>
                          <p>{feature.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. How the engine works */}
        <section className="architecture-section" id="architecture" dir={dir}>
          <div className="container architecture-grid">
            <div className="architecture-copy">
              <div className="architecture-brand"><SiteLogo compact /></div>
              <span className="kicker">{hood.kicker}</span>
              <h2><Headline text={hood.title} /></h2>
              <p>{hood.body}</p>
              <p className="lead-line">{hood.closing}</p>
              <div className="pipeline">{hood.pipeline.map((item: string, index: number) => <span key={item}>{index > 0 && <i>→</i>}{item}</span>)}</div>
              <div className="engine-specs">
                <div className="engine-specs-heading"><span>{hood.specsTitle}</span><small>{hood.specsBody}</small></div>
                <div className="engine-spec-grid">{hood.details.map((detail: { label: string; value: string }) => <div className="engine-spec" key={detail.label}><span>{detail.label}</span><p>{detail.value}</p></div>)}</div>
              </div>
            </div>
            <div className="architecture-art">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="architecture-core"><AudioWaveform size={42} /><span>REAL-TIME</span><b>{tester.localAudio}</b><small>ANDROID 7.0+</small></div>
            </div>
          </div>
        </section>

        {/* 5. Why it doesn't feel scary */}
        <section className="notscary-section container" id="just-start" dir={dir}>
          <div className="editorial-copy">
            <span className="kicker">{justStart.kicker}</span>
            <h2><Headline text={justStart.title} /></h2>
            <div className="story-body">{justStart.body.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div>
            <p className="lead-line">{justStart.closing}</p>
          </div>
          <div className="start-flow" aria-label={flowLabels[language].join(" → ")}>
            <div className="start-flow-line"><span className="start-flow-pulse" /></div>
            <div className="start-flow-steps">{flowLabels[language].map((label, index) => <span key={label}><i>0{index + 1}</i><b>{label}</b></span>)}</div>
          </div>
        </section>

        {/* 6. Factory Pack */}
        <section className="factory-pack-section container" id="factory-pack" dir={dir}>
          <div className="factory-pack-content">
            <span className="kicker">{factory.kicker}</span>
            <div className="factory-pack-cover">
              <picture>
                <source srcSet={`${factoryBoxWebp800} 800w, ${factoryBoxWebp} 1120w`} sizes="(max-width: 600px) calc(100vw - 40px), 560px" type="image/webp" />
                <img src={factoryBoxJpg} alt={factory.coverAlt ?? "L Studio Pro pack covers side by side: Factory 64 with 64 presets on 8 pages, Drum Kits with 8 kits and 8 styles, and Exclusive with 11 drum packs"} width={1120} height={740} loading="lazy" decoding="async" />
              </picture>
            </div>
            <p className="factory-pack-lede">{factory.lede}</p>
            <p>{factory.shortText}</p>
            <p>{factory.description}</p>
            <div className="factory-scales"><span>222</span><span>299</span><span>333</span><span>355</span><span>396</span><span>444</span><span>463</span><span>477 Hz</span></div>
            <div className="factory-pack-actions">
              <Link className="button button--primary" href="/factory-64">{factory.detailCta ?? "Explore Factory 64"} <ArrowUpRight size={17} /></Link>
              <Link className="button button--light" href="/factory-64/drums">{factory.drumsCta ?? "Drum kits"} <ArrowUpRight size={17} /></Link>
            </div>
          </div>
        </section>

        <section className="exclusive-home container" id="exclusive" dir={dir} aria-labelledby="exclusive-title">
          <div className="exclusive-home-head">
            <div className="exclusive-home-copy">
              <span className="kicker">{exclusive.homeKicker}</span>
              <h2 id="exclusive-title"><Headline text={exclusive.homeTitle} /></h2>
              <p>{exclusive.homeBody}</p>
            </div>
            <div className="exclusive-home-actions">
              <span className="exclusive-status" role="status">{exclusive.comingSoon}</span>
              <Link className="button button--primary" href="/exclusive">{exclusive.homeCta} <ArrowUpRight size={17} /></Link>
            </div>
          </div>
          <Link className="exclusive-home-fan" href="/exclusive">
            <picture>
              <source srcSet={`${exclusiveFan.webp960} 960w, ${exclusiveFan.webp} 1920w`} sizes="(max-width: 1240px) calc(100vw - 40px), 1200px" type="image/webp" />
              <img src={exclusiveFan.jpg} alt={exclusive.homeImageAlt ?? exclusiveDefaults[language].homeImageAlt} width={1920} height={1080} loading="lazy" decoding="async" />
            </picture>
          </Link>
        </section>

        {/* 7. The vision */}
        <section className="vision-section" id="vision" dir={dir}>
          <div className="container vision-grid">
            <div className="vision-copy">
              <div className="vision-portrait"><picture><source srcSet={developerImage.webp} type="image/webp" /><img src={developerImage.jpg} alt={developerAlt[language]} loading="lazy" decoding="async" /></picture></div>
              <span className="kicker">{vision.kicker}</span>
              <h2><Headline text={vision.title} /></h2>
              <span className="vision-author">{vision.author}</span>
              {vision.body.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
              <p className="lead-line">{vision.mainLine}</p>
              <div className="social-links">
                <a className="instagram-link" href="https://www.instagram.com/lstudio.app?stkn=MTJ2Ym1vdHBpMTA5Nw==" target="_blank" rel="noreferrer"><Instagram size={17} /> {instagramLabel[language]} <ArrowUpRight size={15} /></a>
                <a className="instagram-link" href="https://www.facebook.com/share/1C6rrsvgem/" target="_blank" rel="noreferrer"><Facebook size={17} /> {facebookLabel[language]} <ArrowUpRight size={15} /></a>
              </div>
            </div>
            <div className="vision-cards">
              {vision.cards.map((card: { no: string; title: string; body: string }, index: number) => {
                const Icon = visionIcons[index] ?? Sparkles;
                return (
                  <div className="vision-card" key={card.no}>
                    <span className="vision-card-no">{card.no}</span>
                    <Icon size={21} />
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* 7b. FAQ */}
        <section className="faq-section container" id="faq" dir={dir}>
          <div className="faq-heading">
            <span className="kicker">{faq.kicker}</span>
            <h2><Headline text={faq.title} /></h2>
          </div>
          <Accordion type="single" collapsible className="faq-accordion">
            {(faq.items ?? []).map((item: { question: string; answer: string[] }, index: number) => (
              <AccordionItem className="faq-item" value={`faq-${index}`} key={`faq-${index}`}>
                <AccordionTrigger className="faq-trigger">{item.question}</AccordionTrigger>
                <AccordionContent className="faq-answer">
                  {(item.answer ?? []).map((paragraph: string, pIndex: number) => (
                    <p key={pIndex}>{paragraph}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* 8. Early Access (closed) */}
        <section className="tester-section container" id="early-access">
          <div className="tester-panel">
            <figure className="tester-hero">
              <picture>
                <source srcSet={`${factoryHero.webp800} 800w, ${factoryHero.webp1254} 1254w`} sizes="(max-width: 800px) calc(100vw - 40px), 760px" type="image/webp" />
                <img src={factoryHero.jpg800} alt={tester.imageAlt} width={1254} height={1254} loading="lazy" decoding="async" />
              </picture>
            </figure>
            <div className="tester-grid">
            <div className="tester-copy">
              <span className="kicker">{tester.kicker}</span>
              <h2>{tester.title}</h2>
              <p>{tester.body}</p>
              <div className="tester-proof"><span>01</span><span>{tester.freeAccess}</span><span>{tester.localAudio}</span></div>
            </div>
            <ClosedSignupPanel tester={tester} launch={launch} spots={spots} />
            </div>
          </div>
        </section>

        {/* 9. Final CTA */}
        <section className="final-cta container">
          <span className="kicker">{finalCta.kicker}</span>
          <h2><Headline text={finalCta.title} /></h2>
          <p>{finalCta.body}</p>
          <div className="teaser-video"><video controls playsInline preload="metadata" src={`${import.meta.env.BASE_URL}assets/teaser.mp4`} aria-label="L Studio Factory Pack teaser" /></div>
          <p className="launch-note"><strong>{launch.headline}</strong> <span>{launch.price}</span></p>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <SiteLogo compact />
          <div className="footer-links"><a href="#features">{nav.features}</a><a href="#vision">{nav.vision}</a><a href="#faq">{nav.faq}</a><Link href="/guide">{nav.guide ?? "User guide"}</Link><Link href="/updates">{nav.updates ?? updates.navLabel ?? updatesNavLabel[language]}</Link><Link className="nav-exclusive" href="/exclusive">{nav.exclusive ?? exclusiveNavLabel[language]}</Link><Link href="/privacy">{nav.privacy}</Link><Link href="/terms">{nav.terms ?? "Terms"}</Link></div>
          <span className="footer-tagline">{footer.tagline}</span>
          <span className="footer-copy">© 2026 L Studio</span>
        </div>
      </footer>
    </div>
  );
}
