# Dust Monitoring System (DMS)

This repository contains the DMS Expo app (React Native + Expo Router) used to monitor sensors and control devices via Firebase (Firestore/RTDB).

**Contents of this README**

- Project structure
- Firestore / Realtime Database required data
- Firebase setup (console + env vars)
- Local and CI notes for native config files
- How to run the app (web / Android / iOS)

## Project structure

Top-level layout (important files and folders):

- `app/` — Expo Router pages and layouts
  - `index.tsx`, `login.tsx`, `register.tsx`, `modal.tsx`
  - `(dashboard)/` — dashboard screens (devices, history, profile, controls)
- `assets/` — images
- `components/` — shared UI components
- `config/` — runtime config helpers (`config/firebase.ts`)
- `constants/` — theme constants
- `contexts/` — React contexts (auth, alert)
- `hooks/` — custom hooks (sensor data/history)
- `scripts/` — helper scripts (`reset-project.js`, `seed-database.ts`)
- `utils/` — helpers (logger, notifications, pdfGenerator)
- `google-services.json.example` — example native Android config (placeholder)
- `.env.example` — environment variable template
- `package.json` — scripts and dependencies

## Firebase data structure required

The app uses Firestore for user/auth/admin data and sensor history, and Realtime Database for live sensor and device state.

### Firestore collections

- `users/{uid}`

```
{
	"email": "user@example.com",
	"role": "user",
	"createdAt": "2026-04-09T..."
}
```

- `sensorHistory/{documentId}`

```
{
	"pm25": 45.2,
	"gas": 220,
	"humidity": 65,
	"temperature": 28.5,
	"timestamp": "2026-04-09T..."
}
```

- `admin_requests/{uid}`

```
{
	"uid": "abc123",
	"email": "user@example.com",
	"status": "pending",
	"requestedAt": "2026-04-09T...",
	"reviewedAt": null,
	"reviewedBy": null
}
```

### Realtime Database paths

- `sensors/current`

```
{
	"pm25": 45.2,
	"gas": 220,
	"humidity": 65,
	"temperature": 28.5,
	"timestamp": "2026-04-09T..."
}
```

- `devices/{deviceId}` where `deviceId` can be `fan1`, `purifier1`, `humidifier1`, etc.

```
{
	"name": "Fan",
	"type": "fan",
	"status": "on",
	"isOn": true,
	"isAuto": false,
	"mode": "manual",
	"lastUpdated": "2026-04-09T..."
}
```

## Firebase setup (web / Expo)

1. Create a project in the Firebase Console.
2. Register your app (Web / Android / iOS) in Project Settings.
3. For web/Expo-managed builds, copy the Firebase config values and set them in a local `.env` file using the provided `.env.example`.

Required environment variables (copy to `.env`):

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)
- `EXPO_PUBLIC_FIREBASE_RTDB_URL` (for Realtime DB)
- `EXPO_PUBLIC_APP_ENV` (e.g., `development`)
- `EXPO_PUBLIC_API_URL` (backend API, if used)

Notes:

- Do NOT commit `.env`. The repository already ignores `.env*` files.
- The app reads these values from `process.env` in `config/firebase.ts`.

## Native config files (Android / iOS)

- Android: `google-services.json` (place at `android/app/google-services.json` for native builds).
- iOS: `GoogleService-Info.plist` (add to the iOS project root for native builds).

These files identify your native app to Firebase and are required only for native builds (not for web). Keep them out of version control.

We provide `google-services.json.example` with placeholders so you know the expected structure.

## CI / Build recommendations

- Store native config files in your CI/CD secret storage (GitHub Secrets, GitLab CI variables, etc.). During the build, write the secret content to the expected file path before the native build step.
- For Expo EAS builds, you can use EAS secrets or the `eas.json` credentials features to inject native config during build.

Example (GitHub Actions snippet idea): write secret `GOOGLE_SERVICES_JSON` to `android/app/google-services.json` before `eas build` or `gradle assemble`.

## Run locally (development)

Prerequisites:

- Node.js (v16+ recommended)
- Yarn or npm
- `expo-cli` (optional, `npx expo` works)

Install dependencies:

```bash
npm install
# or
yarn install
```

Start the dev server (Metro + Expo):

```bash
npm run start
# open web
npm run web
# open Android (via Expo Go or emulator)
npm run android
# open iOS (macOS only / simulator)
npm run ios
```

Notes:

- For simple development and Expo Go testing, using the environment variables + Expo Go is sufficient.
- For native builds that require push notifications or other native-only Firebase functionality, provide the native config files locally or via CI.

## Build for production

- Use `eas build` for managed or bare native builds (recommended for production). Configure credentials and native files via EAS or your CI.
- For web, run the normal Expo web build process (`expo build:web` or appropriate bundler commands).

## Troubleshooting

- If you see "Firebase: No API key" or authentication errors, verify your `.env` values or native config files for typos.
- If you previously committed secrets, rotate API keys and remove them from history.

---

If you want, I can also:

- add a sample GitHub Actions workflow that injects `google-services.json` from a secret, or
- create a short script to copy native config files from a local `secrets/` folder ignored by git.

Let me know which you'd prefer and I will add it.
