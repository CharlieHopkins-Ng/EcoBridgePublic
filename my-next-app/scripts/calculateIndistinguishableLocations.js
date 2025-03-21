const fs = require('fs');
const path = require('path');
const { initializeApp, getApps } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
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

// Define zoom levels and corresponding indistinguishability distances (in kilometers)
const zoomLevels = {
  0: 1000,
  1: 1000,
  2: 100,
  3: 50,
  4: 25,
  5: 12.5,
  6: 6.25,
  7: 3.125,
  8: 1.5625,
  9: 0.78125,
  10: 0.390625,
  11: 0.1953125,
  12: 0.09765625,
  13: 0.048828125,
  14: 0.0244140625,
  15: 0.01220703125,
  16: 0.006103515625,
  17: 0.0030517578125,
  18: 0.00152587890625,
  19: 0.000762939453125,
  20: 0.0003814697265625
};

// Fetch locations from Firebase and calculate indistinguishable locations
const calculateIndistinguishableLocations = async () => {
  const locationsRef = ref(db, 'locations');
  const snapshot = await get(locationsRef);
  const locations = snapshot.val() ? Object.values(snapshot.val()) : [];

  const indistinguishableLocations = {};

  for (const [zoom, distance] of Object.entries(zoomLevels)) {
    indistinguishableLocations[zoom] = {};

    let groupIndex = 1;
    for (let i = 0; i < locations.length; i++) {
      const location1 = locations[i];
      const indistinguishableGroup = [location1.Name];

      for (let j = i + 1; j < locations.length; j++) {
        const location2 = locations[j];
        const dist = haversineDistance(location1.Latitude, location1.Longitude, location2.Latitude, location2.Longitude);

        if (dist <= distance) {
          indistinguishableGroup.push(location2.Name);
        }
      }

      if (indistinguishableGroup.length > 1) {
        indistinguishableLocations[zoom][`group${groupIndex}`] = indistinguishableGroup;
        groupIndex++;
      }
    }
    console.log(`Zoom level ${zoom}:`, indistinguishableLocations[zoom]); // Debugging check
  }

  // Save indistinguishable locations to JSON file
  const outputPath = path.resolve('d:/Projects/EcoBridgePublic/my-next-app/data/indistinguishableLocations.json');
  fs.writeFileSync(outputPath, JSON.stringify(indistinguishableLocations, null, 2), 'utf-8');

  console.log(`Indistinguishable locations calculated and saved to ${outputPath}`);
};

calculateIndistinguishableLocations();
