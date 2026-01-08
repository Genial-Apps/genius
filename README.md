<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1N_cUOsvs1kMITtRBm36EByT9In92yPmo

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm ci`
2. Start Firebase Functions (emulator recommended for local dev):
   - In one terminal:
     `cd firebase/functions && npm ci && npm run build && firebase emulators:start --only functions`
3. Point the web app at your Functions origin and run Vite:
   - In another terminal (project root):
     `export VITE_FUNCTIONS_ORIGIN=http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1 && npm run dev`
Production note: set the Gemini key via Firebase Functions config as described in `docs/DeploymentGuide.md` (do not ship it in the frontend).
