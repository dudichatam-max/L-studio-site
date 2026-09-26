import { ArrowLeft, Check, LockKeyhole, Mic2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { exclusiveNavLabel } from "@/lib/exclusiveNav";

const SUPPORT_EMAIL = "dudichatam@gmail.com";

type PrivacySection = { title: string; body: string; callout?: string };

type PrivacyCopy = {
  back: string;
  home: string;
  features: string;
  architecture: string;
  guide: string;
  terms: string;
  hero: string;
  intro: string;
  date: string;
  draftNote: string;
  principle: string;
  principleBody: string;
  scope: string;
  scopeTitle: string;
  scopeBody: string;
  page: string;
  checks: string[];
  sections: PrivacySection[];
  contact: string;
  contactBody: string;
  privacyLabel: string;
};

const copy: Record<Language, PrivacyCopy> = {
  he: {
    back: "חזרה לאתר",
    home: "דף הבית",
    features: "יכולות",
    architecture: "איך זה עובד",
    guide: "מדריך למשתמש",
    terms: "תנאי שימוש",
    hero: "העמוד הזה מסביר בפשטות איך L Studio מתייחסת להרשאות, לאודיו ולמידע שנוצר בזמן היצירה.",
    intro: "L Studio בנויה כתחנת עבודה מקומית. האודיו שלך, הפריסטים שלך והסשנים שלך לא צריכים לעבור דרך שרת כדי להפוך לרגע מוזיקלי.",
    date: "עודכן לאחרונה: 26 בספטמבר 2026",
    draftNote: "טיוטה לביקורת. הטקסט בעמוד הזה אינו ייעוץ משפטי. עורך דין צריך לעבור עליו לפני שמסתמכים עליו בישראל או בשווקים אחרים.",
    principle: "עיקרון ראשון: הכל נשאר אצלך.",
    principleBody: "L Studio בנויה כתחנת עבודה מקומית. האודיו שלך, הפריסטים שלך והסשנים שלך לא צריכים לעבור דרך שרת כדי להפוך לרגע מוזיקלי.",
    scope: "היקף המדיניות",
    scopeTitle: "התחייבות",
    scopeBody: "מדיניות זו חלה על אפליקציית L Studio לאנדרואיד ועל האתר הנלווה בכתובת l-studio.studio. האפליקציה מקומית. האתר אוסף הרשמה לגישה מוקדמת וסופר צפיות בעמודים, כפי שמתואר למטה.",
    page: "ON THIS PAGE",
    checks: ["ללא פרסום באפליקציה", "ללא אנליטיקה באפליקציה", "ללא העלאת אודיו אוטומטית"],
    sections: [
      { title: "איזה מידע נאסף", body: "אפליקציית האנדרואיד של L Studio מתוכננת לפעול ללא שליחת מידע אישי לשרתים חיצוניים. האפליקציה עשויה לעבד נתוני אודיו, פריסטים, סשנים ופרויקטים שנוצרים על ידך, אך עיבוד זה מתבצע מקומית במכשיר, לצורך הפעלת היכולות שביקשת. איסוף באתר מתואר בסעיפים שלמטה." },
      { title: "הרשאת מיקרופון", body: "כאשר נעשה שימוש בסטודיו המיקרופון, Android עשויה לבקש הרשאת גישה למיקרופון. ההרשאה משמשת אך ורק ללכידה ולניטור של קלט האודיו בתוך האפליקציה.", callout: "שליטה אצלך. ניתן לבטל את ההרשאה בכל עת דרך הגדרות המכשיר." },
      { title: "אחסון, ייצוא ושיתוף", body: "פריסטים, סשנים, הקלטות ופרויקטים נשמרים באחסון המקומי של האפליקציה או במקום שבחרת לייצא אליו. אם תבחר לשתף קובץ, הפעולה מתבצעת ביוזמתך באמצעות מנגנוני השיתוף של Android. L Studio אינה שולחת קבצים אלה אלינו באופן אוטומטי." },
      { title: "שירותי צד שלישי באפליקציה", body: "לפי התצורה הנוכחית, אפליקציית האנדרואיד אינה כוללת פרסום, מעקב התנהגותי או אנליטיקה. אין שימוש בנתוני אודיו לצורך פרופיילינג או אימון מודלים. האתר משתמש בשירותים שמתוארים בסעיפים הבאים." },
      { title: "אבטחה ושמירת מידע", body: "אנו שומרים על עיקרון של עיבוד מקומי ככל שניתן. חשוב להגן על המכשיר, על מערכת ההפעלה ועל קבצי הגיבוי שלך באמצעות מנגנוני האבטחה הזמינים במכשיר." },
      { title: "שינויים במדיניות", body: "אם אופן הפעולה של L Studio ישתנה באופן שמשפיע על פרטיותך, מדיניות זו תעודכן ותאריך העדכון יוחלף." },
      { title: "גישה מוקדמת באתר", body: "דף הבית מבקש שם וכתובת אימייל למי שמבקש מקום בודק חינמי של L Studio Pro. אנחנו שומרים את ההרשמה בשרת האתר (אחסון ב-Railway) כדי לשריין מקום ולשלוח את ההורדה. מייל ההורדה והמדריך נשלחים כמייל תפעולי דרך Resend. בעל האתר עשוי לקבל הודעה כשמישהו נרשם או מוריד את גרסת הבודקים. המידע משמש להפעלת הגישה המוקדמת, ולא למכירה. תמיכה: dudichatam@gmail.com." },
      { title: "ספירת צפיות באתר", body: "האתר טוען את GoatCounter, מונה צפיות ידידותי לפרטיות, כדי לספור צפיות בעמודים. הסקריפט נטען מ-gc.zgo.at עבור המונה lstudio.goatcounter.com. הספירה חלה על האתר בלבד, ולא על אפליקציית האנדרואיד." },
      { title: "רכישות", body: "רכישה בתשלום של L Studio Pro אינה מוצעת באתר הזה כרגע. אין באתר קופה או תשלום בכרטיס. אם הרכישה תחזור בהמשך, המדיניות הזו תעודכן." },
    ],
    contact: "יש לך שאלה?",
    contactBody: "לשאלות פרטיות בנוגע ל־L Studio, פנו אל",
    privacyLabel: "פרטיות",
  },
  en: {
    back: "Back to site",
    home: "Home",
    features: "Features",
    architecture: "How it works",
    guide: "User guide",
    terms: "Terms",
    hero: "This page explains, in plain language, how L Studio handles permissions, audio and the information created while you work.",
    intro: "L Studio is designed as a local workstation. Your audio, presets and sessions do not need to pass through a server to become a musical moment.",
    date: "Last updated: September 26, 2026",
    draftNote: "Draft for review. This page is not legal advice. A lawyer should review it before you rely on it in Israel or in any other market.",
    principle: "First principle: it stays with you.",
    principleBody: "L Studio is designed as a local workstation. Your audio, presets and sessions do not need to pass through a server to become a musical moment.",
    scope: "Policy scope",
    scopeTitle: "A clear promise.",
    scopeBody: "This policy applies to the L Studio Android application and to the companion website at l-studio.studio. The app is local-first. The website collects an Early Access signup and counts page views, as described below.",
    page: "ON THIS PAGE",
    checks: ["No ads in the app", "No analytics in the app", "No automatic audio upload"],
    sections: [
      { title: "What information is collected", body: "The Android app is designed to operate without sending personal information to external servers. The app may process audio, presets, sessions and projects created by you, but this processing happens locally on your device to provide the features you request. Website collection is described in the sections below." },
      { title: "Microphone permission", body: "When you use the microphone studio, Android may ask for microphone access. This permission is used only to capture and monitor audio input inside the app.", callout: "You stay in control. You can revoke permission at any time in your device settings." },
      { title: "Storage, export and sharing", body: "Presets, sessions, recordings and projects are saved in the app's local storage or wherever you choose to export them. If you share a file, the action is initiated by you through Android sharing tools. L Studio does not automatically send these files to us." },
      { title: "Third-party services in the app", body: "In the current configuration, the Android app includes no advertising, behavioral tracking, or analytics. Audio data is not used for profiling or model training. The website uses the services described in the following sections." },
      { title: "Security and retention", body: "We follow a local-first processing principle. Protect your device, operating system and backups using the security tools available on your device." },
      { title: "Policy changes", body: "If L Studio changes in a way that affects your privacy, this policy will be updated and its date will change." },
      { title: "Early Access on this website", body: "The homepage asks for a name and email address if you want a free L Studio Pro tester spot. We store that signup on the website backend (hosted on Railway) so we can reserve a spot and send the download. The download and user-guide messages are sent as transactional email through Resend. The site owner may receive a notice when someone signs up or downloads the tester build. We use this information to run Early Access, not to sell it. Support: dudichatam@gmail.com." },
      { title: "Website page views", body: "The website loads GoatCounter, a privacy-friendly page-view counter, to count page views. The script is loaded from gc.zgo.at for the counter at lstudio.goatcounter.com. This counting applies to the website only, not to the Android app." },
      { title: "Purchases", body: "Paid L Studio Pro is not offered for purchase on this website at this time. There is no card checkout on the site. If purchasing returns later, this policy will be updated." },
    ],
    contact: "Have a question?",
    contactBody: "For privacy questions about L Studio, contact",
    privacyLabel: "Privacy",
  },
  ru: {
    back: "Вернуться на сайт",
    home: "Главная",
    features: "Возможности",
    architecture: "Как это работает",
    guide: "Руководство",
    terms: "Условия",
    hero: "Здесь простыми словами объясняется, как L Studio работает с разрешениями, аудио и данными, которые создаются во время работы.",
    intro: "L Studio создана как локальная рабочая станция. Вашему аудио, пресетам и сессиям не нужно проходить через сервер.",
    date: "Обновлено: 26 сентября 2026",
    draftNote: "Черновик для проверки. Этот текст не является юридической консультацией. Юрист должен проверить его, прежде чем опираться на него в Израиле или на других рынках.",
    principle: "Главный принцип: всё остаётся у вас.",
    principleBody: "L Studio создана как локальная рабочая станция. Вашему аудио, пресетам и сессиям не нужно проходить через сервер.",
    scope: "Область политики",
    scopeTitle: "Чёткое обещание.",
    scopeBody: "Эта политика относится к Android-приложению L Studio и к сопутствующему сайту l-studio.studio. Приложение работает локально. Сайт собирает заявку Early Access и считает просмотры страниц, как описано ниже.",
    page: "НА ЭТОЙ СТРАНИЦЕ",
    checks: ["Без рекламы в приложении", "Без аналитики в приложении", "Без автоматической загрузки аудио"],
    sections: [
      { title: "Какие данные собираются", body: "Android-приложение L Studio работает без отправки персональной информации на внешние серверы. Приложение может обрабатывать аудио, пресеты, сессии и проекты, созданные вами, но обработка происходит локально на устройстве. Сбор данных на сайте описан в разделах ниже." },
      { title: "Доступ к микрофону", body: "При использовании микрофонной студии Android может запросить доступ к микрофону. Разрешение используется только для записи и мониторинга аудио внутри приложения.", callout: "Контроль у вас. Разрешение можно отозвать в настройках устройства." },
      { title: "Хранение, экспорт и обмен", body: "Пресеты, сессии, записи и проекты хранятся локально или там, куда вы решили их экспортировать. Обмен файлом запускается вами через инструменты Android. L Studio не отправляет эти файлы автоматически." },
      { title: "Сторонние сервисы в приложении", body: "В текущей конфигурации Android-приложение не содержит рекламы, поведенческого отслеживания или аналитики. Аудиоданные не используются для профилирования или обучения моделей. Сайт использует сервисы, описанные в следующих разделах." },
      { title: "Безопасность и хранение", body: "Мы придерживаемся принципа локальной обработки. Защищайте устройство, операционную систему и резервные копии доступными средствами безопасности." },
      { title: "Изменения политики", body: "Если изменения L Studio затронут вашу приватность, эта политика будет обновлена вместе с датой." },
      { title: "Early Access на сайте", body: "На главной странице запрашиваются имя и адрес электронной почты, если вы хотите бесплатное место тестировщика L Studio Pro. Мы храним эту заявку на сервере сайта (хостинг Railway), чтобы зарезервировать место и отправить загрузку. Письма со ссылкой на скачивание и руководством отправляются как служебная почта через Resend. Владелец сайта может получить уведомление, когда кто-то регистрируется или скачивает тестовую сборку. Эти данные нужны для Early Access, а не для продажи. Поддержка: dudichatam@gmail.com." },
      { title: "Просмотры страниц сайта", body: "Сайт загружает GoatCounter, счётчик просмотров с упором на приватность, чтобы считать просмотры страниц. Скрипт загружается с gc.zgo.at для счётчика lstudio.goatcounter.com. Подсчёт относится только к сайту, не к Android-приложению." },
      { title: "Покупки", body: "Платная покупка L Studio Pro на этом сайте сейчас не предлагается. На сайте нет оплаты картой. Если покупка появится позже, эта политика будет обновлена." },
    ],
    contact: "Есть вопрос?",
    contactBody: "По вопросам конфиденциальности L Studio пишите на",
    privacyLabel: "Приватность",
  },
  ar: {
    back: "العودة إلى الموقع",
    home: "الرئيسية",
    features: "المزايا",
    architecture: "كيف يعمل",
    guide: "دليل المستخدم",
    terms: "الشروط",
    hero: "تشرح هذه الصفحة ببساطة كيف تتعامل L Studio مع الأذونات والصوت والمعلومات التي يتم إنشاؤها أثناء العمل.",
    intro: "صُممت L Studio كمحطة عمل محلية. لا يحتاج صوتك وإعداداتك وجلساتك إلى المرور عبر خادم.",
    date: "آخر تحديث: 26 سبتمبر 2026",
    draftNote: "مسودة للمراجعة. هذا النص ليس استشارة قانونية. يجب أن يراجعه محامٍ قبل الاعتماد عليه في إسرائيل أو في أي سوق آخر.",
    principle: "المبدأ الأول: كل شيء يبقى لديك.",
    principleBody: "صُممت L Studio كمحطة عمل محلية. لا يحتاج صوتك وإعداداتك وجلساتك إلى المرور عبر خادم.",
    scope: "نطاق السياسة",
    scopeTitle: "وعد واضح.",
    scopeBody: "تنطبق هذه السياسة على تطبيق L Studio لنظام Android وعلى الموقع المصاحب l-studio.studio. التطبيق محلي أولاً. يجمع الموقع تسجيلاً للوصول المبكر ويحصي مشاهدات الصفحات، كما هو موضح أدناه.",
    page: "في هذه الصفحة",
    checks: ["بلا إعلانات في التطبيق", "بلا تحليلات في التطبيق", "بلا رفع تلقائي للصوت"],
    sections: [
      { title: "ما المعلومات التي يتم جمعها", body: "صُمم تطبيق L Studio على أندرويد للعمل دون إرسال معلومات شخصية إلى خوادم خارجية. قد يعالج التطبيق الصوت والإعدادات والجلسات والمشاريع التي تنشئها، لكن تتم المعالجة محلياً على جهازك. جمع البيانات على الموقع موضح في الأقسام أدناه." },
      { title: "إذن الميكروفون", body: "عند استخدام استوديو الميكروفون، قد يطلب Android الوصول إلى الميكروفون. يُستخدم هذا الإذن فقط لالتقاط ومراقبة الصوت داخل التطبيق.", callout: "التحكم لديك. يمكنك إلغاء الإذن في أي وقت من إعدادات جهازك." },
      { title: "التخزين والتصدير والمشاركة", body: "تُحفظ الإعدادات والجلسات والتسجيلات والمشاريع في التخزين المحلي أو المكان الذي تختاره للتصدير. إذا شاركت ملفاً، تبدأ العملية بواسطتك عبر أدوات Android. لا ترسل L Studio هذه الملفات تلقائياً." },
      { title: "خدمات الطرف الثالث في التطبيق", body: "وفق الإعداد الحالي، لا يتضمن تطبيق أندرويد إعلانات أو تتبعاً سلوكياً أو تحليلات. لا تُستخدم بيانات الصوت للتوصيف أو تدريب النماذج. يستخدم الموقع الخدمات الموضحة في الأقسام التالية." },
      { title: "الأمان والاحتفاظ", body: "نتبع مبدأ المعالجة المحلية أولاً. احمِ جهازك ونظام التشغيل والنسخ الاحتياطية باستخدام أدوات الأمان المتاحة لديك." },
      { title: "تغييرات السياسة", body: "إذا تغيرت L Studio بطريقة تؤثر على خصوصيتك، فسيتم تحديث هذه السياسة وتاريخها." },
      { title: "الوصول المبكر على الموقع", body: "تطلب الصفحة الرئيسية اسماً وعنوان بريد إلكتروني لمن يريد مكاناً مجانياً لاختبار L Studio Pro. نخزن هذا التسجيل على خادم الموقع (الاستضافة على Railway) لحجز المكان وإرسال التنزيل. تُرسل رسائل التنزيل والدليل كبريد تشغيلي عبر Resend. قد يتلقى مالك الموقع إشعاراً عند تسجيل شخص أو تنزيل نسخة الاختبار. تُستخدم هذه البيانات لتشغيل الوصول المبكر، لا لبيعها. الدعم: dudichatam@gmail.com." },
      { title: "مشاهدات صفحات الموقع", body: "يحمّل الموقع GoatCounter، وهو عدّاد مشاهدات يراعي الخصوصية، لإحصاء مشاهدات الصفحات. يُحمَّل السكربت من gc.zgo.at للعدّاد lstudio.goatcounter.com. ينطبق العد على الموقع فقط، وليس على تطبيق أندرويد." },
      { title: "المشتريات", body: "لا يُعرض شراء L Studio Pro المدفوع على هذا الموقع في الوقت الحالي. لا توجد عملية دفع بالبطاقة على الموقع. إذا عاد الشراء لاحقاً، ستُحدَّث هذه السياسة." },
    ],
    contact: "هل لديك سؤال؟",
    contactBody: "لأسئلة الخصوصية حول L Studio، تواصل عبر",
    privacyLabel: "الخصوصية",
  },
};

function titleBlock(language: Language) {
  if (language === "he") return <>מדיניות<br /><em>פרטיות.</em></>;
  if (language === "en") return <>Privacy<br /><em>policy.</em></>;
  if (language === "ru") return <>Политика<br /><em>приватности.</em></>;
  return <>سياسة<br /><em>الخصوصية.</em></>;
}

export default function Privacy() {
  const { language, isRtl } = useLanguage();
  const text = copy[language];
  const scopeParts = text.scopeTitle.split(" ");

  return (
    <div className="site-shell privacy-page" dir={isRtl ? "rtl" : "ltr"}>
      <div className="noise" aria-hidden="true" />
      <header className="site-header">
        <div className="container header-inner">
          <SiteLogo />
          <nav className="desktop-nav" aria-label={text.page}>
            <Link href="/">{text.home}</Link>
            <a href="/#features">{text.features}</a>
            <a href="/#architecture">{text.architecture}</a>
            <Link href="/guide">{text.guide}</Link>
            <Link href="/terms">{text.terms}</Link>
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
            <span className="nav-current">{text.privacyLabel}</span>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher />
            <Link className="button button--small button--light" href="/">
              {text.back} <ArrowLeft size={15} />
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="privacy-hero container">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> TRUST / TRANSPARENCY / LOCAL-FIRST
          </div>
          <h1>{titleBlock(language)}</h1>
          <p>{text.hero}</p>
          <div className="privacy-date">
            {text.date} <span>·</span> L Studio 1.02
          </div>
          <p className="legal-draft">{text.draftNote}</p>
        </section>
        <section className="privacy-intro container">
          <div className="privacy-intro-card">
            <ShieldCheck size={28} />
            <div>
              <strong>{text.principle}</strong>
              <p>{text.principleBody}</p>
            </div>
          </div>
          <div className="privacy-intro-side">
            <LockKeyhole size={18} />
            <span>
              LOCAL
              <br />
              PROCESSING
            </span>
          </div>
        </section>
        <section className="privacy-content container">
          <aside className="privacy-aside">
            <span className="kicker">{text.page}</span>
            <a href="#scope">{text.scope}</a>
            {text.sections.map((section, index) => (
              <a key={section.title} href={`#privacy-${index + 1}`}>
                0{index + 1} / {section.title}
              </a>
            ))}
            <div className="privacy-aside-note">
              {text.checks.map((check) => (
                <span key={check}>
                  <Check size={15} /> {check}
                </span>
              ))}
            </div>
          </aside>
          <article className="privacy-article" id="scope">
            <div className="article-lead">
              <span className="kicker">SCOPE</span>
              <h2>
                {scopeParts[0]}
                <br />
                <em>{scopeParts.slice(1).join(" ")}</em>
              </h2>
              <p>{text.scopeBody}</p>
            </div>
            {text.sections.map((section, index) => (
              <section className="privacy-block" id={`privacy-${index + 1}`} key={section.title}>
                <span className="privacy-number">0{index + 1}</span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                  {section.callout && (
                    <div className="privacy-callout">
                      <Mic2 size={18} />
                      <span>{section.callout}</span>
                    </div>
                  )}
                </div>
              </section>
            ))}
            <div className="privacy-contact">
              <span className="kicker">CONTACT</span>
              <h3>{text.contact}</h3>
              <p>
                {text.contactBody}{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            </div>
          </article>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <SiteLogo compact />
          <div className="footer-links">
            <Link href="/">{text.home}</Link>
            <a href="/#features">{text.features}</a>
            <Link href="/guide">{text.guide}</Link>
            <Link href="/terms">{text.terms}</Link>
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
            <span>{text.privacyLabel}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
