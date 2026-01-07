## Local dev & production quick-start (client → functions)

This document shows the quick steps to run the app locally using the Firebase Functions emulator, how to set the function secret locally, and a hosting rewrite example so the client can call `/api/*` paths in production.

---

### README snippet

Local dev (emulator)
1. In the functions folder set local key for emulator:
   ```bash
   cd firebase/functions
   firebase functions:config:set gemini.key="YOUR_DEV_KEY"
   ```
2. Start emulator:
   ```bash
   firebase emulators:start --only functions
   ```
3. Point the frontend at the emulator (project root):
   ```bash
   export VITE_FUNCTIONS_BASE_URL="http://127.0.0.1:5001/<PROJECT_ID>/us-central1"
   npm run dev
   ```

Production
1. Store secret in Firebase Functions config:
   ```bash
   firebase functions:config:set gemini.key="YOUR_PROD_KEY"
   ```
2. Build & deploy functions:
   ```bash
   cd firebase/functions
   npm install
   npm run build
   firebase deploy --only functions
   ```
3. Set `VITE_FUNCTIONS_BASE_URL` in your hosting/CI to:
   ```text
   https://us-central1-<PROJECT_ID>.cloudfunctions.net
   ```

Notes
- Do NOT commit keys. Use `.env.local` only for local testing and add it to `.gitignore`.
- Prefer hosting rewrites (see hosting example) so the client can call relative `/api/*` paths.

---

### Firebase Hosting rewrite example (`firebase.json` snippet)

Add these rewrites to your Firebase Hosting config to map client paths to functions:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      { "source": "/api/resolveWebPageTitle", "function": "resolveWebPageTitle", "region": "us-central1" },
      { "source": "/api/generateSyllabus",      "function": "generateSyllabus",      "region": "us-central1" },
      { "source": "/api/performInitialScoping","function": "performInitialScoping","region": "us-central1" },
      { "source": "/api/generateSprintContent","function": "generateSprintContent","region": "us-central1" },
      { "source": "/api/**", "function": "generateSyllabus", "region": "us-central1" }
    ]
  }
}
```

With these rewrites the frontend may call relative endpoints like `POST /api/performInitialScoping` in production without a `VITE_FUNCTIONS_BASE_URL`.

---

### Emulator test script (how to run)

From the repository root:

```bash
# 1) Ensure emulator has the key set
cd firebase/functions
firebase functions:config:set gemini.key="YOUR_DEV_KEY"

# 2) Start the emulator in a terminal
firebase emulators:start --only functions

# 3) In another terminal, set client env and run dev server
export VITE_FUNCTIONS_BASE_URL="http://127.0.0.1:5001/<PROJECT_ID>/us-central1"
npm run dev

# 4) Open the app and trigger Scoping flows. Errors will surface as toasts and in Developer Console.
```

For scripted testing you can also run the emulator and dev server in separate terminals or use `tmux`/`concurrently` in CI.

---

### Codespaces (Dev Container) — quick guide

If you're working in a Codespace or dev container, follow these steps. The emulator and dev server run in the container; Codespaces will forward ports so you can open the app in the browser.

1) Install the Firebase CLI (if not already available):

```bash
# install globally (optional) or use npx
npm install -g firebase-tools
# or use: npx firebase <command>
```

2) Provide a Functions secret for the emulator.

Option A — recommended (no browser login required): create a local runtime config file in the functions folder:

```bash
mkdir -p firebase/functions
cat > firebase/functions/.runtimeconfig.json <<'JSON'
{"gemini": {"key": "YOUR_DEV_KEY"}}
JSON
```

Option B — if you prefer the Firebase CLI and are able to login from the Codespace:

```bash
cd firebase/functions
firebase login --no-localhost   # opens a browser-based auth flow
firebase functions:config:set gemini.key="YOUR_DEV_KEY"
```

3) Start the emulator (terminal A):

```bash
cd firebase/functions
npx firebase emulators:start --only functions
```

4) Start the frontend dev server (terminal B, project root):

```bash
export VITE_FUNCTIONS_BASE_URL="http://127.0.0.1:5001/<PROJECT_ID>/us-central1"
npm run dev
```

Notes for Codespaces:
- Codespaces automatically forwards the ports your processes listen on. If you run the emulator on port `5001` and Vite on `5173` (or 3001 in this project), open the forwarded ports in the Codespaces UI and then open them in the browser.
- If you used the `.runtimeconfig.json` method you don't need to run `firebase login` in the Codespace.
- For convenience, run the emulator in one terminal and the dev server in another. If you want a single command to show steps, use `npm run emulator:test` which prints the commands to run.

