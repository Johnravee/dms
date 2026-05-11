Firestore Structure Required:
Create a sensors collection with a current document containing:

{
"pm25": 45.2,
"gas": 220,
"humidity": 65,
"temperature": 28.5,
"timestamp": "2026-04-09T..."
}

Also create a devices collection with documents for each device:

{
"name": "Fan",
"type": "fan",
"status": "on",
"isOn": true,
"lastUpdated": "2026-04-09T..."
}

{
"name": "Purifier",
"type": "purifier",
"status": "active",
"isOn": true,
"lastUpdated": "2026-04-09T..."
}

{
"name": "Humidifier",
"type": "humidifier",
"status": "idle",
"isOn": false,
"lastUpdated": "2026-04-09T..."
}

npm install expo-print expo-sharing expo-file-system for pdf export
Setup

-
- Create a `.env` file from `.env.example` and fill in your Firebase values. Do NOT commit `.env`.
- If your native builds require `google-services.json` (Android) or `GoogleService-Info.plist` (iOS), place them locally during your build step. Example templates are provided in `google-services.json.example`.

The app reads Firebase config from the following environment variables (see `.env.example`):

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_FIREBASE_RTDB_URL`

Do not commit secret or service account files to the repository. Use CI/CD secret storage or local files excluded by `.gitignore`.
