**App Store / Public Distribution Strategy**

Goal: prepare a clear, incremental path from web-first development to full native apps on Android/iOS with OTA updates for testers and users.

1) Phase 0 — Web-first (current)
- Continue rapid feature development with Vite web app and GitHub Pages (or Vercel).
- Pros: extremely fast dev loops, single codebase for UI logic, minimal native setup.
- Limitations: no native APIs, different UX on native devices.

2) Phase 1 — Native Wrapper (recommended short-term)
- Create a minimal Expo-managed wrapper that loads the hosted web app in a WebView.
- Purpose: provide a native container for distribution to testers via APK/AAB while keeping web deployments as the primary code path.
- Benefits: very fast to implement, OTA-like flow by updating the web host, access to some native features if needed through the wrapper.
- Drawbacks: limited native performance, styling and some web APIs may behave differently.

3) Phase 2 — Port critical screens to React Native
- Identify a small subset of screens that need native behavior (login, camera, background tasks) and port them to RN while keeping the rest as WebView or progressively migrate.
- Use a hybrid strategy: WebView for most content + native RN screens for platform features.

4) Phase 3 — Full React Native (Expo-managed)
- Port full UI to React Native (or use frameworks to adapt where useful). Use EAS Build for store binaries.
- Use EAS Update to push JS changes OTA to users without new store releases.
- Prepare store metadata, icons, screenshots, privacy policy, and signing keys.

Store-readiness checklist (what to prepare now):
- `app.json`/`app.config.js` filled with correct metadata: name, slug, bundle identifiers, icons, splash screens.
- `eas.json` with production build profiles.
- Keystore for Android (or allow EAS to manage) and App Store Connect API key for iOS.
- CI workflows to create builds automatically (on tags/releases) and optionally `eas submit` to upload artifacts.
- Secrets stored in GitHub: `EXPO_TOKEN`, keystore or `GOOGLE_PLAY_SERVICE_ACCOUNT`, `APP_STORE_CONNECT_API_KEY` (where applicable).

Security & release discipline:
- Protect release branches and require reviews for release PRs.
- Use versioning (semantic) and release tags for store uploads.
- Maintain changelogs for testers and users.

Rollout & testing:
- Use internal/closed testing tracks (Google Play internal testing, TestFlight) for staged rollouts.
- Use EAS Update for faster iterations to testers between native builds.


References:
- Expo EAS Build & Update docs
- Google Play internal testing / App Store TestFlight guidelines


Prepared by: repo automation — added to `docs/` for AI agents and contributors.
