const fs = require('fs');
const path = require('path');
const { initializeApp, getApps } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

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

// Haversine formula to calculate the distance between two points on the Earth's surface
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon1 - lon2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};
const zoomMult = 3;
// Define zoom levels and corresponding indistinguishability distances (in kilometers)
const zoomLevels = {
  0: 400 * zoomMult,
  1: 200 * zoomMult,
  2: 100 * zoomMult,
  3: 50 * zoomMult,
  4: 25 * zoomMult,
  5: 12.5 * zoomMult,
  6: 6.25 * zoomMult,
  7: 3.125 * zoomMult,
  8: 1.5625 * zoomMult,
  9: 0.78125 * zoomMult,
  10: 0.390625 * zoomMult,
  11: 0.1953125 * zoomMult,
  12: 0.09765625 * zoomMult,
  13: 0.048828125 * zoomMult,
  14: 0.0244140625 * zoomMult,
  15: 0.01220703125 * zoomMult,
  16: 0.006103515625 * zoomMult,
  17: 0.0030517578125 * zoomMult
};

// Fetch locations from Firebase and calculate clustered locations
const calculateClusteredLocations = async () => {
  const locationsRef = ref(db, 'locations');
  const snapshot = await get(locationsRef);
  const locations = snapshot.val() ? Object.values(snapshot.val()) : [];

  console.log("Fetched locations:", locations); // Debugging check

  const clusteredLocations = [];

  for (const [zoom, distance] of Object.entries(zoomLevels)) {
    const processed = new Set();

    for (let i = 0; i < locations.length; i++) {
      if (processed.has(i)) continue;

      const location1 = locations[i];
      const cluster = [location1];
      processed.add(i);

      for (let j = i + 1; j < locations.length; j++) {
        if (processed.has(j)) continue;

        const location2 = locations[j];
        const dist = haversineDistance(location1.Latitude, location1.Longitude, location2.Latitude, location2.Longitude);

        if (dist <= distance) {
          cluster.push(location2);
          processed.add(j);
        }
      }

      if (cluster.length > 1) {
        const avgLatitude = cluster.reduce((sum, loc) => sum + loc.Latitude, 0) / cluster.length;
        const avgLongitude = cluster.reduce((sum, loc) => sum + loc.Longitude, 0) / cluster.length;
        const locationNames = cluster.map(loc => loc.Name);

        clusteredLocations.push({
          Name: `${cluster.length} locations`,
          UUID: uuidv4(),
          Address: "",
          Latitude: avgLatitude,
          Longitude: avgLongitude,
          Description: "Zoom in to find more locations",
          ZoomLevel: parseInt(zoom),
          LocationNames: locationNames // Include all names of the locations in the cluster
        });
      }
    }
  }

  console.log("Clustered locations:", clusteredLocations); // Debugging check

  // Save clustered locations to JSON file
  const outputPath = path.resolve('d:/Projects/EcoBridgePublic/my-next-app/data/clusteredLocations.json');
  fs.writeFileSync(outputPath, JSON.stringify(clusteredLocations, null, 2), 'utf-8');

  console.log(`Clustered locations calculated and saved to ${outputPath}`);

  // Save clustered locations to Firebase
  const clustersRef = ref(db, "clusteredLocations");
  try {
    await set(clustersRef, clusteredLocations);
    console.log(`Clusters added to Firebase successfully. Total clusters: ${clusteredLocations.length}`);
  } catch (error) {
    console.error("Error adding clusters to Firebase:", error);
  }
};

calculateClusteredLocations();
