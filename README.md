# Promptseen frontend starter

A responsive React, Vite, TypeScript, Tailwind CSS, and React Router frontend. Blogger is the publishing backend; the content model and adapter boundary are designed so a future Expo client can use the same Blogger API with its own native OAuth flow.

## Blogger publishing

The admin screen can create Blogger posts. Choose a cover file or enter an HTTPS public image URL, then provide the title, description, category, tool, and prompt text. Publishing creates a live post through Blogger `posts.insert` using the signed-in user's OAuth access token. The access token is kept in this browser tab's session storage so refreshes and in-app navigation stay signed in. Google access tokens expire; reconnect after expiration or when you close the tab.

Google Identity Services requests `https://www.googleapis.com/auth/blogger` and `https://www.googleapis.com/auth/drive.file` so the signed-in user can publish Blogger posts and upload PDFs created by this app. Enable the Google Drive API. Configure the OAuth web client with the local JavaScript origin (`http://localhost:5174`) and your production frontend origin. Add authorized test users on the Google OAuth consent screen while the app is in testing. The OAuth client ID is public configuration; never put the client secret in a `VITE_*` variable or browser bundle.

Blogger's post insert endpoint accepts HTML content and has no media upload endpoint. When you choose a local cover file, the app uploads it to the connected Google Drive account, allows public viewing, and embeds the image in the Blogger post. The image is public so Blogger and visitors can load it. You can also paste an existing public HTTPS image URL.

## Configuration

Copy `.env.example` to `.env.local` and set the values for your environment. Vite reads browser-visible settings prefixed with `VITE_`. Never put OAuth client secrets, social API tokens, or other private keys in those settings. Restart Vite after changing environment values.

Required Blogger values:

- `VITE_BLOGGER_CLIENT_ID`
- `VITE_BLOGGER_BLOG_ID`

## AI model settings

Admin → AI models stores the active model, custom model catalog, and encrypted provider API keys in the server-side `data/ai-model-settings.json` file. The data file is excluded from Git. Set the server-only `AI_SETTINGS_ENCRYPTION_KEY` in `.env.local` to encrypt provider keys; optionally set `AI_MODEL_CONFIG_FILE` to choose another file path. Back up the config file and encryption key together.

This file storage works with a local Node/Vite server or another host with persistent writable disk. Vercel serverless functions do not provide durable writable project files, so settings saved there may be lost between function instances or deployments. Keep this limitation in mind when deploying.

## Creator Studio sign-in

The login page offers two options: the Blogger account, or a server-configured user ID and password. For password sign-in, set `ADMIN_USER_ID`, `ADMIN_PASSWORD`, and a stable random `ADMIN_SESSION_SECRET` in `.env.local` and in the server environment. The app stores the password session in a signed, HTTP-only cookie for seven days. This sign-in opens Creator Studio; connect Blogger in the admin header to publish posts or upload files to Drive.

## Start locally

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`, fill in the Blogger values, and configure OAuth origins/test users in Google Cloud Console. Enable the Google Drive API and allow public sharing for uploaded cover images.
3. Run `npm run dev` and open the local URL printed by Vite.
4. Sign in with the Google account that can edit the configured Blogger blog, open the admin screen, and publish a prompt.

## Architecture

```text
src/
  app/        React routes and blog/prompt presentation
  config/     Central typed web configuration
  data/       Blogger OAuth, publishing, Blogger API, WordPress, and demo adapters
  domain/     Platform-neutral post model and repository contract
  styles.css  Responsive UI and Tailwind import
