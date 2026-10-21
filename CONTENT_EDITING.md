# Editing L Studio from your phone

## Text

Open the root file `content.json` in GitHub and edit the values under `languages.en`, `languages.he`, `languages.ru`, or `languages.ar`. Commit the change. The GitHub Action copies this file into the published site and deploys it automatically.

Do not change the JSON punctuation, keys, or braces. Change only the text between quotation marks.

### User guide (`/guide`)

Long guide copy lives under `languages.*.guide`. The page has seven top-level topics in `groups[]`: Getting started, Sound, Pad, Drum, Loop, Mic, and Settings and sessions. Each group has a `body`, a `media` image, `sections[]` for its subtopics, `tipsBeginner` (exactly 3 strings), and `tipAdvanced` (1 string). The side menu (a collapsible bar on phones) lists the topics only. The active topic opens its subtopics. See the 2026-10-16 note below. Write Hebrew first, then the same facts in English, Russian, and Arabic. Keep all four languages in sync. Say what a tap, a drag, or a long-press does. Do not write that a control is or is not a button. The only source for behavior is the code of `dudichatam-max/L-studio` branch `google-play-pro`: the control map at commit `468c5bce` (1.07) plus the 1.08 changes at merge commit `6fc86da`. If the map does not say what a control does, leave that sentence out. Optional `media` paths are relative to the site root. Every published group and section needs a real cropped app photo. Do not invent images. Crop off the clock, battery, signal, and Android navigation bar. Do not cut off labels. Do not use an em dash. Do not call L Studio a DAW. Do not add a download link or a ZIP link. There is no Redo control. Do not add one. Back is on Mic and Loop only. A tap restores the most recently cleared take on that screen. It does not change screens. It is enabled only when a restore slot exists. LIVE still allows Back when that slot exists. Optional `images` adds more real screenshots after `media`. Each still sits in the same 1px gold border (radius 10px). The image uses `object-fit: contain` so the whole photo stays visible. On a narrow screen the photo moves under the text at full column width. Do not add an empty border. The guide page has no illustration video. Homepage Shorts, Exclusive, and Updates keep their own videos.

Home feature tabs (David 2026-10-08): the Play with Sound menu uses the Google Play store screenshots under `assets/play/` (and the same files in `client/public/assets/play/`): Sound `01-sound-fx`, Loop `12-looper-8-colours`, Drum `04-drum-machine`, Pad `05-live-pad`, Mic `07-mic-fx`. These are the recommended Play set. Keep the full store frame with its headline. Alts live in `playShotAlt` in `client/src/pages/Home.tsx`. Bump `PLAY_SHOT_VER` when you replace a file.

Leave `assets/mic-window.jpg` in git when another page still uses it. Do not replace the Updates stills in `assets/updates/` unless the app screen they show has changed. `looper-back.jpg` now shows the 1.08 Loop screen. Guide images are the approved posters (`assets/posters/`) and David's real phone shots under `assets/guide/` (and the same files in `client/public/assets/guide/`), each in 4 files: `NAME.jpg` and `NAME.webp` at 720 px and `NAME-w360.jpg` and `NAME-w360.webp` at 360 px. The guide uses `lyrics-phone`, `settings-phone`, `drum-samples-phone`, `voice-phone`, `custom-frequency-phone` (source: `l-studio-team-docs/assets/guide-1.10-shots/`, 720 wide, bars already cropped) and, from David's 2026-10-16 batch (`full-1..11.png`, 720x1640, cropped here to y 78..1550 for full screens or to the dialog plus a margin for short dialogs), `page-name-phone`, `pattern-repeats-phone`, `scales-phone`, `presets-phone`, `load-console-phone`, `drum-fx-phone`, `looper-fx-phone`, and `mic-fx-phone`. Crop the status bar (top 78 px) and the Android navigation bar (below y 1550). Never draw or edit the UI. Do not redraw them. Do not mix styles on one page. The 1080x1920 test-environment captures (`ui-1.10-final`) are not real screenshots and must not be used. The older device shots in `ui-1.10-20261013/14` show an older layout and are not used. Sections without a real image keep their text and show no placeholder; the open list is `guide-audit/missing-real-shots.md` in the team workspace. There is no mic page 1/2 section. There is no Redo image. Whoever buys Pro also gets the Exclusive pack free, at no extra cost, and there is no download button. Do not add a ZIP link.

Nav labels for the guide live under `languages.*.nav.guide`.

### Factory 64 presets (`/factory-64`)

Detail copy for the synth preset pages lives under `languages.*.factory64`.

- Synth preset pages: `pages[]` (BLACK WELL … SPIKES). Preset **names** stay in English; translate descriptions only.
- Listening note: `listenNote` (headphones / suitable speakers for low frequencies).
- Cover: `assets/factory-64-cover.png` (+ `.webp`). Show full portrait art (`object-fit: contain`), do not square-crop.
- Pack posters: `assets/factory/01-black-well.jpg` through `08-spikes.jpg`, each with a `.webp` companion. Each poster sits above its preset page. Show the full landscape art (`object-fit: contain`). Do not crop the title or logo.

### Factory drums (`/factory-64/drums`)

Drum kit copy lives under `languages.*.factoryDrums` (section title, intro, eight kit bodies, tech lines, closing, styles heading, demo label). Kit **titles** stay branded English (`RAP 90'`, `HIP-HOP 2000s`, `SOFT INDIE`, `PSY PROGRESSIVE ROCK`, `BERLIN 90s TECHNO`, `TRIBAL AMBIENT TRANCE`, `GOA TRANCE`, `EXPERIMENTAL`). Tech lines stay English. Each kit lists exactly 8 English style names in `kits[].styles`. Keep those names identical in Hebrew, English, Russian, and Arabic. Do not invent style names. `stylesHeading` and `demoLabel` use the same translations as Exclusive (Styles / סגנונות / Стили / الأساليب and Demo video / סרטון הדגמה / Демо-видео / فيديو العرض). YouTube Short demos are not wired yet. To attach one later, add a YouTube Short id in `STYLE_DEMOS` in `client/src/pages/FactoryDrums.tsx`, keyed as `kitId::Style Name`, the same click-to-expand pattern as Exclusive. Style names stay English.

