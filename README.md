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

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey:
process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
"AIzaSyCUCPewCt_XTxHFZKCxgoNOARahWwwXeUE",
authDomain:
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
"dust-monitoring-system.firebaseapp.com",
projectId:
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "dust-monitoring-system",
storageBucket:
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
"dust-monitoring-system.firebasestorage.app",
messagingSenderId:
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "620079919441",
appId:
process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
"1:620079919441:web:5c2b62b3cb99f9c849e370",
measurementId:
process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-0C7EPYZRJP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(
app,
process.env.EXPO_PUBLIC_FIREBASE_RTDB_URL ||
"https://dust-monitoring-system-default-rtdb.asia-southeast1.firebasedatabase.app",
);