api/          Vercel serverless social trend proxy
```

`createPromptRepository()` is the content read boundary. Blogger publishing lives in `src/data/blogger-publisher.ts`. A future Expo client should implement the same domain contract and use native OAuth; do not import web config or reuse the browser token flow in a mobile bundle.

## Social trend feed (X + Instagram)

The home page requests `/api/social-trends`. In production, `api/social-trends.js` runs as a Vercel serverless function; local Vite development uses the matching middleware in `vite.config.ts`. Social API credentials stay on the server and must never use a `VITE_` prefix.

Set these values in `.env.local` and in Vercel's server environment:

- `SOCIAL_X_API_URL`, `SOCIAL_X_BEARER_TOKEN`, and `SOCIAL_X_SEARCH_QUERY`
- `SOCIAL_INSTAGRAM_API_URL`, `SOCIAL_INSTAGRAM_ACCESS_TOKEN`, `SOCIAL_INSTAGRAM_USER_ID`, and `SOCIAL_INSTAGRAM_HASHTAGS`

The feed removes duplicate captions and ranks matching posts with relevance, engagement, and recency. Instagram hashtag discovery requires a Professional account and the access permissions Meta grants to the app; public hashtag access may require review. API plans, quota, and permissions can limit results. No sample posts are presented as live data.

## Deploy

Deploy the frontend to Vercel and define browser-visible environment variables in its project settings. Keep server-only social credentials in Vercel's server environment. `vercel.json` rewrites nested SPA routes to the app entry point. For search-focused publishing, use server rendering or static generation and render post metadata in the HTML.

## Commands

- `npm run dev` — local development
- `npm run typecheck` — TypeScript checks
- `npm run build` — production build
- `npm run preview` — serve the production build locally

## Digital store, premium features and licenses

The **Sell online** sidebar section has **Software** and **PDF** categories. Creator Studio includes **Upload PDF product**. It uploads PDFs up to 25 MB privately to the connected Google Drive account and publishes the product description, price, and checkout-page link as a Blogger post. Blogger REST API posts contain HTML and do not upload PDF binaries. The Drive API must be enabled in the Google Cloud project, and Google authorization requests the restricted `drive.file` scope for files created by this app.

Every product carries a feature list. A feature is either **free** (shown as included) or **premium** (shown as locked on the public store). A premium feature can also declare a **benefit key**, which is what actually switches a capability on for a paying customer. The screen recorder uses the built-in benefit key `watermark_free`: free users get their video composited through a canvas with a tiled watermark plus a "free version" badge, and an account that has redeemed a license containing `watermark_free` records clean.

Admin Panel → **Digital store** (`/admin/products`) is the only place that manages this. It lists every product with its complete feature list and benefit keys, edits the premium flag and watermark text, and issues or revokes license codes. It is gated by the admin session cookie, and `/api/admin-store` rejects every request without it.

Customers sign in at **My account** (`/account`), redeem a code such as `PS-A1B2-C3D4-E5F6`, and their unlocks are listed there. Payment is still handled manually: the checkout page explains the three steps (pay, receive a code, redeem it), and the store owner creates the license after the money arrives.

### Social sign-in (Google and Facebook)

The account page also offers **Continue with Google** and **Continue with Facebook**. Both are for customer accounts only — Creator Studio still signs in with the `ADMIN_USER_ID` / `ADMIN_PASSWORD` pair. The browser never asserts an identity: Google's Identity Services returns an ID token and Facebook's JS SDK returns an access token, and `/api/social-auth` verifies them on the server (`server/social.js`) before touching the database.

Google is checked against Google's JWKS with real RS256 signature verification plus `iss`, `aud` and `exp`. Facebook tokens are checked through `debug_token` (valid, and issued to *this* app) and then `/me` with an `appsecret_proof` HMAC. A provider account ID is stored once per provider, so the same person can link both to one account.

An email returned by Google is marked verified by Google, so signing in with Google links to an existing password account with the same email. Facebook exposes no verified flag, so a Facebook email never claims an existing account — it only ever matches its own `facebook_id`.

| Variable | Where | Notes |
| --- | --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | browser + server | OAuth client ID of type **Web application** with this site in Authorized JavaScript origins. Falls back to `VITE_BLOGGER_CLIENT_ID`, so Google sign-in works here without extra setup. No client secret is used. |
| `VITE_FACEBOOK_APP_ID` | browser | Meta app ID. Button stays hidden until it is set. |
| `FACEBOOK_APP_SECRET` | server only | Needed for `appsecret_proof` and `debug_token`. Never prefix with `VITE_`. Facebook Login must list this site as a valid OAuth redirect URI. |

`GET /api/social-auth` reports which providers are configured, and a button only appears when both the browser ID and the server-side secret are present.

### Data model

The backend is reached through one repository interface in `server/db/index.js`. `DATA_STORE` selects the adapter and defaults to `postgres`; adding an engine means writing a factory that returns the same methods and registering it in that file — no API module contains SQL. Connection details come from `DATABASE_URL` and `DATABASE_SSL`.

Tables are created automatically on first API use: `store_products` (catalog plus `premium`, `watermark_text`, `sort_order`), `product_features` (tier, benefit key, order; cascades from the product), `app_users` (email, scrypt password hash and salt, plus `google_sub`, `facebook_id` and `signup_source` for social accounts), `app_sessions` (hashed token, expiry), `licenses` (code, benefits, status `issued` / `redeemed` / `revoked`) and `entitlements` (user + product + benefit key). Revoking a license deletes the entitlements granted by it. Customer sessions use a signed, HttpOnly, SameSite=Lax cookie; passwords never leave the server.

Set the server-only `DATABASE_URL` in `.env.local` and in Vercel project environment settings. Use a PostgreSQL connection string from your provider (Neon, Supabase, or another PostgreSQL host). For hosted databases, use the provider's TLS connection string. For local PostgreSQL without TLS, set `DATABASE_SSL=disable`. Do not expose `DATABASE_URL` through a `VITE_` variable.

For local work without a hosted provider, `npm run db:local` starts a persistent Postgres-wire server in `.local-db` (dev dependency, never deployed) and pairs with `DATABASE_URL=postgres://postgres:postgres@localhost:5543/postgres` and `DATABASE_SSL=disable`. `npm run db:verify` runs the data-layer checks (schema, feature attach, license issue/redeem/revoke, session and cascade behaviour) against whichever store is configured.

Drive files are uploaded without public sharing. Do not add a public download URL to a paid product while payment verification is disabled.
