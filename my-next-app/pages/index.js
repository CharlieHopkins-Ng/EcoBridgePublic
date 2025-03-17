import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import React from "react";

// Dynamically import the components
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [treeIcon, setTreeIcon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const locationsRef = ref(db, "locations");
    onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      const locationsData = data ? Object.values(data) : [];
      setLocations(locationsData);
      setIsLoading(false);
      console.log("Locations data fetched:", locationsData); // Debugging log
    });

    const loadIcon = async () => {
      const L = await import("leaflet");
      const icon = new L.Icon({
        iconUrl: "/treeIcon.png",
        iconSize: [48, 48], // Adjust the size as needed
        iconAnchor: [16, 32], // Adjust the anchor as needed
        popupAnchor: [0, -32], // Adjust the popup anchor as needed
      });
      setTreeIcon(icon);
      console.log("Tree icon loaded successfully."); // Debugging log
    };

    loadIcon();
  }, []);

  if (isLoading || !treeIcon) {
    return <div>Loading...</div>; // Display loading message while data is being fetched
  }

  return (
    <div>
      <nav className="nav" style={{ textAlign: "left" }}>
        <Link href="/" legacyBehavior>
          <button>Home</button>
        </Link>
        <Link href="/about-us" legacyBehavior>
          <button>About Us</button>
        </Link>
        <Link href="/news" legacyBehavior>
          <button>News</button>
        </Link>
      </nav>
      <div className="map-container" style={{ height: "100vh" }}>
        <MapContainer center={[39.9042, 116.4074]} zoom={5} className="map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {locations.map((location, index) => {
            if (!location.Latitude || !location.Longitude) {
              console.log("Missing coordinates for location", location); // Debugging missing coordinates
              return null; // Skip if coordinates are missing
            }
            return (
              <Marker
                key={index}
                position={[location.Latitude, location.Longitude]}
                icon={treeIcon}
              >
                <Popup>
                  <strong>{location.Name}</strong><br />
                  {location.Address}<br />
                  {location.Description}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
