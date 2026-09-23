import { useEffect, useState, type CSSProperties } from "react";
import { ArrowDownLeft, ArrowUpRight, AudioWaveform, ChevronRight, Disc3, Drum, Menu, Mic2, Music2, SlidersHorizontal, Sparkles, X, Instagram } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

const factoryBanner = `${import.meta.env.BASE_URL}assets/Preset.jpg`;
const developerImage = `${import.meta.env.BASE_URL}assets/Developer.jpg`;

const images = {
  pad: `${import.meta.env.BASE_URL}assets/pad.jpg`,
  sound: `${import.meta.env.BASE_URL}assets/sound-window.jpg`,
  mic: `${import.meta.env.BASE_URL}assets/mic-window.jpg`,
  drum: `${import.meta.env.BASE_URL}assets/drum.jpg`,
  loop: `${import.meta.env.BASE_URL}assets/loop.jpg`,
};

// Small chrome-only labels that are not part of the editable site copy in content.json
// (menu open/close, the tiny early-access confirmation line under the tester form).
const chromeUi = {
  he: { close: "סגירת תפריט", open: "פתיחת תפריט" },
  en: { close: "Close menu", open: "Open menu" },
  ru: { close: "Закрыть меню", open: "Открыть меню" },
  ar: { close: "إغلاق القائمة", open: "فتح القائمة" },
} satisfies Record<Language, { close: string; open: string }>;

const instagramLabel = {
  he: "הצטרפו לקהילה באינסטגרם",
  en: "Join the community on Instagram",
  ru: "Присоединиться к сообществу в Instagram",
  ar: "انضم إلى المجتمع على Instagram",
} satisfies Record<Language, string>;

const flowLabels = {
  he: ["פותחים", "נוגעים", "מקשיבים", "יוצרים"],
  en: ["OPEN", "TOUCH", "LISTEN", "CREATE"],
  ru: ["ОТКРЫТЬ", "КОСНУТЬСЯ", "СЛУШАТЬ", "СОЗДАВАТЬ"],
  ar: ["افتح", "المس", "استمع", "أنشئ"],
} satisfies Record<Language, string[]>;