Posters: `assets/drums/01-rap-90.jpg` through `08-experimental.jpg`, each with a `.webp` companion. Show the full poster (`object-fit: contain`). Do not use `factory-64-drum-kits`.

### Exclusive (`/exclusive`)

Drum packs live under `languages.*.exclusive`. This page is not Factory Drums: it shows the eleven Exclusive packs. Pack **names**, English taglines, style names, and the BPM / channels / styles line stay in English. Translate the nav label (`languages.*.nav.exclusive` and `exclusive.navLabel`, keep them the same), the page title, intro, styles heading, the pack badge, the demo label (`demoLabel`), and the homepage CTA (`homeTitle`, `homeBody`, `homeCta`). Bone March (Victory Peak), Deep Roots (Healing Journey), and Twisted Spores (Kreepy Bastard) each have a collapsed YouTube Short on the page. Deep Ocean and Organic Steps have no Short. Style names stay English. Do not commit video files, and do not add prices, a buy button, a download button, or a download label. The Deep Ocean Pro ZIP is reference only (`https://github.com/dudichatam-max/L-studio-drum-kits/releases/download/drum-kit-deep-ocean-v2/Deep-Ocean-v2.zip`). The Kreepy Bastard Pro ZIP is reference only (`https://github.com/dudichatam-max/L-studio-drum-kits/releases/download/drum-kit-kreepy-bastard-v2/Kreepy-Bastard-v2.zip`). Do not put those links, or any other ZIP link, on the Exclusive page. Whoever buys Pro also gets the Exclusive pack free, at no extra cost, and there is no download button. Do not say Exclusive is a separate purchase. Every pack card uses the included badge (`comingSoon`: Included with Pro / כלול ב-Pro / Входит в Pro / مع Pro). There is no download link on `/exclusive`.

Posters: `assets/exclusive/09-afro-techno.jpg`, `10-victory-peak.jpg`, `11-healing-journey.jpg`, `12-deep-ocean.jpg`, `13-kreepy-bastard.jpg`, `14-brazilian-trap.jpg`, `15-lofi-desert.jpg`, `16-middle-tech.jpg`, `17-organic-steps.jpg`, `18-ithaca-road.jpg`, and `19-ithaca-remains.jpg`, each with a `.webp` companion. Show the full landscape art (`object-fit: contain`). Do not crop the title or logo. The homepage teaser uses one fan, `assets/exclusive/exclusive-hero-homepage-fan.jpg` (and `.webp`), not a grid of thumbs.

