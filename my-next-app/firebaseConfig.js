import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";   // Realtime DB
import { getFirestore } from "firebase/firestore"; // Firestore
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ✅ Realtime Database (for your main features)
const rtdb = getDatabase(app);

// ✅ Firestore (for translations)
const firestore = getFirestore(app);

// ✅ Auth
const auth = getAuth(app);

export { rtdb, firestore, auth, app, firebaseConfig };
export { rtdb as db }; // Export Realtime Database as 'db' for consistency with existing code