const featureData = {
  he: [
    { id: "sound", label: "SOUND", title: "תכנת את הקלידים בדרך שלך.", description: "אפשר לקבוע ידנית את התדר של כל קליד ולבנות את המקלדת בדרך שמתאימה לך. בנוסף יש לך שליטה על דברים כמו Attack, Release, Decay, Volume, Glide, Cutoff ו-Resonance. לא צריך להבין הכול לפני שמתחילים. אפשר פשוט להתחיל לשחק.", icon: SlidersHorizontal, meta: "SOUND ENGINE / VOICE", image: images.sound },
    { id: "mic", label: "MIC", title: "תכניס את הקול שלך פנימה.", description: "קול, כלי נגינה או כל דבר אחר שאתה רוצה להקליט. המיקרופון נמצא בתוך הסטודיו, כך שלא צריך לעבור לאפליקציה אחרת בשביל להמשיך ליצור.", icon: Mic2, meta: "MIC INPUT / RECORD", image: images.mic },
    { id: "loop", label: "LOOP", title: "יש רעיון? אל תיתן לו לברוח.", description: "הלופר מאפשר להקליט שכבות ולבנות מהן קטע. מתחילים ממשהו קטן, מוסיפים עוד משהו ורואים לאן זה הולך.", icon: Disc3, meta: "MULTI-TRACK / WAV EXPORT", image: images.loop },
    { id: "pad", label: "PAD", title: "לשחק עם הסאונד בזמן אמת.", description: "ה-Pad מאפשר לשלוט בסאונד בזמן שאתה מנגן. לא רק לכוון את הסאונד לפני הנגינה, אלא לשחק איתו תוך כדי.", icon: SlidersHorizontal, meta: "LIVE PERFORMANCE PAD", image: images.pad },
    { id: "drum", label: "DRUM", title: "התופים שלך. החוקים שלך.", description: "אפשר לעבוד עם סאמפלים, לבנות מקצבים, לקבוע איך הם יחזרו ולהפעיל אותם גם בזמן אמת.", icon: Drum, meta: "STEP SEQUENCER / BPM", image: images.drum },
  ],
  en: [
    { id: "sound", label: "SOUND", title: "Program the keys your way.", description: "Manually set the frequency of every key and build your keyboard the way that suits you. You also get control over things like Attack, Release, Decay, Volume, Glide, Cutoff and Resonance. You don't need to understand it all before you start. You can just start playing.", icon: SlidersHorizontal, meta: "SOUND ENGINE / VOICE", image: images.sound },
    { id: "mic", label: "MIC", title: "Bring your voice in.", description: "Your voice, an instrument, or anything else you want to record. The microphone lives inside the studio, so you never have to switch apps to keep creating.", icon: Mic2, meta: "MIC INPUT / RECORD", image: images.mic },
    { id: "loop", label: "LOOP", title: "Got an idea? Don't let it get away.", description: "The looper lets you record layers and build a piece from them. Start with something small, add another layer, and see where it goes.", icon: Disc3, meta: "MULTI-TRACK / WAV EXPORT", image: images.loop },
    { id: "pad", label: "PAD", title: "Play with the sound in real time.", description: "The Pad lets you control the sound while you're playing. Not just shape it before you play, but play with it as you go.", icon: SlidersHorizontal, meta: "LIVE PERFORMANCE PAD", image: images.pad },
    { id: "drum", label: "DRUM", title: "Your drums. Your rules.", description: "Work with samples, build rhythms, set how they repeat, and trigger them live too.", icon: Drum, meta: "STEP SEQUENCER / BPM", image: images.drum },
  ],
  ru: [
    { id: "sound", label: "SOUND", title: "Настрой клавиши по-своему.", description: "Вручную задавай частоту каждой клавиши и строй клавиатуру так, как удобно тебе. Также есть контроль над Attack, Release, Decay, Volume, Glide, Cutoff и Resonance. Не нужно понимать всё сразу, можно просто начать играть.", icon: SlidersHorizontal, meta: "SOUND ENGINE / VOICE", image: images.sound },
    { id: "mic", label: "MIC", title: "Впусти свой голос.", description: "Голос, инструмент или что угодно ещё, что хочешь записать. Микрофон живёт внутри студии, так что не нужно переключаться в другое приложение, чтобы продолжать творить.", icon: Mic2, meta: "MIC INPUT / RECORD", image: images.mic },
    { id: "loop", label: "LOOP", title: "Есть идея? Не дай ей уйти.", description: "Лупер позволяет записывать слои и строить из них трек. Начинаешь с малого, добавляешь ещё, и смотришь, куда это приведёт.", icon: Disc3, meta: "MULTI-TRACK / WAV EXPORT", image: images.loop },
    { id: "pad", label: "PAD", title: "Играй со звуком в реальном времени.", description: "Pad позволяет управлять звуком прямо во время игры. Не только настроить звук заранее, а играть с ним на ходу.", icon: SlidersHorizontal, meta: "LIVE PERFORMANCE PAD", image: images.pad },
    { id: "drum", label: "DRUM", title: "Твои барабаны. Твои правила.", description: "Работай с семплами, строй ритмы, задавай, как они повторяются, и запускай их вживую.", icon: Drum, meta: "STEP SEQUENCER / BPM", image: images.drum },
  ],
  ar: [
    { id: "sound", label: "SOUND", title: "برمج المفاتيح بطريقتك.", description: "اضبط تردد كل مفتاح يدوياً وابنِ لوحة المفاتيح بالطريقة التي تناسبك. لديك أيضاً تحكم في أشياء مثل Attack وRelease وDecay وVolume وGlide وCutoff وResonance. لا تحتاج لفهم كل شيء قبل أن تبدأ. يمكنك فقط البدء باللعب.", icon: SlidersHorizontal, meta: "SOUND ENGINE / VOICE", image: images.sound },
    { id: "mic", label: "MIC", title: "أدخل صوتك إلى الداخل.", description: "صوتك، آلة موسيقية، أو أي شيء آخر تريد تسجيله. الميكروفون موجود داخل الاستوديو، لذا لا تحتاج للانتقال إلى تطبيق آخر لمواصلة الإبداع.", icon: Mic2, meta: "MIC INPUT / RECORD", image: images.mic },
    { id: "loop", label: "LOOP", title: "لديك فكرة؟ لا تدعها تفلت.", description: "يتيح لك اللوبر تسجيل طبقات وبناء مقطع منها. تبدأ بشيء صغير، تضيف شيئاً آخر، وترى إلى أين يأخذك ذلك.", icon: Disc3, meta: "MULTI-TRACK / WAV EXPORT", image: images.loop },
    { id: "pad", label: "PAD", title: "العب بالصوت في الوقت الفعلي.", description: "يتيح لك الـPad التحكم بالصوت أثناء العزف. ليس فقط ضبط الصوت قبل العزف، بل اللعب به أثناء العزف.", icon: SlidersHorizontal, meta: "LIVE PERFORMANCE PAD", image: images.pad },
    { id: "drum", label: "DRUM", title: "إيقاعاتك. قواعدك.", description: "اعمل مع العينات، ابنِ إيقاعات، حدد كيفية تكرارها، وشغّلها أيضاً في الوقت الفعلي.", icon: Drum, meta: "STEP SEQUENCER / BPM", image: images.drum },
  ],
} satisfies Record<Language, Array<{ id: string; label: string; title: string; description: string; icon: typeof SlidersHorizontal; meta: string; image: string }>>;

