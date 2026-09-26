# L Studio Site

אתר תדמית סטטי, רספונסיבי ורב־לשוני עבור **L Studio**, סביבת יצירה מוזיקלית מיקרוטונלית בזמן אמת לאנדרואיד.

## מה כלול

האתר כולל עמוד בית עם מיתוג L Studio והלוגו המקורי, הדמיית קונסולת אודיו, מודולי SOUND / LOOP / DRUM / MIC, מקלדת מיקרוטונלית אינטראקטיבית, עמוד מדיניות פרטיות נפרד בנתיב `/privacy`, עיצוב RTL/LTR רספונסיבי, ופלטת צבעים של שחור, זהב ולבן בהשראת ממשק האפליקציה.

בורר השפה עובד באופן מקומי, שומר את הבחירה בדפדפן ומתרגם את ממשק האתר בין עברית, אנגלית, רוסית וערבית. בחירה בערבית או בעברית מפעילה RTL; אנגלית ורוסית מוצגות ב־LTR.

## הפעלה מקומית

```bash
pnpm install
pnpm dev
```

## רכישת L Studio Pro (Railway)

עמוד `/buy` מציג את L Studio Pro (ברירת מחדל 4.00 דולר, קובץ APK). התשלום המקוון מושהה: העמוד הציבורי לא טוען את PayPal ולא קורא ל-create-order או capture. נתיבי PayPal בשרת נשארים לניקוי מאוחר יותר. אחרי תשלום מאומת (כשהקופה תחזור) נוצר קישור הורדה חד-פעמי לשעה. קובץ ה-APK לא נכנס ל-git ולא נחשף בנתיב ציבורי קבוע.

GitHub Pages נשאר אתר התדמית. הקופה וההורדה רצות על שירות Railway (`pnpm start`). מדריך מלא, כולל משתני סביבה, בדיקת Sandbox והנחת ה-APK הפרטי: [docs/PAYPAL_RAILWAY.md](docs/PAYPAL_RAILWAY.md).

בדיקת שרת מקומית בלי סודות PayPal:

```bash
pnpm check:commerce
```

### Railway Variables

הגדירו ב-Railway, בלי לשים סודות במאגר:

`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` (`sandbox` או `live`, ברירת מחדל `sandbox`), `PUBLIC_BASE_URL`, `DOWNLOAD_TOKEN_SECRET`, `PRODUCT_PRICE_USD` (ברירת מחדל `4.00`), `PRODUCT_NAME`, `SUPPORT_EMAIL` (ברירת מחדל `dudichatam@gmail.com`).

APK פרטי, אחת מהאפשרויות: `APK_PATH` (קובץ על דיסק, למשל volume ב-`/data`) או `APK_SOURCE_URL` (https שהשרת מוריד ל-`DATA_DIR` בעלייה). למאגר GitHub פרטי השאירו את הריפו פרטי והוסיפו `APK_GITHUB_TOKEN` (fine-grained PAT עם Contents לקריאה בלבד על `dudichatam-max/L-studio`). הצעדים מהטלפון והכתובות המדויקות: [docs/PAYPAL_RAILWAY.md](docs/PAYPAL_RAILWAY.md). `DATA_DIR` מומלץ `/data` עם Railway Volume. אופציונלי: `PAYPAL_WEBHOOK_ID`, `APK_SHA256`, `RESEND_API_KEY` + `RESEND_FROM`, או `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. בלי ספק מייל, עמוד ההצלחה עדיין מציג את הקישור והלוג מציין שדילגנו על שליחת המייל. מייל ההורדה כולל גם קישור למדריך. `SITE_PUBLIC_URL` (ברירת מחדל `https://l-studio.studio`) ו-`GUIDE_URL` (ברירת מחדל `https://l-studio.studio/guide`) לא חייבים להיות מוגדרים ב-Railway.

בריאות: `GET /api/health`. פורט: `PORT`. Node 22. דוגמה ריקה: `.env.example`.

## בדיקות לפני העלאה

```bash
pnpm check
pnpm build
```

## העלאה ל־GitHub פרטי

האתר הוא static frontend בלבד ואינו דורש שרת, מסד נתונים או מפתח API. אפשר להעלות את כל תוכן התיקייה הזו ל־repository הפרטי שלך ולפרסם מתוך GitHub Pages או מכל שירות static hosting אחר.

## לפני פרסום מדיניות הפרטיות

יש להשלים בעמוד `client/src/pages/Privacy.tsx` את פרטי הקשר הרשמיים של בעל האפליקציה או של ערוץ התמיכה. נוסח המדיניות מבוסס על תצורת הפרויקט שסופקה: הרשאת מיקרופון, עיבוד אודיו מקומי, אחסון מקומי וייצוא יזום של קבצים.


## פריסה חיצונית

החבילה מתאימה גם לפריסה מחוץ ל-Manus. נכס הלוגו נטען מכתובת CDN ציבורית יציבה. עבור GitHub Pages או Cloudflare Pages, השתמשו בפקודת הבנייה `pnpm build` והגדירו את תיקיית הפלט ל-`dist/public`.

