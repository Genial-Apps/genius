# Deployment Guide

## Production Secret Management: GEMINI_API_KEY

For production deployments, the `GEMINI_API_KEY` must be managed securely using Firebase environment config, not in `.env` files or source code.

### Setting the Key in Firebase

Run this command in your project root:

```
firebase functions:config:set gemini.key="YOUR_PROD_KEY"
```

### Accessing the Key in Code

In your Firebase Functions code, access the key with:

```ts
const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini.key;
```

- For local development, you may use a `.env` file (which is gitignored).
- For production, always use Firebase config as above.

### Security Notes

- Never commit production secrets to the repository.
- Always use Firebase config for deployment secrets.
- Rotate keys periodically and restrict access as needed.

---

## Gemini Proxy Architecture

The frontend no longer communicates with Google Gemini directly. All AI requests now go through Firebase HTTPS Functions hosted under `firebase/functions/src/index.ts`. Each function enforces API-key access and logs errors server-side:

- `resolveWebPageTitle`
- `generateSyllabus`
- `performInitialScoping`
- `generateSprintContent`

The frontend client (`services/geminiService.ts`) posts JSON to `{VITE_FUNCTIONS_ORIGIN}/{functionName}` and handles errors gracefully. If `VITE_FUNCTIONS_ORIGIN` is not set it defaults to `/api`, so production hosting should rewrite `/api/*` paths to the deployed functions or set the variable explicitly.

### Required environment flags

Create an `.env.local` (ignored by git) in the project root for local work:

```
VITE_FUNCTIONS_ORIGIN=https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net
```

For production builds, set `VITE_FUNCTIONS_ORIGIN` via your hosting provider (e.g., Firebase Hosting `env:set`, Vercel dashboard, etc.).

## Option A – Local testing with Firebase Emulator

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

## Deployment checklist

1. `cd firebase/functions && npm install && npm run build`
2. `firebase functions:config:set gemini.key="YOUR_PROD_KEY"`
3. `firebase deploy --only functions`
4. Set `VITE_FUNCTIONS_ORIGIN` for the web app (hosting configuration or CI env).
5. Redeploy the web frontend.

Once deployed, verify:
- HTTPS functions respond at `{VITE_FUNCTIONS_ORIGIN}/performInitialScoping` etc.
- Frontend scoping/generation completes without “API key missing” errors.
- Logs appear both in the UI and Firebase console.