// Fallback copy, used only if content.json fails to load.
const navDefault = { features: "What's inside", architecture: "How it works", vision: "Vision", privacy: "Privacy", cta: "Meet L-Studio" };
const heroDefault = { kicker: "A music studio for people who love playing with sound", title: "Music shouldn't feel like work.", body: "L-Studio actually began as something else. I wanted to build a keyboard where I could set the frequency of every key myself. From there it grew into recording, a looper, drums, a microphone, a pad and more. Today all of that lives inside your phone.", ctaPrimary: "Meet L-Studio", ctaSecondary: "How it started", stat1: "Under 7MB", stat2: "Android", stat3: "No ads" };
const signalDefault = { text: "From key to sound to loop to recording", note: "All inside L-Studio" };
const storyDefault = { kicker: "01 / THE EIGHTH NOTE", title: "It all started with a note that wasn't there.", body: ["I wanted to build a keyboard where I could set which frequency belongs to each key myself.", "From there it grew into recording, a looper, drums, a microphone and more."], closing: "What started as a search for the eighth note became L-Studio." };
const featuresIntroDefault = { kicker: "02 / PLAY WITH SOUND", title: "Just open it and play.", body: "You don't need to know music to start. Open it, touch it, change it, listen, and see what happens." };
const hoodDefault = { kicker: "03 / UNDER THE HOOD", title: "There's a lot going on behind the scenes.", body: "A local signal path for sound, performance and capture.", closing: "The complexity lives in the engine. Not in the way you have to use it.", details: [] as Array<{ label: string; value: string }>, pipeline: ["KEYBOARD", "DSP / VOICES", "FX / MIX", "WAV"], specsTitle: "Technical signal map", specsBody: "A practical view of what happens between touch and sound." };
const justStartDefault = { kicker: "04 / JUST START", title: "There's a lot to do. You don't need to know it all.", body: ["L-Studio was built differently. There's a lot here, but you can start without taking a course."], closing: "Start playing. The rest will come." };
const factoryDefault = { kicker: "L-STUDIO / FACTORY PACK", lede: "The sound is already waiting for you.", shortText: "8 pages. 64 voices.", description: "Factory Pack was built specifically for L-Studio.", cta: "Get early access" };
const visionDefault = { kicker: "05 / THE VISION", title: "I built the studio I needed.", author: "David Chatam, L-Studio developer", body: ["I just love music and wanted to control sound in a way that felt natural to me."], mainLine: "It's for analog people in a digital world.", cards: [{ no: "01", title: "Just start", body: "Open the app and start creating." }, { no: "02", title: "Play with sound", body: "Touch the sound, change it, and discover things you didn't plan." }, { no: "03", title: "Take the studio with you", body: "Creating shouldn't have to wait for a computer." }] };
const testerDefault = { kicker: "EARLY ACCESS", title: "Want to try L-Studio?", body: "L-Studio is still evolving.", name: "Name", email: "Email address", consent: "I agree to receive L-Studio updates.", submit: "I want to try it", note: "Free early access · Limited to 44 testers" };
const finalCtaDefault = { kicker: "06 / YOUR SOUND", title: "Maybe it's time to find your sound.", body: "You can start from one sound, a beat, a loop, or a small idea.", cta: "Enter L-Studio" };
const footerDefault = { tagline: "It's for analog people in a digital world." };

const visionIcons = [Sparkles, Music2, ArrowDownLeft];

