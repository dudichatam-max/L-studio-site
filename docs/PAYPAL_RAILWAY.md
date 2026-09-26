# L Studio Pro checkout on Railway

Sandbox PayPal checkout and a one-time APK download run on the existing Express server (`server/index.ts`). GitHub Pages still publishes the marketing site. Checkout needs the Railway service, because Pages cannot verify PayPal or hide the APK.

The APK is not in git. Buyers never receive a GitHub release URL.

## Approved build

Place this build on the server yourself:

| Field | Value |
| --- | --- |
| Tag | `website-pro-qa-tutorial-20260926e` |
| Commit | `b129650` |
| Size | 24468395 bytes (about 24 MB) |
| SHA256 | `fa851fcefe0ad71a5abce86ed298b5a61f39d1bc8dcfe0b733fab5694edb6004` |

The server refuses to serve a file whose SHA256 does not match. The default is the digest above. Set `APK_SHA256` only when you intentionally ship a newer approved file.

## Railway service

Nixpacks detects pnpm from `packageManager`. Node 22 is pinned in `.node-version` (`node:sqlite` stores orders and tokens). `PORT` comes from Railway. The process listens on `0.0.0.0`.

- Build: `pnpm build` (`vite build` plus esbuild of `server/index.ts`)
- Start: `NODE_ENV=production node dist/index.js` (`pnpm start`)
- Health: `GET /api/health` returns 200 when the process is up. `apkStatus` is separate, so a missing APK does not crash the deploy.

`railway.toml` sets the health check path and a 300s timeout so a first-boot APK fetch can finish.

### Volume

Trial Railway has no external database. v1 stores orders and hashed download tokens in SQLite at `$DATA_DIR/commerce.sqlite` (`node:sqlite`, built into Node 22). Node may print an experimental warning for that module. That is expected. This is enough for a single instance. When you outgrow it, move the same records to Postgres and keep the PayPal verification on the server. Do not trust a browser "paid" flag.

Attach a Railway Volume mounted at `/data` and set `DATA_DIR=/data`. Without a volume, a new deploy wipes tokens and any APK that was only on local disk.

### Put the APK on the server (private)

Pick one. Do not commit the binary, and do not point buyers at a GitHub release URL. Leave the L-studio repository private.

1. Volume file. Upload `L-Studio-Pro.apk` onto the volume (Railway shell, `scp`, or a one-off private copy) and set `APK_PATH=/data/L-Studio-Pro.apk`.
2. Private fetch. Set `APK_SOURCE_URL` to an https URL only the server can read (signed object URL, private bucket, or the private GitHub release below). On startup the server downloads it into `$DATA_DIR/l-studio-pro.apk` (file mode `0600`) and checks the SHA256. The URL is not logged and is not returned to the browser.

A public release URL would let anyone download the file without paying. Keep `dudichatam-max/L-studio` private. Buyers still receive only `/api/download/<one-time-token>`.

A wrong checksum sets `apkStatus` to `checksum_mismatch` and download returns 503. Fix the file and redeploy. A 404 or rejected token sets `apkStatus` to `unreadable`.

### Private GitHub APK on a phone

Unauthenticated `GET` of the private release returns 404, so Railway marks the APK `unreadable`. Do not make the repository public. Create a fine-grained personal access token and set two Railway variables.

