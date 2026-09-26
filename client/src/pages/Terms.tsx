import { ArrowLeft, Check, FileText, Scale, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import SiteLogo from "@/components/SiteLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { exclusiveNavLabel } from "@/lib/exclusiveNav";

const SUPPORT_EMAIL = "dudichatam@gmail.com";

type TermsSection = { title: string; body: string };

type TermsCopy = {
  back: string;
  home: string;
  features: string;
  architecture: string;
  guide: string;
  privacy: string;
  termsLabel: string;
  hero: string;
  date: string;
  draftNote: string;
  principle: string;
  principleBody: string;
  scope: string;
  scopeTitle: string;
  scopeBody: string;
  page: string;
  checks: string[];
  sections: TermsSection[];
  contact: string;
  contactBody: string;
};

const copy: Record<Language, TermsCopy> = {
  he: {
    back: "חזרה לאתר",
    home: "דף הבית",
    features: "יכולות",
    architecture: "איך זה עובד",
    guide: "מדריך למשתמש",
    privacy: "פרטיות",
    termsLabel: "תנאי שימוש",
    hero: "תנאי השימוש האלה מסבירים את הכללים לשימוש באפליקציית L Studio — סטודיו מוזיקה מקומי לאנדרואיד.",
    date: "עודכן לאחרונה: 26 בספטמבר 2026",
    draftNote: "טיוטה לביקורת. הטקסט בעמוד הזה אינו ייעוץ משפטי. עורך דין צריך לעבור עליו לפני שמסתמכים עליו בישראל או בשווקים אחרים.",
    principle: "שימוש הוגן באפליקציה מקומית.",
    principleBody: "L Studio מיועדת ליצירת מוזיקה במכשיר שלך. התנאים האלה מגדירים מה מותר, מה נשאר אצלך, ומה האחריות של כל צד.",
    scope: "היקף התנאים",
    scopeTitle: "תנאים ברורים.",
    scopeBody: "תנאים אלה חלים על השימוש באפליקציית L Studio לאנדרואיד ועל האתר הנלווה שלה. שימוש באפליקציה מהווה הסכמה לתנאים אלה. האתר אינו מוכר כרגע את Pro באופן מקוון.",
    page: "ON THIS PAGE",
    checks: ["עיבוד מקומי", "רישיון שימוש אישי", "ללא אחריות מוחלטת"],
    sections: [
      {
        title: "קבלת התנאים",
        body: "על ידי הורדה, התקנה או שימוש ב־L Studio, אתה מאשר שקראת והסכמת לתנאי שימוש אלה ולמדיניות הפרטיות. אם אינך מסכים, אל תשתמש באפליקציה.",
      },
      {
        title: "תיאור השירות",
        body: "L Studio היא אפליקציית אנדרואיד ליצירת מוזיקה מקומית. היא מאפשרת עבודה עם מקלדת, אפקטים, לופר, תופים, מיקרופון וייצוא אודיו — בעיקר על המכשיר שלך, ללא צורך בחשבון משתמש לשם שימוש בסיסי.",
      },
      {
        title: "רישיון שימוש",
        body: "מוציא לאור האפליקציה (L Studio) מעניק לך רישיון אישי, מוגבל, לא בלעדי ואינו ניתן להעברה להשתמש באפליקציה לצרכים אישיים או יצירתיים בהתאם לתנאים אלה. אינך רשאי להעתיק, לשנות, להנדס לאחור, להפיץ מחדש או למכור את האפליקציה או חלקיה, אלא אם הדין מתיר זאת במפורש.",
      },
      {
        title: "אחריות המשתמש ושימוש מקובל",
        body: "אתה אחראי לאופן שבו אתה משתמש ב־L Studio ובתוכן שאתה יוצר. אין להשתמש באפליקציה לפעילות בלתי חוקית, להפרת זכויות של אחרים, להפצת תוכן מזיק או לניסיון לפגוע באפליקציה, במכשירים או ברשתות. שמור על אבטחת המכשיר שלך ועל גיבויים של הפרויקטים שלך.",
      },
      {
        title: "קניין רוחני",
        body: "האפליקציה, העיצוב, הקוד, הסימנים והחומרים הנלווים שייכים למוציא לאור של L Studio או לבעלי רישיון מטעמו, ומוגנים על פי דין. התוכן המוזיקלי והקבצים שאתה יוצר באמצעות האפליקציה שייכים לך, בכפוף לזכויות של צדדים שלישיים בחומרים שהבאת בעצמך (למשל דגימות).",
      },
      {
        title: "עיבוד מקומי והתוכן שלך",
        body: "L Studio בנויה לעיבוד מקומי ככל האפשר. אודיו, פריסטים, סשנים ופרויקטים נשארים במכשיר שלך או במקום שאליו ייצאת אותם. האפליקציה אינה שולחת את התוכן שלך אוטומטית לשרתי המוציא לאור. לפרטים נוספים ראה את מדיניות הפרטיות.",
      },
      {
        title: "הרשאת מיקרופון",
        body: "אם תשתמש בסטודיו המיקרופון, Android עשויה לבקש הרשאת מיקרופון. ההרשאה נועדה אך ורק ללכידה ולניטור של קלט אודיו בתוך האפליקציה. ניתן לבטל אותה בכל עת בהגדרות המכשיר.",
      },
      {
        title: "היעדר אחריות והגבלת אחריות",
        body: "האפליקציה מסופקת \"כמות שהיא\" (AS IS) וללא אחריות מכל סוג, במידה המותרת בחוק — לרבות התאמה למטרה מסוימת או היעדר תקלות. המוציא לאור של L Studio אינו אחראי לנזקים עקיפים, תוצאתיים, אובדן נתונים, אובדן רווחים או נזקים הנובעים משימוש או מאי־יכולת להשתמש באפליקציה, במידה המרבית שהחוק החל מתיר.",
      },
      {
        title: "שינויים בתנאים",
        body: "ייתכן שתנאים אלה יעודכנו מעת לעת. תאריך העדכון יופיע בראש העמוד. המשך השימוש באפליקציה לאחר פרסום שינוי מהווה הסכמה לתנאים המעודכנים, אלא אם החוק קובע אחרת.",
      },
      {
        title: "דין חל ויישוב מחלוקות",
        body: "מחלוקות הנוגעות לתנאים אלה או לשימוש ב־L Studio יטופלו בהתאם לדין החל במקום מגוריו של מוציא לאור האפליקציה, מבלי לקבוע כאן חברה או תחום שיפוט פיקטיביים. אין באמור כדי לגרוע מזכויות צרכניות שאינן ניתנות לוויתור על פי דין.",
      },
      {
        title: "אין מכירה מקוונת באתר",
        body: "האתר הנלווה אינו מוכר כרגע את L Studio Pro באופן מקוון. אין קופה ואין מדיניות החזרים לרכישה באתר, כי אין רכישה בתשלום. הרשמה לגישה מוקדמת חינמית, כשהיא פתוחה בדף הבית, אינה מכירה. כללי הרישיון והשימוש שלמעלה חלים על האפליקציה. אם רכישה בתשלום תחזור בהמשך, התנאים האלה יעודכנו.",
      },
    ],
    contact: "יצירת קשר",
    contactBody: "לשאלות על תנאי השימוש של L Studio, פנו אל",
  },
  en: {
    back: "Back to site",
    home: "Home",
    features: "Features",
    architecture: "How it works",
    guide: "User guide",
    privacy: "Privacy",
    termsLabel: "Terms",
    hero: "These Terms of Service explain the rules for using L Studio — a local-first Android music creation app.",
    date: "Last updated: September 26, 2026",
    draftNote: "Draft for review. This page is not legal advice. A lawyer should review it before you rely on it in Israel or in any other market.",
    principle: "Fair use of a local app.",
    principleBody: "L Studio is built for making music on your device. These terms describe what you may do, what stays yours, and each party's responsibilities.",
    scope: "Scope of terms",
    scopeTitle: "Clear terms.",
    scopeBody: "These terms apply to the L Studio Android app and its companion website. Using the app means you agree to these terms. The website is not currently selling Pro online.",
    page: "ON THIS PAGE",
    checks: ["Local processing", "Personal use license", "No absolute warranties"],
    sections: [
      {
        title: "Acceptance of terms",
        body: "By downloading, installing or using L Studio, you confirm that you have read and agree to these Terms of Service and the Privacy Policy. If you do not agree, do not use the app.",
      },
      {
        title: "Description of the service",
        body: "L Studio is a local-first Android music creation app. It lets you work with a keyboard, effects, a looper, drums, a microphone and audio export — primarily on your device, without requiring an account for basic use.",
      },
      {
        title: "License to use the app",
        body: "The app publisher (L Studio) grants you a personal, limited, non-exclusive, non-transferable license to use the app for personal or creative purposes under these terms. You may not copy, modify, reverse engineer, redistribute or sell the app or its parts, except where applicable law expressly allows it.",
      },
      {
        title: "User responsibilities and acceptable use",
        body: "You are responsible for how you use L Studio and for the content you create. Do not use the app for illegal activity, to infringe others' rights, to distribute harmful content, or to attempt to harm the app, devices or networks. Keep your device and your project backups secure.",
      },
      {
        title: "Intellectual property",
        body: "The app, its design, code, marks and related materials belong to the L Studio publisher or its licensors and are protected by law. Musical content and files you create with the app belong to you, subject to third-party rights in materials you bring yourself (for example samples).",
      },
      {
        title: "Local processing and your content",
        body: "L Studio is built for local-first processing. Audio, presets, sessions and projects stay on your device or wherever you export them. The app does not automatically send your content to the publisher's servers. See the Privacy Policy for more detail.",
      },
      {
        title: "Microphone permission",
        body: "If you use the microphone studio, Android may ask for microphone access. That permission is used only to capture and monitor audio input inside the app. You can revoke it at any time in device settings.",
      },
      {
        title: "No warranties and limitation of liability",
        body: "The app is provided \"AS IS\" and without warranties of any kind to the fullest extent permitted by law, including fitness for a particular purpose or uninterrupted operation. The L Studio publisher is not liable for indirect, consequential, data loss, lost profits or other damages arising from use of or inability to use the app, to the maximum extent allowed by applicable law.",
      },
      {
        title: "Changes to these terms",
        body: "These terms may be updated from time to time. The update date appears at the top of this page. Continued use of the app after a change is posted constitutes acceptance of the updated terms, unless applicable law says otherwise.",
      },
      {
        title: "Governing note and disputes",
        body: "Disputes about these terms or your use of L Studio will be handled under the applicable law of the app publisher's place of residence, without inventing a fictional company name or jurisdiction here. Nothing in these terms limits consumer rights that cannot be waived by law.",
      },
      {
        title: "No online sale on this website",
        body: "The companion website is not currently selling L Studio Pro online. There is no checkout and no refund policy for a website purchase, because no paid purchase is offered here. Free Early Access tester signup, when it is open on the home page, is not a sale. The license and use rules above still apply to the app. If a paid purchase returns later, these terms will be updated.",
      },
    ],
    contact: "Contact",
    contactBody: "For questions about L Studio Terms of Service, contact",
  },
  ru: {
    back: "Вернуться на сайт",
    home: "Главная",
    features: "Возможности",
    architecture: "Как это работает",
    guide: "Руководство",
    privacy: "Приватность",
    termsLabel: "Условия",
    hero: "Эти Условия использования объясняют правила работы с L Studio — локальным Android-приложением для создания музыки.",
    date: "Обновлено: 26 сентября 2026",
    draftNote: "Черновик для проверки. Этот текст не является юридической консультацией. Юрист должен проверить его, прежде чем опираться на него в Израиле или на других рынках.",
    principle: "Честное использование локального приложения.",
    principleBody: "L Studio создана для музыки на вашем устройстве. Эти условия описывают, что можно делать, что остаётся вашим и каковы обязанности сторон.",
    scope: "Область условий",
    scopeTitle: "Понятные условия.",
    scopeBody: "Эти условия применяются к Android-приложению L Studio и к сопутствующему сайту. Использование приложения означает согласие с условиями. Сайт сейчас не продаёт Pro онлайн.",
    page: "НА ЭТОЙ СТРАНИЦЕ",
    checks: ["Локальная обработка", "Личная лицензия", "Без абсолютных гарантий"],
    sections: [
      {
        title: "Принятие условий",
        body: "Загружая, устанавливая или используя L Studio, вы подтверждаете, что прочитали и принимаете эти Условия использования и Политику конфиденциальности. Если вы не согласны, не используйте приложение.",
      },
      {
        title: "Описание сервиса",
        body: "L Studio — локальное Android-приложение для создания музыки. Оно позволяет работать с клавиатурой, эффектами, лупером, ударными, микрофоном и экспортом аудио — в основном на устройстве, без обязательного аккаунта для базового использования.",
      },
      {
        title: "Лицензия на использование",
        body: "Издатель приложения (L Studio) предоставляет вам личную, ограниченную, неисключительную и непередаваемую лицензию на использование приложения в личных или творческих целях на условиях этих правил. Запрещается копировать, изменять, проводить обратную разработку, распространять или продавать приложение либо его части, кроме случаев, прямо разрешённых законом.",
      },
      {
        title: "Обязанности пользователя и допустимое использование",
        body: "Вы отвечаете за то, как используете L Studio, и за создаваемый контент. Не используйте приложение для незаконной деятельности, нарушения прав других лиц, распространения вредоносного контента или попыток навредить приложению, устройствам или сетям. Обеспечьте безопасность устройства и резервных копий проектов.",
      },
      {
        title: "Интеллектуальная собственность",
        body: "Приложение, дизайн, код, знаки и связанные материалы принадлежат издателю L Studio или его лицензиарам и защищены законом. Музыкальный контент и файлы, которые вы создаёте в приложении, принадлежат вам с учётом прав третьих лиц на материалы, которые вы сами добавляете (например, сэмплы).",
      },
      {
        title: "Локальная обработка и ваш контент",
        body: "L Studio построена на принципе локальной обработки. Аудио, пресеты, сессии и проекты остаются на устройстве или там, куда вы их экспортировали. Приложение не отправляет ваш контент автоматически на серверы издателя. Подробности — в Политике конфиденциальности.",
      },
      {
        title: "Доступ к микрофону",
        body: "При использовании микрофонной студии Android может запросить доступ к микрофону. Разрешение нужно только для записи и мониторинга аудио внутри приложения. Его можно отозвать в настройках устройства.",
      },
      {
        title: "Отказ от гарантий и ограничение ответственности",
        body: "Приложение предоставляется «КАК ЕСТЬ» (AS IS) без каких-либо гарантий в максимальной степени, допускаемой законом, включая пригодность для конкретной цели или бесперебойную работу. Издатель L Studio не несёт ответственности за косвенные, последующие убытки, потерю данных, упущенную выгоду или иные убытки от использования или невозможности использовать приложение — в пределах, разрешённых применимым правом.",
      },
      {
        title: "Изменения условий",
        body: "Условия могут обновляться. Дата обновления указывается вверху страницы. Продолжение использования приложения после публикации изменений означает согласие с обновлёнными условиями, если иное не требует закон.",
      },
      {
        title: "Применимое право и споры",
        body: "Споры по этим условиям или использованию L Studio рассматриваются по применимому праву места проживания издателя приложения, без указания вымышленного названия компании или юрисдикции. Ничто в условиях не ограничивает права потребителей, от которых нельзя отказаться по закону.",
      },
      {
        title: "Нет онлайн-продажи на сайте",
        body: "Сопутствующий сайт сейчас не продаёт L Studio Pro онлайн. Здесь нет оплаты и нет политики возврата для покупки на сайте, потому что платная покупка не предлагается. Бесплатная заявка Early Access, когда она открыта на главной, не является продажей. Правила лицензии и использования выше по-прежнему относятся к приложению. Если платная покупка появится позже, эти условия будут обновлены.",
      },
    ],
    contact: "Контакты",
    contactBody: "По вопросам Условий использования L Studio пишите на",
  },
  ar: {
    back: "العودة إلى الموقع",
    home: "الرئيسية",
    features: "المزايا",
    architecture: "كيف يعمل",
    guide: "دليل المستخدم",
    privacy: "الخصوصية",
    termsLabel: "الشروط",
    hero: "توضح شروط الخدمة هذه قواعد استخدام L Studio — تطبيق أندرويد محلي لإنشاء الموسيقى.",
    date: "آخر تحديث: 26 سبتمبر 2026",
    draftNote: "مسودة للمراجعة. هذا النص ليس استشارة قانونية. يجب أن يراجعه محامٍ قبل الاعتماد عليه في إسرائيل أو في أي سوق آخر.",
    principle: "استخدام عادل لتطبيق محلي.",
    principleBody: "صُممت L Studio لصنع الموسيقى على جهازك. توضّح هذه الشروط ما يمكنك فعله، وما يبقى ملكك، ومسؤوليات كل طرف.",
    scope: "نطاق الشروط",
    scopeTitle: "شروط واضحة.",
    scopeBody: "تنطبق هذه الشروط على تطبيق L Studio لنظام Android وعلى موقعه المصاحب. يعني استخدام التطبيق موافقتك على هذه الشروط. الموقع لا يبيع Pro عبر الإنترنت حالياً.",
    page: "في هذه الصفحة",
    checks: ["معالجة محلية", "ترخيص استخدام شخصي", "بدون ضمانات مطلقة"],
    sections: [
      {
        title: "قبول الشروط",
        body: "بتنزيل L Studio أو تثبيتها أو استخدامها، تؤكد أنك قرأت ووافقت على شروط الخدمة هذه وعلى سياسة الخصوصية. إذا لم توافق، فلا تستخدم التطبيق.",
      },
      {
        title: "وصف الخدمة",
        body: "L Studio تطبيق أندرويد محلي لإنشاء الموسيقى. يتيح العمل مع لوحة مفاتيح وتأثيرات ولوبر وطبول وميكروفون وتصدير الصوت — بشكل أساسي على جهازك، دون الحاجة إلى حساب للاستخدام الأساسي.",
      },
      {
        title: "ترخيص الاستخدام",
        body: "يمنح ناشر التطبيق (L Studio) ترخيصاً شخصياً ومحدوداً وغير حصري وغير قابل للتحويل لاستخدام التطبيق لأغراض شخصية أو إبداعية وفق هذه الشروط. لا يجوز نسخ التطبيق أو تعديلها أو إجراء هندسة عكسية أو إعادة توزيعها أو بيعها أو أجزائها، إلا حيث يسمح القانون صراحة بذلك.",
      },
      {
        title: "مسؤوليات المستخدم والاستخدام المقبول",
        body: "أنت مسؤول عن كيفية استخدامك لـ L Studio وعن المحتوى الذي تنشئه. لا تستخدم التطبيق لنشاط غير قانوني أو لانتهاك حقوق الآخرين أو لنشر محتوى ضار أو لمحاولة الإضرار بالتطبيق أو الأجهزة أو الشبكات. حافظ على أمان جهازك ونسخ مشاريعك الاحتياطية.",
      },
      {
        title: "الملكية الفكرية",
        body: "التطبيق وتصميمه ورمزه وعلاماته والمواد ذات الصلة تخص ناشر L Studio أو مرخّصيه وتحظى بالحماية القانونية. المحتوى الموسيقي والملفات التي تنشئها عبر التطبيق تخصك، مع مراعاة حقوق الغير في مواد تُدخلها بنفسك (مثل العيّنات).",
      },
      {
        title: "المعالجة المحلية ومحتواك",
        body: "بُنيت L Studio على مبدأ المعالجة المحلية أولاً. يبقى الصوت والإعدادات والجلسات والمشاريع على جهازك أو حيث تصدّرها. لا يرسل التطبيق محتواك تلقائياً إلى خوادم الناشر. راجع سياسة الخصوصية للمزيد.",
      },
      {
        title: "إذن الميكروفون",
        body: "إذا استخدمت استوديو الميكروفون، قد يطلب Android الوصول إلى الميكروفون. يُستخدم هذا الإذن فقط لالتقاط ومراقبة الصوت داخل التطبيق. يمكنك إلغاءه في أي وقت من إعدادات الجهاز.",
      },
      {
        title: "إخلاء الضمان وتحديد المسؤولية",
        body: "يُقدَّم التطبيق «كما هو» (AS IS) ودون أي ضمانات إلى أقصى حد يسمح به القانون، بما في ذلك الملاءمة لغرض معيّن أو التشغيل دون انقطاع. لا يتحمل ناشر L Studio المسؤولية عن الأضرار غير المباشرة أو التبعية أو فقدان البيانات أو الأرباح الفائتة أو غيرها الناشئة عن الاستخدام أو عدم القدرة على الاستخدام، في أقصى نطاق يسمح به القانون المعمول به.",
      },
      {
        title: "تغييرات الشروط",
        body: "قد تُحدَّث هذه الشروط من وقت لآخر. يظهر تاريخ التحديث أعلى الصفحة. استمرار استخدام التطبيق بعد نشر تغيير يُعد قبولاً للشروط المحدَّثة، ما لم ينص القانون على خلاف ذلك.",
      },
      {
        title: "ملاحظة قانونية والنزاعات",
        body: "تُعالَج النزاعات المتعلقة بهذه الشروط أو باستخدام L Studio وفق القانون المعمول به في محل إقامة ناشر التطبيق، دون اختراع اسم شركة أو اختصاص قضائي وهمي هنا. لا شيء في هذه الشروط يحدّ من حقوق المستهلك التي لا يجوز التنازل عنها قانوناً.",
      },
      {
        title: "لا بيع عبر الإنترنت على هذا الموقع",
        body: "الموقع المصاحب لا يبيع L Studio Pro عبر الإنترنت في الوقت الحالي. لا توجد عملية دفع ولا سياسة استرداد لشراء من الموقع، لأنه لا يُعرض شراء مدفوع. تسجيل الوصول المبكر المجاني، حين يكون مفتوحاً في الصفحة الرئيسية، ليس بيعاً. تبقى قواعد الترخيص والاستخدام أعلاه سارية على التطبيق. إذا عاد الشراء المدفوع لاحقاً، ستُحدَّث هذه الشروط.",
      },
    ],
    contact: "تواصل",
    contactBody: "لأسئلة حول شروط خدمة L Studio، تواصل عبر",
  },
};

function titleBlock(language: Language) {
  if (language === "he") return <>תנאי<br /><em>שימוש.</em></>;
  if (language === "en") return <>Terms of<br /><em>service.</em></>;
  if (language === "ru") return <>Условия<br /><em>использования.</em></>;
  return <>شروط<br /><em>الخدمة.</em></>;
}

export default function Terms() {
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
            <Link href="/privacy">{text.privacy}</Link>
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
            <span className="nav-current">{text.termsLabel}</span>
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
            <span className="eyebrow-dot" /> LEGAL / LOCAL-FIRST / L STUDIO
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
            <Scale size={28} />
            <div>
              <strong>{text.principle}</strong>
              <p>{text.principleBody}</p>
            </div>
          </div>
          <div className="privacy-intro-side">
            <FileText size={18} />
            <span>
              TERMS
              <br />
              OF USE
            </span>
          </div>
        </section>
        <section className="privacy-content container">
          <aside className="privacy-aside">
            <span className="kicker">{text.page}</span>
            <a href="#scope">{text.scope}</a>
            {text.sections.map((section, index) => (
              <a key={section.title} href={`#terms-${index + 1}`}>
                {String(index + 1).padStart(2, "0")} / {section.title}
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
              <section className="privacy-block" id={`terms-${index + 1}`} key={section.title}>
                <span className="privacy-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
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
              <p style={{ marginTop: "0.75rem" }}>
                <ShieldCheck size={16} style={{ display: "inline", verticalAlign: "middle", marginInlineEnd: "0.35rem" }} />
                <Link href="/privacy">{text.privacy}</Link>
                {" · "}
                <Link href="/">{text.home}</Link>
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
            <Link href="/privacy">{text.privacy}</Link>
            <Link className="nav-exclusive" href="/exclusive">{exclusiveNavLabel[language]}</Link>
            <span>{text.termsLabel}</span>
          </div>
          <span className="footer-copy">© 2026 L Studio / BUILT FOR SOUND</span>
        </div>
      </footer>
    </div>
  );
}
