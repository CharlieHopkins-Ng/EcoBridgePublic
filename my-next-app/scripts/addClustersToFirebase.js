import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

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

const addClustersToFirebase = async () => {
  const clustersPath = path.resolve("d:/Projects/EcoBridgePublic/my-next-app/data/clusteredLocations.json");
  const clusters = JSON.parse(fs.readFileSync(clustersPath, "utf-8"));
  const clustersRef = ref(db, "clusteredLocations");
  try {
    await set(clustersRef, clusters);
    console.log(`Clusters added to Firebase successfully. Total clusters: ${clusters.length}`);
  } catch (error) {
    console.error("Error adding clusters to Firebase:", error);
  } finally {
    process.exit();
  }
};

addClustersToFirebase();