1. On the phone, open [Generate a fine-grained token](https://github.com/settings/personal-access-tokens/new) while signed in as the owner of `dudichatam-max/L-studio`.
2. Token name: `railway-apk-read`. Set an expiration you can renew. Resource owner: `dudichatam-max`.
3. Repository access: **Only select repositories** → `L-studio`.
4. Permissions → Repository permissions → **Contents: Read-only**. That read permission includes release assets. Leave every other permission at **No access**. Do not grant Administration, Secrets, or write.
5. Generate the token and copy it once. It starts with `github_pat_`. GitHub will not show it again.
6. Open Railway → this service → **Variables**. Leave `APK_PATH` empty so the URL is used. Add:
   - `APK_SOURCE_URL` — either form works:
     - Browser download URL: `https://github.com/dudichatam-max/L-studio/releases/download/website-pro-qa-tutorial-20260926e/L-Studio-website-pro-qa-tutorial-20260926e.apk`
     - API asset URL for this same release: `https://api.github.com/repos/dudichatam-max/L-studio/releases/assets/<asset-id>`
   - `APK_GITHUB_TOKEN` — paste the token value only. Do not prefix it with `Bearer` (the server adds that). Do not put the token in git, in the URL, or in a start command.
7. Save. Railway redeploys. If it does not, trigger a redeploy from the service menu.
8. Open `https://<railway-host>/api/health`. Expect `"apkStatus": "ready"`. The file the server stored must be SHA256 `fa851fcefe0ad71a5abce86ed298b5a61f39d1bc8dcfe0b733fab5694edb6004`. Leave `APK_SHA256` unset unless you intentionally replace that approved build.

When `APK_GITHUB_TOKEN` or, only if that is empty, `GITHUB_TOKEN` is set, the server sends `Authorization: Bearer <token>` and `Accept: application/octet-stream` to `github.com` and `api.github.com` only, then follows redirects. The API asset URL also sends `Accept: application/octet-stream`, which is what makes GitHub return the binary instead of JSON. The token is not sent to the release CDN, and neither the token nor the `Authorization` header is written to logs.

The APK is not served from `/assets` or any fixed public path. `express.static` does not serve `.apk`. The only download route is `/api/download/<one-time-token>`.

## Variables

Set these in Railway → Variables. Names only; values stay in the dashboard. See `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PAYPAL_CLIENT_ID` | yes | PayPal REST client id |
| `PAYPAL_CLIENT_SECRET` | yes | PayPal REST secret |
| `PAYPAL_MODE` | no | `sandbox` (default) or `live` |
| `PAYPAL_WEBHOOK_ID` | no | Verifies `POST /api/paypal/webhook` |
| `PUBLIC_BASE_URL` | yes in prod | Railway public URL, no trailing slash |
| `DOWNLOAD_TOKEN_SECRET` | yes | HMAC + encryption key for download tokens |
| `PRODUCT_PRICE_USD` | no | Default `4.00`. Server-side price. The browser cannot change it |
| `PRODUCT_NAME` | no | Default `L Studio Pro` |
| `SUPPORT_EMAIL` | no | Default `dudichatam@gmail.com` |
| `SITE_PUBLIC_URL` | no | Marketing site linked from the download email. Default `https://l-studio.studio`. Leave unset in production |
| `GUIDE_URL` | no | User guide in the download email. Default `https://l-studio.studio/guide`. A path such as `/guide` is joined to `SITE_PUBLIC_URL` |
| `APK_PATH` | one of path/url | Absolute path of the private APK. Leave empty when using `APK_SOURCE_URL` |
| `APK_SOURCE_URL` | one of path/url | https URL fetched at startup into `DATA_DIR`. Private GitHub browser download URL or `api.github.com` asset URL |
| `APK_GITHUB_TOKEN` | with a private GitHub URL | Fine-grained PAT. Contents read-only on `dudichatam-max/L-studio` only. Never commit it |
| `GITHUB_TOKEN` | fallback | Used for the APK fetch only when `APK_GITHUB_TOKEN` is empty. Prefer `APK_GITHUB_TOKEN` |
| `APK_SHA256` | no | Override the approved digest `fa851fcefe0ad71a5abce86ed298b5a61f39d1bc8dcfe0b733fab5694edb6004` |
| `DATA_DIR` | recommended | Default `./data`. Use `/data` with a volume |
| `RESEND_API_KEY` | no | Resend email |
| `RESEND_FROM` | with Resend | Verified from address |
| `OWNER_NOTIFY_EMAIL` | no | Early Access signup and first-download notices. Default `dudichatam@gmail.com`. A failed notice does not fail the tester signup |
| `ADMIN_STATS_SECRET` | no | Protects `GET /api/admin/early-access-stats` (header `x-admin-secret` or `?secret=`). Unset disables the endpoint |
| `SMTP_HOST` | no | SMTP host if Resend is not set |
| `SMTP_PORT` | no | Default `587`. `465` uses TLS |
| `SMTP_USER` | no | SMTP username |
| `SMTP_PASS` | no | SMTP password |
| `SMTP_FROM` | with SMTP | From address |
| `VITE_API_BASE_URL` | Pages only | Baked into the GitHub Pages build if the buy page there should call Railway |

If neither Resend nor SMTP is set, capture still returns the download URL on the success page and the log says email was skipped.

The download email is HTML plus a plain-text fallback. It includes the one-time APK link and the user guide. `SITE_PUBLIC_URL` and `GUIDE_URL` already default to the live site, so Railway does not need them.

`GET /api/paypal/config` returns the client id to the browser so the PayPal JS SDK can load. The secret never leaves the server.

## Sandbox test

1. In the PayPal Developer Dashboard create a Sandbox REST app. Copy the Sandbox client id and secret into Railway (or `.env` locally). Leave `PAYPAL_MODE=sandbox`.
2. Set `DOWNLOAD_TOKEN_SECRET` to a long random string (`openssl rand -base64 32`).
3. Put the approved APK on disk (`APK_PATH`) or set `APK_SOURCE_URL`. For the private L-studio release, leave `APK_PATH` empty and set `APK_SOURCE_URL` plus `APK_GITHUB_TOKEN` as in the phone steps above.
4. Set `PUBLIC_BASE_URL` to the Railway URL, for example `https://l-studio-site-production.up.railway.app`.
5. Deploy. Open `https://<railway-host>/api/health`. Expect `paypalConfigured: true` and `apkStatus: "ready"`.
6. Open `https://<railway-host>/buy`. Use a Sandbox personal buyer account in the PayPal button. Do not use a Live card while `PAYPAL_MODE=sandbox`.
7. After approval, the site calls `POST /api/paypal/capture-order`. The server captures the order, checks status `COMPLETED`, USD amount `4.00`, and product id `l-studio-pro`, then returns a one-hour download URL.
8. The success page shows the link. Download once. A second download of the same link returns 410. A dropped connection can retry until a full download finishes or the hour ends. A second download in parallel while the first is streaming returns 409.
9. Optional webhook: in the Sandbox app add `https://<railway-host>/api/paypal/webhook` for `CHECKOUT.ORDER.APPROVED`, `CHECKOUT.ORDER.COMPLETED`, and `PAYMENT.CAPTURE.COMPLETED`. Set `PAYPAL_WEBHOOK_ID`. Unsigned events are rejected.

Local full stack after a build:

```bash
pnpm install
pnpm build
pnpm start
```

`pnpm dev` also mounts `/api` on the Vite server so Sandbox buttons work without a separate process. The marketing Pages build does not have that API.

## GitHub Pages

`l-studio.studio` stays the static marketing site. Its buy page can call Railway only if the Pages build knows the public API origin:

- set `commerce.apiBaseUrl` in the root `content.json` to the Railway origin (no trailing slash), or
- set `VITE_API_BASE_URL` for the Pages build.

CORS allows `https://l-studio.studio`, `https://www.l-studio.studio`, localhost, and the Railway origin. The APK still streams only from Railway after a verified payment.

## Routes

| Method | Path | Role |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness, mode, apk status. No secrets |
| `GET` | `/api/paypal/config` | Public client id, price, mode |
| `POST` | `/api/paypal/create-order` | Creates a PayPal order at the server price |
| `POST` | `/api/paypal/capture-order` | Captures and verifies, then mints the link |
| `POST` | `/api/paypal/webhook` | Verified backup fulfillment |
| `GET` | `/api/download/:token` | Streams the APK once, then burns the token |
| `GET` | `/buy` and `/buy/success` | Purchase UI (HE / EN / RU / AR) |
