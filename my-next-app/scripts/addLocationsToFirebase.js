import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

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

const db = getDatabase(app);

const addLocationsToFirebase = async () => {
  const locationsPath = path.resolve("d:/Projects/EcoBridgePublic/my-next-app/data/locations.json");
  const locations = JSON.parse(fs.readFileSync(locationsPath, "utf-8"));

  // Ensure each location has a UUID
  const locationsWithUUIDs = locations.map(location => ({
    ...location,
    UUID: location.UUID || uuidv4()
  }));

  const locationsRef = ref(db, "locations");
  try {
    await set(locationsRef, locationsWithUUIDs);
    console.log(`Locations added to Firebase successfully. Total locations: ${locationsWithUUIDs.length}`);
  } catch (error) {
    console.error("Error adding locations to Firebase:", error);
  } finally {
    process.exit();
  }
};

addLocationsToFirebase();
