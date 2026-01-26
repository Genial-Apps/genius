# Deployment Guide

## Production Secret Management: GEMINI_API_KEY

Use environment variables everywhere—never commit a Gemini key. There are two supported hosting targets:

### Vercel Serverless Functions (default workaround)

1. Go to your Vercel project → **Settings → Environment Variables**.
2. Add `GEMINI_API_KEY` (Production + Preview + Development) with your Google Gemini key.
3. Re-deploy so serverless functions can read `process.env.GEMINI_API_KEY`.

### Firebase Functions (legacy path)

Run this command in your project root:

```
firebase functions:config:set gemini.key="YOUR_PROD_KEY"
```

and access it via

```ts
const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini.key;
```

### Security Notes

- Do **not** store `GEMINI_API_KEY` in `.env` files that get committed.
- Rotate keys periodically and audit access.
- Use separate keys for staging vs production if possible.

---

## Gemini Proxy Architecture

The SPA never calls Gemini directly. Instead it posts JSON payloads to REST endpoints that mirror the Firebase functions contract. Two interchangeable backends exist:

1. **Vercel Serverless Functions** (new default, lives in `/api/*`)
2. **Firebase HTTPS Functions** (legacy implementation in `firebase/functions/src/index.ts`)

Both expose the same routes:

- `POST /api/resolveWebPageTitle`
- `POST /api/generateSyllabus`
- `POST /api/performInitialScoping`
- `POST /api/generateSprintContent`
- `POST /api/healthCheck`

The frontend client (`services/geminiService.ts`) builds URLs using `VITE_FUNCTIONS_ORIGIN` when provided or falls back to `/api`, which works automatically on Vercel.

### Required environment flags

For most Vercel deployments you can leave `VITE_FUNCTIONS_ORIGIN` unset—the SPA will use same-origin `/api/*` routes which map to the bundled serverless functions.

If you want to point the frontend at a different host (e.g., Firebase Functions or a staging URL), create `.env.local` with:

```
VITE_FUNCTIONS_ORIGIN=https://your-backend.example.com
```

and mirror that variable inside Vercel → **Settings → Environment Variables**. Remember to re-build whenever the value changes.

> **Important:** The CDN-delivered Tailwind stylesheet and importmap stay in `index.html`; Vercel serves them as-is, so confirm that your Content Security Policy (if any) allows `https://cdn.tailwindcss.com` and `https://esm.sh`.

## Option A – Vercel Web Deploy (Default)

1. **Install dependencies & test locally**
   ```bash
   npm install
   npm run dev
   ```
2. **Configure environment variables on Vercel**
   - `GEMINI_API_KEY` (required for all `/api/*` functions)
   - Optional: `VITE_FUNCTIONS_ORIGIN` if you want the frontend to target a remote Firebase instance instead of same-origin `/api`.
3. **Connect the GitHub repo to Vercel** (or push via CLI). Vercel auto-detects Vite and runs `npm install && npm run build`.
4. **Preview & test**
   - Confirm `/api` calls succeed via the Developer Modal or browser network logs.
   - Use the Vercel preview URL to run a full sprint end-to-end.
5. **Promote to production** once previews are green.

### Notes

- Because hosting is purely static, no extra rewrites are needed; same-origin `/api/*` requests hit the bundled serverless functions.
- Keep the Expo/native wrapper in `expo-wrapper/` for future work, but the Vercel pipeline ignores it.
- If you require custom headers (CSP, cache), add a `vercel.json` in the repo root later.

## Option B – Local testing with Firebase Emulator

1. **Install dependencies and build the functions layer**
   ```bash
   cd firebase/functions
   npm install
   npm run build
   ```

2. **Configure the Gemini key for your local emulator**
   ```bash
   firebase functions:config:set gemini.key="YOUR_DEV_KEY"
   ```
   This writes the secret to `.runtimeconfig.json` automatically in the `functions` directory. Keep the file out of git.

3. **Start the Functions emulator**
   ```bash
   firebase emulators:start --only functions
   ```
   The emulator exposes your HTTPS functions at `http://127.0.0.1:5001/<project-id>/us-central1`.

4. **Point the Vite app at the emulator**
   In a new terminal (project root):
   ```bash
   export VITE_FUNCTIONS_ORIGIN="http://127.0.0.1:5001/<project-id>/us-central1"
   npm run dev
   ```
   Alternatively, add the value to `.env.local`.

5. **Test and inspect logs**
   - Trigger scoping/analysis flows in the UI.
   - Emulator logs appear in the terminal and Firebase Emulator UI.
   - Frontend toasts surface any failures, while detailed errors are stored in the Developer Console log view.

## Deployment checklist (Vercel-first)

1. Ensure `GEMINI_API_KEY` is set in Vercel (Production + Preview + Development) and, if needed, locally via `vercel env pull`.
2. (Optional) Set `VITE_FUNCTIONS_ORIGIN` if you must point at a remote backend; otherwise leave it unset for same-origin `/api`.
3. `npm install && npm run build` locally to confirm the bundle passes.
4. Push to `main` (or trigger a Vercel build) and wait for Preview + Production deployments.

### If you still rely on Firebase

1. `cd firebase/functions && npm install && npm run build`
2. `firebase functions:config:set gemini.key="YOUR_PROD_KEY"`
3. `firebase deploy --only functions`
4. Point `VITE_FUNCTIONS_ORIGIN` to the deployed HTTPS Functions base and redeploy the web frontend.

Post-deploy validation (either stack):
- `/api/healthCheck` (or the Firebase equivalent) returns `{ ok: true }`.
- Scoping + sprint generation succeed without “API key missing” errors.
- Logs appear in the Developer Modal and your hosting provider’s console.