Tester signup is closed (David 2026-10-08): all 44 spots are taken. The homepage has no signup form and does not call the Railway signup API. `languages.*.tester` holds the closed copy: `kicker`, `title`, `body`, `status` ("Tester signup is closed. All 44 spots are taken."), `spotsLabel` (taken), `spotsStatus` (the ribbon's right-hand text), `imageAlt`, and `freeAccess` (the chip under the copy). `languages.*.launch` holds the launch note: `headline` ("Coming soon to Google Play."), `price` ("L Studio Pro, $8.", written 8$ in Hebrew and Arabic), and `note` (both together). David set the $8 price, one-time payment. Do not add a Google Play link until the public listing exists. Do not write a launch month or an exact launch day (David 2026-10-16): the site says "coming soon" only (HE בקרוב, RU скоро, AR قريباً).

The spot meters (the slim ribbon under the header, and the closed panel in the Early Access section) show taken spots: `spotsTotal` minus `spotsAvailable`. They read the manual numbers `earlyAccess.spotsAvailable` (now `0`) and `earlyAccess.spotsTotal` (`44`), so both show `44/44`. The ribbon is plain text, not a link. Keep root `content.json` and `client/public/content.json` in sync; the Pages build also copies the root file into the site.

Keep all four languages in sync. Home Factory Pack uses `languages.*.factoryPack.detailCta` (link to `/factory-64`), `languages.*.factoryPack.drumsCta` (link to `/factory-64/drums`). Factory Pack has no early-access button. The homepage Exclusive banner uses `languages.*.exclusive.homeTitle`, `homeBody`, `homeCta` (link to `/exclusive`), and `homeImageAlt`. The copy counts eleven Exclusive packs and says whoever buys Pro also gets the Exclusive pack free, at no extra cost, and there is no download button. The fan image stays the current nine-poster fan until a new fan exists. The `/exclusive` page lists the eleven live packs. The homepage Factory Pack cover is `assets/factory-pack-box.jpg` and `assets/factory-pack-box.webp` (1120×740, cache-bust query `?v=108-packs`). It shows the three official pack covers from the app's Pro welcome screens, in the app's order: Factory 64 (`factory64_promo`), Drum Kits (`drum_kits_promo`), Exclusive (`exclusive_unlock_promo`), from `app/src/main/res/drawable/` in the app repo. Its alt text is `languages.*.factoryPack.coverAlt`. The Early Access poster is `assets/factory-pack-hero-v4.png`. When you replace either image, change the filename or the query so phones do not keep the previous file. Hidden for now (2026-10-09, until a new video with the new interface exists): the hero app screenshot (`assets/hero/app-looper-420.webp`, `app-looper-720.webp`, `app-looper-720.jpg`), the "Meet L-studio" section with the intro Short (YouTube `a2CGFDQkZ80`, poster `assets/meet-short-poster.*`), the hero primary button (`languages.*.hero.ctaPrimary`) and the header button (`languages.*.nav.cta`), which both linked to `/#meet`. The files and the copy (`languages.*.meet`: kicker, title, body, videoTitle) stay in place. To bring them back, set `SHOW_HERO_SHOT` and/or `SHOW_MEET_VIDEO` to `true` at the top of `client/src/pages/Home.tsx`. For a new video, change `INTRO_SHORT_ID` and the poster files in the same file. The hero box is a plain launch note (`launch.headline`, then `launch.price` and `tester.status`), not a link. The closing home section shows `launch.headline` and `launch.price` as a plain note instead of a button. The homepage does not link to `/buy`. Factory 64 and the drum page show `languages.*.factory64.launchNote` as a plain note instead of the old early-access button. Drum headlines count 8 kits with 8 styles in each kit, not 64 kits.

### L Studio Pro (`/buy`)

Purchase copy lives under `languages.*.pro` (same keys in Hebrew, English, Russian, and Arabic). David 2026-10-08: 1.08 is live on Google Play. There is a single app version, Pro, paid through Google Play once it is released. A free demo is coming soon and will be downloadable from this website (David 2026-10-16): say "soon" only, no date, and add no demo download link until it exists. The old "no demo" note is retired. `lede`, `body`, and `includes` say L Studio Pro for Android is coming soon to Google Play for $8 (version 1.10, 77.5 MB), with no month and no date and do not call it a direct APK install. Keep `shared/pro-copy.json` the same as `languages.*.pro`. Do not add a Play link or a download link. The only price on the site is David's $8 launch price. Do not write that Pro "unlocks" things, because Pro is the only app version (a free demo is coming soon, not yet available): Pro "comes with" the Factory Pack, the drum kits, and the Exclusive pack. The success-page lines (`successBody`, `downloadCta`, `installNote`) belong to the paused website checkout and are left as they are. The short label is `languages.*.nav.pro`. The homepage does not link to `/buy`. Online checkout is paused: `checkoutNote` tells visitors, in all four languages, that purchases are not available on this website right now. Do not name a payment provider in this file, and do not put a download URL or a payment secret here. Optional `commerce.apiBaseUrl` is the Railway origin (no trailing slash) so the GitHub Pages buy page can call checkout when payments return. Leave it empty when the page is served by Railway itself.

### Updates (`/updates`)

Update copy lives under `languages.*.updates`. The same items are the fallback in `client/src/lib/updatesFallback.json`. Keep Hebrew, English, Russian, and Arabic in sync, including alts. Keep root `content.json`, `client/public/content.json`, and `client/src/lib/updatesFallback.json` aligned. The page title and intro describe what is already out (David 2026-10-08): EN "What's new in L Studio." / "Version 1.10 is coming soon to the store. L Studio Pro is coming soon to Google Play, for $8." (no month, David 2026-10-16), with the same idea in HE, RU, and AR and in the `updates` meta description in `shared/seo.ts`. Update the version number in the intro when a new version reaches Google Play.

A card can show stills beside the text. Prefer `images`, an array of site-root paths such as `/assets/updates/drum-fx.jpg`. You can also set one `image`, then add more paths in `images`. The card shows `image` first, then any extra `images` that are not already listed. Alts are per language: `imageAlts` is one string per screenshot, in that same order, or use a single `imageAlt`.

Optional `href` and `cta` add a text link under the summary. Set both, in that language, or the card shows neither. `href` is a site path such as `/exclusive` or `/guide`. A home-page hash such as `/#early-access` is a normal link. `cta` is the short label.

Put each still in `assets/updates/` as a `.jpg` and a matching `.webp`, and copy both into `client/public/assets/updates/` so local preview matches the site. The Pages build copies root `assets/` into the site. Show the full still (`object-fit: contain`). Do not crop app titles or control labels. Crop the Android status bar (clock, battery, icons) off phone screenshots, and crop the system navigation bar at the bottom when that does not cut app UI. Leave promotional art intact. Leave `images` off a card that has no still. A card can instead embed one YouTube video: set `videoId` (for example `f6bLB0IP1ks`) and a per-language `videoTitle`. It renders a lazy `youtube-nocookie.com/embed` iframe in a 9:16 frame beside the text (full width up to 300 px on phones). The item `app-1-12-mixer-demo` (status `upcoming`, first in the list, no ticker line) uses it for the 1.12 mixer window demo Short; 1.12 is not released, so never call it live or on Google Play. The site version stays 1.11. Do not invent stills.

The site never offers Exclusive kit downloads or ZIP links. Whoever buys Pro also gets the Exclusive pack free, at no extra cost, and there is no download button. This website only describes the packs.

Current pairings:

Status rule (David 2026-10-08, 06:16): 1.08 is in the Google Play test, and the public launch is "coming soon" at $8 (no month, David 2026-10-16). Shipped items that describe the app use "In the Google Play test now, version 1.08:" (HE "עכשיו בבדיקה ב-Google Play, גרסה 1.08:"). The shipped status label reads Ready (מוכן, Готово, جاهز). When the public listing is live, change the prefix to "Now on Google Play" and the label back. The app size on the site is 60.6 MB (from the 1.08 Play APK, 63,506,221 bytes ≈ 60.6 MiB; the Play listing page was not reachable from this box). Keep the ticker short and interesting. Do not invent features.

- `sound-fx-looper-pages`: status `shipped`. `sound-fx.jpg` and `looper-pages.jpg`. `href` is `/guide`.
- `exclusive-packs-gallery`: status `shipped`. Still is `exclusive-packs-poster.jpg`. `href` is `/exclusive`. Whoever buys Pro also gets the Exclusive pack free, at no extra cost, and there is no download button.
- `mic-fx-and-back`: status `shipped`. Title Mic FX, Drum FX + Back. Images `mic-fx.jpg` and `drum-fx.jpg`. Back brings back the last cleared take only.
- `studio-workflow-refresh`: status `shipped`. Title Live mode, lyrics, Looper FX. `lyrics.jpg` and `looper-fx.jpg`. Do not call L Studio a DAW. Do not mention Comp or Gate. Do not call Redo undo.

## Images

The root folder `assets/` holds shared stills such as the logo, Factory Pack banner, Factory 64 cover (`factory-64-cover.png`), preset pack posters (`assets/factory/`), drum kit posters (`assets/drums/`), Exclusive posters (`assets/exclusive/`), developer photo, and Preset still. Replace a file using the same filename and commit it. The GitHub Action copies root `assets/` into the website automatically.

## Play with sound

The homepage block `02 / PLAY WITH SOUND` ("Just open it and play.") shows one full app screen under each category, in this order: Sound, Mic, Loop, Pad, Drum. The stills are `assets/guide/sound-screen.jpg`, `mic-screen.jpg`, `loop-screen.jpg`, `pad-screen.jpg`, and `drum-screen.jpg`. Show the whole screen (`object-fit: contain`). Do not put the old feature videos (`Sound.mp4`, `Loop.mp4`, `Pad.mp4`, `Drum.mp4`) or `mic-window.jpg` back in this block. Leave Shorts, Exclusive, and Factory Drums videos as they are. Keep the eyebrow, the headline, and the paragraph. Keep Hebrew, English, Russian, and Arabic on the same screens.

## Publishing

In the repository settings, set GitHub Pages > Build and deployment > Source to `GitHub Actions`. Every push to `main` then runs `.github/workflows/deploy-pages.yml` and publishes the latest version.

### App 1.09 (on Google Play test, 2026-10-10)

App 1.09 (tag `v1.09`, `83045ad` on `google-play-pro`) is in the Google Play test (David, 2026-10-10 22:35). The updates item `app-1-09-waves-drums` is `shipped` and starts "In the Google Play test now, version 1.09:". Older items start "Since version 1.08:". The ticker keeps four items: 1.09, Sound FX + looper colors, Exclusive in Pro, and Live mode + lyrics + Mic FX + Drum FX (the old Mic FX/Back item was merged into it). The version reads 1.09 in the hero kicker, `updates.pageIntro`, the `updates` and home meta descriptions in `shared/seo.ts`, the Pro copy (`content.json` and `shared/pro-copy.json`), JSON-LD `softwareVersion`, and the Privacy and Terms labels. The size stays 60.6 MB: the v1.09 Play APK in the GitHub release is 63,509,827 bytes = 60.6 MiB. The $8 public launch said October 2026 then; since 2026-10-16 the site says "coming soon" with no date. The guide line "The tour was updated for 1.08" is history and stays.

What 1.09 does, checked in the app code: a tap on a wave plays only that wave, and a long-press turns a wave on or off so several waves play at once on both keyboards. Each wave button shows an icon. Presets save which waves are on (`_waves`), and an older preset lights only its one wave. A long-press on Presets saves into the loaded preset ("Preset saved" or "No preset loaded"), and the window opens on the page of the loaded preset. On Drum, BPM, Swing and row volumes changed while playing carry into the next patterns, and Save writes them into all 8 patterns. Do not write that each wave stores its own sound values, and do not write that the top keyboard keeps a separate preset. Neither is in 1.09.

The guide Sound screen is `assets/guide/sound-screen-109.jpg`, and the wave row is `assets/guide/sound-waves-109.jpg`. The homepage windows menu uses the approved 1.09 Play assets for Sound (`assets/play/01-layer-waveforms`) and Loop (`assets/play/03-looper-pages`), 720×1280 webp + jpg, cache version `109-play`. Pad, Drum and Mic keep the 1.08 Play assets.

### Feature graphic (2026-10-10)

The homepage shows the 1024×500 feature graphic directly under the updates ticker, used as is: `assets/feature-graphic-1024.webp/.jpg` and `assets/feature-graphic-800.webp`, with alt text `featureGraphicAlt` in `client/src/pages/Home.tsx`. The picture itself still says "Microtonal music workstation" and "L-studio". Replace the files with a new export when the designer fixes that wording.

### Demo video toggle (2026-10-11)

Under the feature graphic, a "Demo video" tab (`demoCopy` in `client/src/pages/Home.tsx`, HE "סרטון הדגמה") opens the YouTube Short `d89y14QAHuA` (`DEMO_SHORT_ID`) in a 9:16 frame. It starts closed. The player loads only after a tap on the poster (`assets/demo-short-poster.webp/.jpg`, taken from the YouTube thumbnail). To change the video, change `DEMO_SHORT_ID` and the poster files.

## App 1.10 draft (not on Google Play yet)

- Guide Loop, Mic, Drum, and Sound (Frequencies, Drive) text, the new Loop Editor section, and the 1.10 guide shots (`assets/guide/*-110.jpg`) describe app 1.10 (final commit ea63c40). Settings also covers New session, the fuller session save, the load confirm and backup, and rename on import (ea63c40). The new Factory vocals (Voice 7 to 40) are left out until David approves their sound.
- Homepage windows menu: the Loop and Drum tabs use the approved 1.10 Play assets `assets/play/110-03-looper` and `110-01-live-sample-swap` (`PLAY_SHOT_VER = "110-play"` in `Home.tsx`). The Loop Editor Play asset (02) is not used on the homepage yet.
- Updates: item `app-1-10-loop-editor-drums` is `in_progress` and says "coming in the next Google Play update". When 1.10 is live on Google Play, set it to `shipped`, change the wording, and update the version and size shown on the site (still 1.09 / 60.6 MB).
- The Mic guide image is `assets/guide/mic-screen-110.jpg` (David's `ui-new-3.png`, Mic screen with Redo). `ui-mic.png` in team docs shows the Loop tab, not Mic, and is not used. `drum-screen-110.jpg` is now from `ui-new-4.png`.
- Settings and Tune frequencies use David's 1.10 shots `assets/guide/settings-window-110.jpg` (ui-new-1, New session first) and `freq-window-110.jpg` (ui-new-2, My Presets 1-8 with Save). The older `settings-window.jpg` and `freq-window.jpg` stay in git but are no longer used by the guide.
- Updates items can carry optional `sections: [{ "title", "bullets": [] }]`, shown as grouped lists under `summary` (`UpdateItemSection` in `client/src/lib/updatesCopy.ts`). Items without it show only `summary`. The 1.10 item uses it for the team-lead-approved text (Looper, Loop editor, Drums, Frequencies, Session), checked against app commit e6b6e3c. Left out on purpose: per-channel sample counts (not checkable in code), "Load Kit and Save Kit are gone" (1.09 never had them), and the Voice vocals (on hold). Redo is written as the code does it: it brings back a take that was recorded over or cleared, and in the looper also one from before a trim.
- Ticker: each item shows its `ticker` line (falls back to `title`), plus any `tickerMore` lines, each linking to the item. Before this, the ticker showed `title` only.
- Voice (David approved the sound, 2026-10-13): row 8 is Voice, vocals only, 40 Factory, 18 Exclusive, 33 Authentic, 91 in all. App commit e6b6e3c: `assets/drum_vocals` has 33 vocals (Factory) and `assets/drum_vocals_authentic` has 33 (Authentic). `DrumVocalAllowlist` adds 7 kit vocals from Experimental (Factory) and 18 from Afro-Techno, Ithaca-Remains and Kreepy-Bastard-v2 (Exclusive).
- Drum guide: `assets/guide/voice-110.jpg` is the 1.10 Voice picker (Authentic tab, 33), from David's `ui-voice.png`. Guide groups can carry `imageAlts: { "<path>": "alt" }`; images without an entry use the group title as alt.

## App 1.10 follow-up (f091717 / 7d9932c, 2026-10-14)

- Loop/Mic editors: drum-rhythm boxes are 1-8 (tap on/off, long-press for Pattern repeats 1-10 or infinity). No boxes on = free loop. Old 1-10 / typed 1-88 repeats are gone (migrated to free loop).
- Mic Editor: same component as Loop Editor, opens by tapping a Mic channel visualizer.
- Pad `+` opens the upper keyboard shared with Sound (`dualKeyboardVisibleOn`).
- Drums: each rhythm keeps samples, volumes and L/R; Save and switching rhythms write into the current kit (`commitDrumRhythmAndKit`).
- Settings label is `Benchmark` (capital B).
- New guide shots from `ui-1.10-20261014/`: mic, settings, loop-editor, looper, pad, pad-dual-keyboard. Sound / Drums / Tune frequencies / Sound FX shots still pending.

## Shots 2026-10-14 (0b5eaf5)

- Guide: `sound-screen-110`, `sound-fx-window-110`, `freq-window-110` (2-decimal Hz), `drum-screen-110` from `ui-1.10-20261014/`.
- Homepage windows menu: Sound `play/110-04-sound`, Pad `play/110-05-pad-dual` (dual keyboard with +).
- Hint above Looper/Mic channels: `Tap the visualizer to edit` (`hint_tap_visualizer_edit`). Tutorial is 68 steps (was 63).

## 1.10 extension (app tip 12cdde6)
- Drum screen: PLAY/STOP, REDO (undo stack), +4 (Pro), SAMPLES panel with arrows next to DRUM KIT, CLEAR replaces the drum Save, auto-save, empty rhythm copies the one you came from.
- New guide section drum/drum-sound: 6 knobs GAIN 0..+18 dB, SQUEEZE 0..100, ATTACK 0..200 ms, SUSTAIN 0..100%, RELEASE 5..2000 ms, REVERB 0..100%, per row per rhythm, live waveform. No image yet (see /workspace/site-1.10/missing-images.md).
- Pattern repeats: COPY/PASTE (paste keeps the target repeat count, BPM and swing). Drum styles: page banners. Scales: SCALES title. Waves: tap toggles, one always on (no long-press).
- Updates item: Drums bullets rewritten, new Look section, a tickerMore line and a summary sentence. Tablet support: not in code, not mentioned.

## 1.10 extension 2 (app branch tip ad2ceeb)
- New guide section sound/live-mode, written from StudioUiMode.kt and its call sites. Locked in LIVE: Clear (Looper, Mic), file Load on drum rows and Looper channels only (Mic channels have no Load key in 1.10, fixed 2026-10-16), Import (Loop, Mic, Drum styles), kit Load, DRUM KIT arrows, numeric typing on knobs, channel names, Looper page name (long-press). Open in LIVE: Rec, Play, Stop, M, S, Redo, Save, Export, sample list and arrows, drum CLEAR. Re-check this list when the app changes.
- Settings: Load Console rows (LOAD, SAVE, EDIT, X), Export selected, Import session, real progress window. Settings has only a Close key (no X). Language list closes with Close (was Dismiss).
- Drum Kits key (was Style) with the gold HOLD caption. Scales key reads Scale off. Mic: top row without MIC title and without monitor slots, no per-channel Gate knob.
- Looper and Mic: M (mute) and S (solo), STOP holds until PLAY, visualizer keeps moving. A gold MM:SS clock shows while MIDI or WAV records.
- Not mentioned on purpose: tablet layout (content capped at 440 dp, phones locked to portrait), Android 7/8 items, circular recording buffer, safe session names, sample rate in session.
- All of this is 1.10 in smoke test, not on Google Play. Keep PR #74 a draft until 1.10 is released.

## 1.10 posters (approved store/site posters, 8 EN + 8 HE; new set of Oct 16)
- Files: `assets/posters/{en,he}/pNN-slug-w360|w630.{webp,jpg}` (also in `client/public/assets/posters/`). Sources are the 1080x1920 PNGs `L-Studio-1.10-store-<EN|HE>-NN-<name>.png` in `/workspace/store-posters/upload/` (black background, 3 screens, L STUDIO logo; older set replaced). 9:16, webp 80 and jpg 82, widths 360 and 630. Helper: `client/src/lib/posters.ts` (URLs, sizes, alt texts for the homepage).
- Order and names: 01 sound, 02 sound-live, 03 pad, 04 mic, 05 loop-editor, 06 looper, 07 drums, 08 drum-styles.
- Language: HE uses `posters/he`. EN, RU and AR use `posters/en` (no RU or AR posters exist). In `content.json` the paths are per language, so a new RU or AR poster set only needs new files and new paths.
- Homepage windows menu: Sound = 1 + 2, Loop = 5 + 6, Drum = 7 + 8 (two columns on desktop, a swipe row on phones), Pad = 3, Mic = 4. Gold frame like the guide. Change the mapping in `playPosters` in `Home.tsx`.
- Guide: poster as the group image (sound 1, pad 3, drum 7, loop 6, mic 4) and in sections (sound/live-mode 2, drum/drum-styles 8, loop/loop-editor 5, mic/mic-editor 5). Paths that start with `assets/posters/` render as `<picture>` with a webp twin and fixed 630x1120. Alt texts live in `imageAlts`.
- Updates: the 1.10 item uses poster 5. `imageAlts` is a list there, parallel to `images`.
- Pre-1.10 Sound strips (octave, drive-slider, volume-knobs, keys, sound-waves-109, sound-tones) and drum-styles-window are not used any more, because posters cover those screens. The files stay in `assets/guide/`.
- Poster captions are baked into the images. Round 2 (Oct 15, 20:05) fixed poster 3 (pad wording), poster 4 (per-channel HPF, presence, FX, mute, solo), the dashes, "color" and the page name "Page 1". Cache: bump `POSTER_VER` in `client/src/lib/posters.ts` whenever poster files are replaced (used by Home, Guide and Updates). Alt texts: `posterAlt` in `posters.ts` (homepage), `imageAlts` in `content.json` (guide, updates). Keep alts in sync with the baked captions.
- Oct 16 set: captions checked against ad2ceeb. 5 waveforms, 16 keys (2 x 8), LIVE locks some buttons, Mic page 1 Vocal 1-3 and page 2 Guitar, Bass, Inst, Loop Editor trim/loop/EQ/drum-rhythm follow, 32 channels (8 pages x 4), drums 4 channels (8 with Pro) x 16 steps, 8 style packs + 11 Exclusive pages, 288 factory + 66 Voice + 704 Exclusive = 1,058 built-in samples (Exclusive ships in the Play AAB). HE posters write the brand as "אל סטודיו" (a transliteration, not the Latin L Studio).
- Feature graphic (homepage, under the ticker): `assets/feature-graphic-{en,he}-{640,800,1024}.webp` and `-{640,1024}.jpg`, 1024x500. HE uses the HE one, EN/RU/AR the EN one. Version query `FEATURE_GRAPHIC_VER` in `Home.tsx`. Alt text `featureGraphicAlt`.
- JSON-LD `screenshot` (shared/seo.ts APP_SCREENSHOTS and the static copy in client/index.html) now points at the EN posters 1, 6, 7, 3, 4. The old `assets/play/` Play shots and the 1.09 feature graphic were removed because nothing uses them any more.

## Version 1.10 prepared (Oct 16, draft only, own commit so it can be reverted)
- App 1.10 (versionCode 10) is merged in the app repo: tag `v1.10`, head `ad2ceeb6`. It is NOT on Google Play yet. David uploads it himself, closed test first. The site must not say it is live in the store. Wording: "in the next Google Play update" or "in testing".
- Places that carry the version: `hero.kicker` (4 languages) and the `pro` body text in `content.json` (and `client/public/content.json`); `shared/pro-copy.json` (Pro body); `updates.pageIntro` and the same text in `shared/seo.ts` (updates page description); the home descriptions in `shared/seo.ts` and `client/index.html` ("Version 1.10."); JSON-LD `softwareVersion` (`APP_FACTS` in `shared/seo.ts`, the static copy in `client/index.html`, and the asserts in `shared/seo.selfcheck.ts`); `heroDefault` in `Home.tsx`; the "L Studio 1.10" line in `Privacy.tsx` and `Terms.tsx`.
- Left at 1.09 on purpose: the history item `app-1-09-waves-drums` (it describes 1.09).
- No APK, AAB, download or GitHub release link was added. The release repo `dudichatam-max/L-studio` is private and its release carries an APK and an AAB, so linking it is not allowed.
- To go back to 1.09 before David approves: revert the commit titled "1.10 draft: version 1.10 ..." (the size is a separate commit).

## Size 77.5 MB (Oct 16, separate commit from the version, easy to revert)
- Source: GitHub release `v1.10` (private repo), asset `L-Studio-1.10-play-fix1.apk` = 81,252,020 bytes = 77.49 MiB. Same method as 1.09 (60.6 = 63,509,827 bytes in MiB, written as MB). The AAB `L-Studio-1.10-play-fix1.aab` is 77,863,522 bytes = 74.26 MiB.
- This is the release APK size, NOT the number Google Play will show for the download (Play serves split APKs from the AAB). Check the Play listing size after the closed test and correct if it differs. To go back to 60.6 MB, revert the commit titled "1.10 draft: app size ...".
- Places: `hero.stat1`, the Pro body and the Pro list item in `content.json` (and the `client/public` copy), `shared/pro-copy.json`, `fileSize` in `shared/seo.ts` and the static JSON-LD in `client/index.html`, the `heroDefault` stat in `Home.tsx`.

## 1.10 under Google review (Oct 16)
- David uploaded 1.10 to Google Play and it is under review. It is NOT live. All 1.10 lines now say "coming soon to the store" (HE: בקרוב בחנות, RU: скоро в магазине, AR: قريباً في المتجر), never "available" or "in the next update".
- Strings: `updates.pageIntro` and the updates description in `shared/seo.ts`; the 1.10 item title, summary, ticker and tickerMore (prefix "Coming soon to the store: "); item status `upcoming` (chip "Coming soon" in EN, בקרוב, Скоро, قريباً); hero kicker ("Version 1.10, coming soon to the store"); the Pro body "Version 1.10 (coming soon to the store), 77.5 MB" in `content.json` and `shared/pro-copy.json`; `heroDefault` in `Home.tsx`.
- When 1.10 is live in the store (David says so), change these to "Available now" wording and set the item status to `shipped`.

## Loop Editor repeats wording (Oct 16)
- Code (ad2ceeb, LoopEditorDialog.kt, PatternRepeatDialogB): the old repeat buttons (1-10) and the typed 1-88 count are gone. The editor has 8 rhythm boxes. A short press toggles a box (off to 1 pass, on to off), so the loop plays with that drum rhythm. A long press opens Pattern repeats for that box: 1 to 10, infinity, or Default (Default stores 0, which turns the box off). With no boxes on the channel is a free loop; with boxes on it follows drum Play.
- Site wording (guide loop-editor section, 1.10 updates bullet, ticker line 1, HE/EN/RU/AR): the boxes "choose which rhythm plays with the loop and how many times it repeats". The poster 5 caption "Trim, repeat, EQ, and lock it to the drum rhythm" is baked in and stays (it is accurate: Loop sets the repeating region).
- The live site (main, 1.09) has no Loop Editor and no such wording. Its only repeat text is the Drum "Pattern repeats" window (1-10, infinity, Default), which is correct for drums.

## Guide restructure (2026-10-16, draft, merge:no)

- Topics follow the app windows. Subtopics sit in `sections[]` of their topic. The menu shows topics only. Phones get a sticky bar that opens the topic list.
- Every topic ends with 3 beginner tips and 1 tip for advanced users (labels `guide.tipBeginner` and `guide.tipAdvanced`; HE "למתקדמים"). Do not use "pro" or "professional" wording. Verify each tip in the app code (L-studio at `ad2ceeb`) before adding it.
- Do not explain the obvious. Write what a control does, the workflow, the limits, and tips that are not obvious. The LIVE section lists everything LIVE locks, so sections do not repeat it.
- Real phone shots only (David's `guide-1.10-shots` and the 2026-10-16 batch). Never use the harness captures or the generated mockup folders.
- Sections that still have no real image (text stays, no placeholder): Sound FX, Getting started and Recording MIDI and WAV (top bar), Mic Editor, Loop recording and files, and the Settings extras. Several topics show a poster only. See `guide-audit/missing-real-shots.md`.
- Checked against the app code (ad2ceeb) for the new shots: Presets (Import and Save are under the page name, not on a bottom row), Pattern repeats (COPY/PASTE act on the rhythm whose number was long-pressed, only from the Drum window; PASTE keeps repeat count, BPM, swing; any pick closes the window), Scales (a pick closes the window), Page name (Cancel restores name and color), Load Console (a tap on a row highlights it; Save asks for Overwrite).
- Fixed: the guide said a tap on WAH, OCT, or Vibrato turns it on or off. In the app they are knobs (0 to 100%) and only change the keyboard sound.

### FAQ and launch wording (David 2026-10-16)

- `languages.*.faq` has 20 questions, each checked against the app code (ad2ceeb, 1.10) or the site. Pro is a one-time $8 payment bought through Google Play once released. There is a single app version (Pro). A free demo is coming soon from this website: write "soon" only, no date, no link. No iOS for now. Tablets were not tested, so claim no tablet support. No external MIDI keyboard or live MIDI for now, planned for later, no date.
- No launch month or day anywhere on the site. Use "coming soon" (HE בקרוב, RU скоро, AR قريباً) in the hero, launch note, pro copy, tester text, updates intro, SEO descriptions, `shared/pro-copy.json`, and the Home, Factory64 and FactoryDrums defaults. The Privacy page "last updated" date is a document date and stays.
- Mic channels have no Load key in 1.10 (only Clear and Save). Never write that Mic channels can load a file. Imported audio limits (drum rows, Looper channels) are in the FAQ answer to "Can I use my own sounds and audio files?".

## Home windows menu carousel (Sound, Mic, Loop, Pad, Drum)

- Each tab is a carousel (swipe, arrows, dots, arrow keys, RTL-correct). Code: `client/src/components/PlayCarousel.tsx`, slide list per tab in `client/src/lib/carousel.ts` (Sound 4, Mic 4, Loop 4, Pad 3, Drum 6).
- Every slide is a designed store poster, one set per language: `assets/carousel/{he,en,ar,ru}/<slide-id>-w360|w630.{webp,jpg}` (also under `client/public/assets/carousel/`). The counter n/N is baked into the poster (N = slides in that tab), so the site draws none. Each language uses only its own folder. Old numbered posters (01-08) are never used in a carousel.
- To import: `python3 scripts/import-carousel-posters.py` (reads `/workspace/store-posters/carousel/{lang}/<tab>-<n>.png`, writes the 4 files per slide, removes stale files).
- Adding or removing a slide: the designer rebakes that tab's counters, then edit `carousel.ts` (`{ id, designed }`), add the texts to `languages.*.carousel.slides[id]` in all 4 languages, and run the import.
- Drum (1.11, 6 slides; the sample shaping slide was removed at David's request): all 8 rows open after +4 with no keyboard (`drum-rows`, David's Oct 20 shot cropped y 68..1540), main Drum screen (`drum-tab`), sample banks, LOADED (`drum-loaded-trim` + `drum-loaded-rename`), Drum FX, Pattern repeats (`drum-repeats-phone`, the real 1.11 Drum window with the 1-88 box and COPY/PASTE). Cache key `CAROUSEL_VER` in `carousel.ts` (bump it whenever posters change).
- Slide titles and texts (and the optional `alt`) are in `languages.*.carousel.slides`. Short, what the screen does, verified against the app code, no em-dashes, no DAW, pro or studio wording.

## App 1.11 draft (Oct 20, draft only, merge:no)

- Source: app tag v1.11, main and google-play-pro at fa391cf. 1.11 is on its way to Google Play and is NOT live; 1.10 is not confirmed live either. Write only "coming soon to the store" (HE בקרוב בחנות, RU скоро в магазине, AR قريباً في المتجر). Never "available now", and do not flip any item to `shipped`.
- Updates: new first item `app-1-11-loaded-keep-playing` (status `upcoming`, ticker + 3 `tickerMore` lines, images `drum-loaded-trim-phone` and `keep-playing-phone`, sizes in `STILL_SIZE` in `client/src/pages/Updates.tsx`). The 1.10 item is unchanged. `pageIntro` and the `/updates` SEO descriptions say 1.10 and 1.11 are both coming soon. Keep `client/src/lib/updatesFallback.json` equal to `languages.*.updates`.
- Guide, checked against the 1.11 code: new Sound section `wave-octave` (long-press a wave key, absolute octave -2..+2, DEFAULT follows the main octave, SAVE / CLOSE, badge on the key, saved in presets, sessions and the preset page file); new Drum section `drum-loaded` (LOADED tab, 88 per row, multi-file LOAD, 30 s cap, trim, SAVE / RESET / RENAME / DELETE, 24-character names, sessions and kit files carry the used LOADED samples); Pattern repeats 1-88 field; Keep playing in Loop Editor and Mic Editor only (the Drum window has no Keep playing, it has RHYTHM COPY/PASTE); Drum CLEAR also resets the repeat count to Default; Looper and Mic Clear also clear the editor settings and Redo brings both back; LIVE now allows the DRUM KIT arrows and Load in Drum styles, and locks sample LOAD, RENAME and DELETE.
- 1.11 shots: only the cropped finals in `l-studio-team-docs/assets/guide-1.11-shots/final/` (720x1472), never the `david-1.11-*` originals. Files: `wave-octave-phone`, `octave-badges-phone`, `octave-badges-dual-phone`, `drum-loaded-trim-phone`, `drum-loaded-rename-phone`, `keep-playing-phone` (4 files each, JPEG q84 / WebP q82). `keep-playing-phone` was taken in the Looper editor; it is also used in Mic Editor (same window). Drum Pattern repeats uses `drum-repeats-phone`, David's real 1.11 Drum window (1-88 field, RHYTHM COPY/PASTE, no KEEP PLAYING), cropped from 720x1640 to y 68..1540.
- No longer used by the guide (files stay in git): `drum-samples-phone`, `voice-phone` (1.10 picker without LOADED or trim) and `pattern-repeats-phone` (1.10 window, 1-10 only).
- FAQ: Q7 (own sounds: LOADED banks, multi-file LOAD, 30 s cap for drum files, trim), Q8, Q11 (wave long-press, repeats up to 88), Q12, Q13 (LIVE), and Q18 (limits) updated.
- Drum topic: `drum-tab-phone` (final/`drum-tab.png`, real 1.10 Drum screen with Vinyl Dust, still valid for 1.11) is the topic's main image; the approved poster p07 stays as the second image. `drum-tab-alt.png` is not used.

## Version 1.11 and size (Oct 20, own commit so it can be reverted)

- Version 1.11 with "coming soon to the store" in the hero kicker (content and the `Home.tsx` default), the Pro body (`languages.*.pro` and `shared/pro-copy.json`), FAQ 1, the home SEO descriptions and JSON-LD `softwareVersion` (`shared/seo.ts`, asserts in `shared/seo.selfcheck.ts`).
- Size: the site shows the release APK size in MiB, written MB (1.10: 81,252,020 B = 77.5 MB). 1.11 release APK `L-Studio-1.11.apk` is 81,194,413 B = 77.4 MB, so hero stat1, FAQ 3, the Pro text and `fileSize` say 77.4 MB. In decimal megabytes the same file is 81.2 MB; switch every spot together if David prefers that.
- Privacy and Terms footers say "L Studio 1.11" (David, Oct 20). One string in `Privacy.tsx` and `Terms.tsx` serves all 4 languages.

### Store status (David, 2026-10-21 14:45 IDT)

- 1.10 is live on Google Play. Item `app-1-10-loop-editor-drums` is `shipped` and its title, ticker and ticker lines start "Now on Google Play" (HE "זמין ב-Google Play", RU "Уже в Google Play", AR "متاح الآن في Google Play"). Never "in progress" for it.
- 1.11 is in Google review. Item `app-1-11-loaded-keep-playing` stays `upcoming`. Title and summary start "In Google review, coming in the next few days", and the ticker lines start "In the next few days". No date. The hero kicker, FAQ, Pro body (`content.json` and `shared/pro-copy.json`), `updates.pageIntro` and the updates meta in `shared/seo.ts` say the same. The site version and size stay 1.11 and 77.4 MB. There is no separate "version on store" field.
- 1.12 (analog mixer and mastering window) reaches Google Play next week, after bug testing. Item `app-1-12-mixer-demo` title says so, keeps the video and has no summary.
- 1.09 is live on Google Play. Its summary starts "On Google Play, version 1.09:" (no longer "In the Google Play test now").
- When 1.11 goes live: flip its item to `shipped`, use the "Now on Google Play" prefix, and update the kicker, FAQ, Pro body, intro and meta.
