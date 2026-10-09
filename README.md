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

## Paid digital products

The **Sell online** sidebar section has **Software** and **PDF** categories. Creator Studio includes **Upload PDF product**. It uploads PDFs up to 25 MB privately to the connected Google Drive account and publishes the product description, price, and checkout-page link as a Blogger post. Blogger REST API posts contain HTML and do not upload PDF binaries. The Drive API must be enabled in the Google Cloud project, and Google authorization requests the restricted `drive.file` scope for files created by this app.

The checkout page is currently a locked QR scanner placeholder. Downloads remain locked until payment scanning and verification are integrated. Razorpay order creation and verification have been removed. Product listings are stored in PostgreSQL and served by `/api/store/products`. After upload, the API verifies the PDF using the Google access token and automatically inserts the product into the database. The schema is created automatically on first API use.

Set the server-only `DATABASE_URL` in `.env.local` and in Vercel project environment settings. Use a PostgreSQL connection string from your provider (Neon, Supabase, or another PostgreSQL host). For hosted databases, use the provider's TLS connection string. For local PostgreSQL without TLS, set `DATABASE_SSL=disable`. The application creates a `store_products` table when the API is first used. Do not expose `DATABASE_URL` through a `VITE_` variable.

Drive files are uploaded without public sharing. Do not add a public download URL to a paid product while payment verification is disabled.
