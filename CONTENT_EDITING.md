# Editing L Studio from your phone

## Text

Open the root file `content.json` in GitHub and edit the values under `languages.en`, `languages.he`, `languages.ru`, or `languages.ar`. Commit the change. The GitHub Action copies this file into the published site and deploys it automatically.

Do not change the JSON punctuation, keys, or braces. Change only the text between quotation marks.

## Images

The root folder `assets/` holds shared stills such as the logo, Factory Pack banner, developer photo, and the MIC feature still (`mic-window.jpg` lives under `client/public/assets/`). Replace a file using the same filename and commit it. The GitHub Action copies root `assets/` into the website automatically.

## Feature videos

Upload these exact filenames into the root `assets/` folder (case-sensitive), then commit:

- `Sound.mp4`
- `Loop.mp4`
- `Pad.mp4`
- `Drum.mp4`

They play in the Features section when each item is opened. MIC keeps its still image only.

## Publishing

In the repository settings, set GitHub Pages > Build and deployment > Source to `GitHub Actions`. Every push to `main` then runs `.github/workflows/deploy-pages.yml` and publishes the latest version.
