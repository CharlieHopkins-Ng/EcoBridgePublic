const firebase = require('firebase/app');
require('firebase/database');
const fs = require('fs');

// Firebase configuration
const firebaseConfig = {
  //nuh uh
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Read locations from JSON file
const locations = JSON.parse(fs.readFileSync('locations.json', 'utf8'));

// Function to add locations to Firebase
function addLocationsToFirebase() {
  let completed = 0;
  locations.forEach((location, index) => {
    const locationKey = location.Name.replace(/\s+/g, '_'); // Use the location name as the key
    const locationRef = database.ref('locations/' + locationKey);
    locationRef.set({
      Name: location.Name,
      Address: location.Address,
      Latitude: location.Latitude,
      Longitude: location.Longitude,
      Description: location.Description
    }, (error) => {
      if (error) {
        console.error(`Error adding location ${index + 1}:`, error);
      } else {
        console.log(`Location ${index + 1} added successfully.`);
      }
      completed++;
      if (completed === locations.length) {
        console.log('All locations added.');
        process.exit(0); // Exit the script when finished
      }
    });
  });
}

// Add locations to Firebase
addLocationsToFirebase();
