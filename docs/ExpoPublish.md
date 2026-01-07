Quick Expo publish steps

Notes:
- This repo is primarily a Vite web app. Running in Expo Go (native) is likely incompatible without porting to React Native (e.g., replacing DOM APIs like `localStorage`, `window.scrollTo`, and HTML/CSS).
- Use EAS Updates to publish JS to an existing native Expo app or use EAS Builds to produce an Android artifact.

1) Create an Expo token locally:

```bash
npx expo login    # if not logged in
npx expo token:create --name github-actions-token
```

Copy the token and add it to the GitHub repo secrets as `EXPO_TOKEN`.

2) From CI (the existing workflow uses `eas update`) or locally, publish an update:

```bash
# install if needed
npm install -g eas-cli
npm ci
# publish an update to EAS
npm run eas:update
```

3) Build an Android artifact on Expo servers:

```bash
npm run eas:build:android
# follow URL printed by eas CLI to download the APK/AAB
```

4) To open in Expo Go:
- The app must be a React Native/Expo-managed app. If you already have a native wrapper on Expo (projectId in `app.json`), you can run `expo start` and scan the QR code with Expo Go.

If you want, I can:
- Add the GitHub Actions step to run `eas build` on push, or
- Help port the app to a React Native structure for full Expo Go compatibility.