// Renders a headline as "lead words" + a line break + the last word in the accent color,
// matching the site's existing typographic style (see h1 em / h2 em in index.css).
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
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}content.json`).then((response) => response.ok ? response.json() : null).then(setEditableContent).catch(() => undefined); }, []);

  const copy = editableContent?.languages?.[language] ?? {};
  const nav = copy.nav ?? navDefault;
  const hero = copy.hero ?? heroDefault;
  const signal = copy.signalStrip ?? signalDefault;
  const story = copy.story ?? storyDefault;
  const featuresIntro = copy.featuresIntro ?? featuresIntroDefault;
  const hood = copy.underHood ?? hoodDefault;
  const justStart = copy.justStart ?? justStartDefault;
  const factory = copy.factoryPack ?? factoryDefault;
  const vision = copy.vision ?? visionDefault;
  const tester = copy.tester ?? testerDefault;
  const finalCta = copy.finalCta ?? finalCtaDefault;
  const footer = copy.footer ?? footerDefault;
  const chrome = chromeUi[language];

  const features = featureData[language];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState("");
  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div className="site-shell">
      <div className="noise" aria-hidden="true" />
      <header className={`site-header${mobileOpen ? " site-header--open" : ""}`}>
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={nav.features}>
            <a href="#features">{nav.features}</a>
            <a href="#architecture">{nav.architecture}</a>
            <a href="#vision">{nav.vision}</a>
            <Link href="/privacy">{nav.privacy}</Link>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <a className="button button--small button--light" href="#early-access"><span>{nav.cta}</span><ArrowUpRight size={15} /></a>
            <button className="menu-toggle" type="button" aria-label={mobileOpen ? chrome.close : chrome.open} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mobile-nav" aria-label={nav.features}>
            <LanguageSwitcher />
            <a href="#features" onClick={() => setMobileOpen(false)}>{nav.features}</a>
            <a href="#architecture" onClick={() => setMobileOpen(false)}>{nav.architecture}</a>
            <a href="#vision" onClick={() => setMobileOpen(false)}>{nav.vision}</a>
            <Link href="/privacy" onClick={() => setMobileOpen(false)}>{nav.privacy}</Link>
          </nav>
        )}
      </header>

      <main>
        {/* 1. Hero */}
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> {hero.kicker}</div>
            <h1 id="hero-title"><Headline text={hero.title} /></h1>
            <p className="hero-lede">{hero.body}</p>
            <div className="hero-actions">
              <a className="button button--primary" href="#features">{hero.ctaPrimary} <ArrowUpRight size={17} /></a>
              <a className="text-link" href="#story">{hero.ctaSecondary} <ChevronRight size={16} /></a>
            </div>
            <div className="hero-proof">
              <span><b>{hero.stat1}</b></span>
              <span><b>{hero.stat2}</b></span>
              <span><b>{hero.stat3}</b></span>
            </div>
          </div>
          <div className="hero-console" aria-label="L Studio console">
            <div className="console-topline"><span>LIVE SESSION / 01</span><span className="live-status"><i /> AUDIO ENGINE ACTIVE</span></div>
            <div className="console-display">
              <div className="display-mark"><img src={`${import.meta.env.BASE_URL}assets/logo.png`} alt="L Studio" /></div>
              <div className="display-title">L STUDIO</div>
              <div className="display-subtitle">MICROTONAL WORKSTATION</div>
              <div className="waveform" aria-hidden="true">{[26,42,74,48,31,57,88,42,69,36,62,93,52,33,72,45,25,60,38,79,46,30,66,40,82,55,33,70,45,27,64,39].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
              <div className="display-reading"><span>DO</span><strong>222.00 <small>Hz</small></strong><span>OCT +01</span></div>
            </div>
            <div className="console-controls">
              <div className="control-group"><span className="control-label">WAVE</span><span className="knob knob--gold" /><b>SAW</b></div>
              <div className="control-group"><span className="control-label">CUTOFF</span><span className="knob" /><b>68%</b></div>
              <div className="control-group"><span className="control-label">RESONANCE</span><span className="knob knob--gold" /><b>42%</b></div>
              <div className="control-group"><span className="control-label">DRIVE</span><span className="knob knob--gold" /><b>WARM</b></div>
            </div>
            <div className="console-tabs"><span className="is-active">SOUND</span><span>MIC</span><span>LOOP</span><span>PAD</span><span>DRUM</span></div>
            <div className="console-corner">L / 01 <span>▰▰▰</span></div>
          </div>
        </section>

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
          <div className="story-visualizer" aria-label="Minimal animated sound wave visualizer">
            <div className="visualizer-readout"><strong>222.00 <small>Hz</small></strong></div>
            <svg className="visualizer-wave" viewBox="0 0 900 160" preserveAspectRatio="none" role="img" aria-label="Animated synthesizer waveform">
              <path className="visualizer-wave-trace" d="M0 80 C18 80 24 26 42 26 S66 134 84 134 S108 80 126 80 S150 26 168 26 S192 134 210 134 S234 80 252 80 S276 26 294 26 S318 134 336 134 S360 80 378 80 S402 26 420 26 S444 134 462 134 S486 80 504 80 S528 26 546 26 S570 134 588 134 S612 80 630 80 S654 26 672 26 S696 134 714 134 S738 80 756 80 S780 26 798 26 S822 134 840 134 S864 80 900 80" />
              <path className="visualizer-wave-trace visualizer-wave-trace--soft" d="M0 80 C18 80 24 50 42 50 S66 110 84 110 S108 80 126 80 S150 50 168 50 S192 110 210 110 S234 80 252 80 S276 50 294 50 S318 110 336 110 S360 80 378 80 S402 50 420 50 S444 110 462 110 S486 80 504 80 S528 50 546 50 S570 110 588 110 S612 80 630 80 S654 50 672 50 S696 110 714 110 S738 80 756 80 S780 50 798 50 S822 110 840 110 S864 80 900 80" />
            </svg>
          </div>
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
                          <img src={feature.image} alt={`${feature.label} interface`} />
                          <div className="preview-overlay"><span>{feature.meta}</span><span><Icon size={17} /> {feature.label}</span></div>
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
              <div className="architecture-core"><AudioWaveform size={42} /><span>REAL-TIME</span><b>LOCAL AUDIO</b><small>API 24+ / ANDROID</small></div>
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
            <div className="factory-pack-cover"><img src={factoryBanner} alt="L Studio Factory Pack preset cover" /></div>
            <p className="factory-pack-lede">{factory.lede}</p>
            <p>{factory.shortText}</p>
            <p>{factory.description}</p>
            <div className="factory-scales"><span>222</span><span>299</span><span>333</span><span>355</span><span>396</span><span>444</span><span>463</span><span>477 Hz</span></div>
            <a className="button button--primary" href="#early-access">{factory.cta} <ArrowUpRight size={17} /></a>
          </div>
        </section>

        {/* 7. The vision */}
        <section className="vision-section" id="vision">
          <div className="container vision-grid">
            <div className="vision-copy">
              <div className="vision-portrait"><img src={developerImage} alt="L Studio developer" /></div>
              <span className="kicker">{vision.kicker}</span>
              <h2><Headline text={vision.title} /></h2>
              <span className="vision-author">{vision.author}</span>
              {vision.body.map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
              <p className="lead-line">{vision.mainLine}</p>
              <a className="instagram-link" href="https://www.instagram.com/lstudio.app?stkn=MTJ2Ym1vdHBpMTA5Nw==" target="_blank" rel="noreferrer"><Instagram size={17} /> {instagramLabel[language]} <ArrowUpRight size={15} /></a>
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

        {/* 8. Early Access */}
        <section className="tester-section container" id="early-access">
          <div className="tester-grid">
            <div className="tester-copy">
              <span className="kicker">{tester.kicker}</span>
              <h2>{tester.title}</h2>
              <p>{tester.body}</p>
              <div className="tester-proof"><span>01</span><span>FREE ACCESS</span><span>LOCAL AUDIO</span></div>
            </div>
            <form className="tester-form" action="https://formsubmit.co/dudichatam@gmail.com" method="POST">
              <input type="hidden" name="_subject" value="L Studio, New early access tester" />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_next" value="https://dudichatam-max.github.io/" />
              <label><span>{tester.name}</span><input type="text" name="name" autoComplete="name" placeholder={tester.name} required /></label>
              <label><span>{tester.email}</span><input type="email" name="email" autoComplete="email" placeholder={tester.email} required /></label>
              <label className="tester-consent"><input type="checkbox" required /><span>{tester.consent}</span></label>
              <button className="button button--primary" type="submit">{tester.submit} <ArrowUpRight size={16} /></button>
              <small>{tester.note}</small>
            </form>
          </div>
        </section>

        {/* 9. Final CTA */}
        <section className="final-cta container">
          <span className="kicker">{finalCta.kicker}</span>
          <h2><Headline text={finalCta.title} /></h2>
          <p>{finalCta.body}</p>
          <div className="teaser-video"><video controls playsInline preload="metadata" src={`${import.meta.env.BASE_URL}assets/teaser.mp4`} aria-label="L Studio Factory Pack teaser" /></div>
          <a className="button button--primary" href="#early-access">{finalCta.cta} <ArrowUpRight size={17} /></a>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <SiteLogo compact />
          <div className="footer-links"><a href="#features">{nav.features}</a><a href="#vision">{nav.vision}</a><Link href="/privacy">{nav.privacy}</Link></div>
          <span className="footer-tagline">{footer.tagline}</span>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
