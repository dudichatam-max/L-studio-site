# Editing L Studio from your phone

## Text

Open the root file `content.json` in GitHub and edit the values under `languages.en`, `languages.he`, `languages.ru`, or `languages.ar`. Commit the change. The GitHub Action copies this file into the published site and deploys it automatically.

Do not change the JSON punctuation, keys, or braces. Change only the text between quotation marks.

### User guide (`/guide`)

Long guide copy lives under `languages.*.guide` (title, intro, tip labels, and `sections[]`). Keep all four languages in sync when you edit a section. Optional `media` paths are relative to the site root (for example `assets/mic-window.jpg` or `assets/Preset.jpg`). Leave `media` out when there is no real screenshot yet — do not invent images.

Nav labels for the guide live under `languages.*.nav.guide`.

### Factory 64 (`/factory-64`)

Detail copy for the Factory Pack lives under `languages.*.factory64` (title, intro, page cards, preset blurbs, store blurb). Keep all four languages in sync. Preset **names** stay in English; translate descriptions only. Cover art is `assets/factory-64-cover.png`. Home section CTAs use `languages.*.factoryPack.detailCta` (link to `/factory-64`) and `languages.*.factoryPack.cta` (early access).


## Images

The root folder `assets/` holds shared stills such as the logo, Factory Pack banner, Factory 64 cover (`factory-64-cover.png`), developer photo, and Preset still. Replace a file using the same filename and commit it. The GitHub Action copies root `assets/` into the website automatically. The MIC feature still (`mic-window.jpg`) lives under `client/public/assets/`.

## Feature videos

Upload these exact filenames into the root `assets/` folder (case-sensitive), then commit:

- `Sound.mp4`
- `Loop.mp4`
- `Pad.mp4`
- `Drum.mp4`

They play in the Features section when each item is opened. MIC keeps its still image only.

## Publishing

In the repository settings, set GitHub Pages > Build and deployment > Source to `GitHub Actions`. Every push to `main` then runs `.github/workflows/deploy-pages.yml` and publishes the latest version.
