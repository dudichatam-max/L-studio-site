# Editing L Studio from your phone

## Text

Open the root file `content.json` in GitHub and edit the values under `languages.en`, `languages.he`, `languages.ru`, or `languages.ar`. Commit the change. The GitHub Action copies this file into the published site and deploys it automatically.

Do not change the JSON punctuation, keys, or braces. Change only the text between quotation marks.

### User guide (`/guide`)

Long guide copy lives under `languages.*.guide` (title, intro, tip labels, and `sections[]`). Keep all four languages in sync when you edit a section. Optional `media` paths are relative to the site root (for example `assets/mic-window.jpg` or `assets/Preset.jpg`). Leave `media` out when there is no real screenshot yet — do not invent images.

Nav labels for the guide live under `languages.*.nav.guide`.

### Factory 64 presets (`/factory-64`)

Detail copy for the synth preset pages lives under `languages.*.factory64`.

- Synth preset pages: `pages[]` (BLACK WELL … SPIKES). Preset **names** stay in English; translate descriptions only.
- Listening note: `listenNote` (headphones / suitable speakers for low frequencies).
- Cover: `assets/factory-64-cover.png` (+ `.webp`). Show full portrait art (`object-fit: contain`), do not square-crop.
- Pack posters: `assets/factory/01-black-well.jpg` through `08-spikes.jpg`, each with a `.webp` companion. Each poster sits above its preset page. Show the full landscape art (`object-fit: contain`). Do not crop the title or logo.

### Factory drums (`/factory-64/drums`)

Drum kit copy lives under `languages.*.factoryDrums` (section title, intro, eight kit bodies, tech lines, closing). Kit **titles** stay branded English (`RAP 90'`, `HIP-HOP 2000s`, `SOFT INDIE`, `PSY PROGRESSIVE ROCK`, `BERLIN 90s TECHNO`, `TRIBAL AMBIENT TRANCE`, `GOA TRANCE`, `EXPERIMENTAL`). Tech lines stay English.

Posters: `assets/drums/01-rap-90.jpg` through `08-experimental.jpg`, each with a `.webp` companion. Show the full poster (`object-fit: contain`). Do not use `factory-64-drum-kits`.

Home Early Access copy lives under `languages.*.tester` (kicker, title, body, fields, and the success, already, full, and error lines). The homepage form posts JSON to Railway `POST /api/early-access`. Do not point it at FormSubmit. The first-44 full Pro offer is `languages.*.hero.offer` plus `hero.offerDetail`, repeated as `languages.*.tester.offer` plus `tester.offerDetail`: the first 44 people get full L Studio Pro free, with no demo limits, before the official paid launch.

The public spot meter (`42/44 available`) is manual. It does not change when someone signs up or downloads. Change it only in content: set `earlyAccess.spotsAvailable` and `earlyAccess.spotsTotal` (currently 42 and 44), and the word after the numbers in `languages.*.tester.spotsLabel` (`available`, `פנויים`, `свободно`, `متاح`). Example: David says “update to 41/44” — set `spotsAvailable` to `41`. Do not read the Railway signup count for this meter. Keep root `content.json` and `client/public/content.json` in sync; the Pages build also copies the root file into the site.

Keep all four languages in sync. Home Factory Pack uses `languages.*.factoryPack.detailCta` (link to `/factory-64`), `languages.*.factoryPack.drumsCta` (link to `/factory-64/drums`), and `languages.*.factoryPack.cta` (link to `/#early-access`). The hero primary button, the header button, and the closing home button use their existing labels and link to `/#early-access`. The homepage does not link to `/buy`. Factory 64 and the drum page use `languages.*.factory64.earlyAccessCta` for that same free Early Access link. Drum headlines count 8 kits with 8 styles in each kit, not 64 kits.

### L Studio Pro (`/buy`)

Purchase copy lives under `languages.*.pro` (same keys in Hebrew, English, Russian, and Arabic). The short label is `languages.*.nav.pro`. The homepage does not show that link while Early Access is the only signup path. Online checkout is paused: `checkoutNote` tells visitors, in all four languages, that purchases are not available on this website right now. Do not name a payment provider in this file, and do not put a download URL or a payment secret here. Optional `commerce.apiBaseUrl` is the Railway origin (no trailing slash) so the GitHub Pages buy page can call checkout when payments return. Leave it empty when the page is served by Railway itself.


## Images

The root folder `assets/` holds shared stills such as the logo, Factory Pack banner, Factory 64 cover (`factory-64-cover.png`), preset pack posters (`assets/factory/`), drum kit posters (`assets/drums/`), developer photo, and Preset still. Replace a file using the same filename and commit it. The GitHub Action copies root `assets/` into the website automatically. The MIC feature still (`mic-window.jpg`) lives under `client/public/assets/`.

## Feature videos

Upload these exact filenames into the root `assets/` folder (case-sensitive), then commit:

- `Sound.mp4`
- `Loop.mp4`
- `Pad.mp4`
- `Drum.mp4`

They play in the Features section when each item is opened. MIC keeps its still image only.

## Publishing

In the repository settings, set GitHub Pages > Build and deployment > Source to `GitHub Actions`. Every push to `main` then runs `.github/workflows/deploy-pages.yml` and publishes the latest version.
