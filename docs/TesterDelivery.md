
Tester Delivery Guide — Web-first (no APK distribution)

Objective: provide testers with the latest web app delivered directly from a public URL (no APK distribution). The web app is the single source of truth and is automatically updated on each push to `main`.

Overview:
- Web host: GitHub Pages serves the production web build at `https://rendt.github.io/genius` (or your configured Pages URL).
- CI: `.github/workflows/deploy-gh-pages.yml` builds and publishes the `dist/` output on push to `main`.
- Backend: the AI/Gemini calls go through Firebase HTTPS Functions. Set a GitHub Repository Variable `VITE_FUNCTIONS_ORIGIN` to your deployed Functions origin (e.g. `https://us-central1-YOUR_FIREBASE_PROJECT.cloudfunctions.net`) so the GH Pages build points at the right backend.



Tester quick-start (web-only):
1. Push to `main` (or merge a PR) — the GH Pages workflow builds and publishes the latest site.
2. Open the site on any device using the public URL (Android device can use Chrome or any browser).
 
 
   - For local testing on a dev server, run:

```bash
npm ci
npm run dev
# on your machine IP: http://<your-ip>:3000 (ensure firewall allows access)
```

3. When testers open the URL, their browser will fetch `index.html`. The site includes an auto-update check that fetches `version.json` and forces a reload if the deployed SHA changed since the last visit.

Cache and update notes:
- The client script checks `./version.json` with `cache: 'no-store'` and reloads automatically when a new deployment is detected. This ensures testers see the latest build at app start without needing to manually clear cache.
- For fastest updates, keep HTML uncached and let static assets use long-term cache headers (assets have hashed filenames).
- If you need stricter control over HTTP headers, consider hosting on Netlify/Vercel where you can set headers explicitly.

Optional: Progressive Web App (PWA)
- If you want testers to 'install' the site like an app, consider adding a web manifest and service worker. That adds a native-like experience and offline capability.

Files changed/added to support web-only tester flow:
- `.github/workflows/deploy-gh-pages.yml` (writes `version.json` into `dist`)
- `index.html` (no-cache meta tags + auto-update check)

Next actions I can take:
- Add PWA support (manifest + service worker) so testers can install the web app.
- Configure hosting headers (if you migrate to Netlify/Vercel) to better control caching behavior.
- Remove the Expo wrapper artifacts if you no longer want that code in the repo.

If you'd like me to remove the `expo-wrapper/` folder and its CI workflow (since you don't want APKs distributed), tell me and I will delete them and update the docs accordingly.

