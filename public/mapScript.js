console.log("script.js is loaded!");

// Firebase configuration
const firebaseConfig = {
  //nuh uh
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const locationsRef = database.ref("locations");

let map; // Declare map variable in a higher scope

// Create custom icons
const treeIcon = L.icon({
    iconUrl: 'images/treeIcon.png', // Path to your custom icon
    iconSize: [48, 48], // Size of the icon
    iconAnchor: [24, 48], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -48] // Point from which the popup should open relative to the iconAnchor
});

const broomIcon = L.icon({
    iconUrl: 'images/broomIcon.png', // Path to your custom icon
    iconSize: [48, 48], // Size of the icon
    iconAnchor: [24, 48], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -48] // Point from which the popup should open relative to the iconAnchor
});

const helpIcon = L.icon({
    iconUrl: 'images/helpMarker.png', // Path to your custom icon
    iconSize: [48, 48], // Size of the icon
    iconAnchor: [24, 48], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -48] // Point from which the popup should open relative to the iconAnchor
});

// Function to load locations from Firebase and display them on the map
function loadLocations() {
    locationsRef.on("value", (snapshot) => {
        const locations = snapshot.val();
        if (locations) {
            Object.values(locations).forEach((location) => {
                // Determine the icon based on the location type
                let icon;
                if (location.type === "Tree Planting") {
                    icon = treeIcon;
                } else if (location.type === "Cleanup") {
                    icon = broomIcon;
                } else {
                    icon = treeIcon; // Default icon
                }

                // Add a marker for each location using the determined icon
                L.marker([location.Latitude, location.Longitude], { icon })
                    .addTo(map)
                    .bindPopup(`
                        <b>${location.Name}</b><br>
                        <i>${location.Address}</i><br>
                        <p>${location.Description || "No details available"}</p>
                    `);
            });
        }
    });
}

function initMap() {
    console.log("Initializing Map..."); // Debugging check

    // Create the map centered at Oberfucking, Austria
    map = L.map('map').setView([48.375956, 13.476389], 12);

    // Center the map to the user's current location if available
    navigator.geolocation.getCurrentPosition((position) => {
        map.setView([position.coords.latitude, position.coords.longitude], 12);
    });

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Load locations from Firebase and add markers
    loadLocations();
}

// Initialize the map and load locations when the document is ready
document.addEventListener("DOMContentLoaded", () => {
    console.log("Document is ready!");
    initMap(); // Ensure initMap is called after the DOM is fully loaded

    // Add event listener to the help icon
    const helpIconElement = document.querySelector('.help-icon');
    if (helpIconElement) {
        helpIconElement.addEventListener('click', () => {
            const helpPopup = document.getElementById('helpPopup');
            if (helpPopup) {
                helpPopup.style.display = 'block';
            }
        });
    }
});

// Function to close the help popup
function closeHelpPopup() {
    const helpPopup = document.getElementById('helpPopup');
    if (helpPopup) {
        helpPopup.style.display = 'none';
    }
}

// Function to show details of a location
function showDetails(name, address, description) {
    const detailsDiv = document.getElementById("details");
    if (detailsDiv) {
        detailsDiv.innerHTML = `
            <h2>${name}</h2>
            <p><strong>Type:</strong> ${address}</p>
            <p>${description}</p>
        `;
    }
}

function signOut() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
}