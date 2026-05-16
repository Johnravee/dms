# DMS — Beginner Guide

A short, simple guide to get you started with this project.

What this project is

- Dust Monitoring System (DMS) is a React Native + Expo app that shows sensor data
  and controls devices. It uses Firebase (Firestore and Realtime Database).

Quick structure (what's important)

- `app/` — app screens (login, dashboard, etc.)
- `components/` — reusable UI pieces
- `config/firebase.ts` — where the app reads Firebase settings
- `scripts/` — helper scripts (seed database, reset project)

Get setup (minimum steps)

1. Install Node.js (v16+). Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `.env.example` and add your Firebase web config.
   Do NOT commit `.env` to git.

3. Start the app for development:

```bash
npm run start
# open web: npm run web
# open Android: npm run android
```

Firebase basics (what you need)

- For development with Expo, you need the Firebase web config values. Set them in `.env`.
- If you build native apps (Android/iOS) you will also need:
  - Android: `google-services.json` placed in the Android project during the native build
  - iOS: `GoogleService-Info.plist` for iOS native builds

How the app uses Firebase (high level)

- Firestore: stores users, admin requests, and historical sensor readings.
- Realtime Database: holds the current live sensor values and device states.

If you want help

- I can add a very small step-by-step tutorial to: connect Firebase, fill `.env`,
  and run the app on Expo Go. Tell me which platform you use (web / Android / iOS).

That's it — a minimal README to get started. See `app/` to explore the source.
