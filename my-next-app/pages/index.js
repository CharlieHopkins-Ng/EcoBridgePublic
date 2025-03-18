import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import React from "react";

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const UpdateMapView = dynamic(() => import("../components/UpdateMapView"), { ssr: false });

const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [treeIcon, setTreeIcon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [center, setCenter] = useState([12.3686, -1.5275]); // Default: Ouagadougou
  const [zoomLevel, setZoomLevel] = useState(2);

  useEffect(() => {
    const locationsRef = ref(db, "locations");
    onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      const locationsData = data ? Object.values(data) : [];
      setLocations(locationsData);
      setIsLoading(false);
    });

    const loadIcon = async () => {
      const L = await import("leaflet");
      const icon = new L.Icon({
        iconUrl: "/treeIcon.png",
        iconSize: [48, 48],
        iconAnchor: [24, 48], // Bottom middle of the icon
        popupAnchor: [0, -48], // Top middle of the icon
      });
      setTreeIcon(icon);
    };

    loadIcon();

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude];

          // Update center state
          setCenter(userCoords);
          setZoomLevel(12);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
        }
      );
    }
  }, []);

  if (isLoading || !treeIcon) {
    return <div>Loading...</div>;
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
        <MapContainer
          center={center}
          zoom={zoomLevel}
          className="map"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {locations.map((location, index) => {
            if (!location.Latitude || !location.Longitude) {
              console.log("Missing coordinates for location", location);
              return null;
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
          <UpdateMapView center={center} zoom={zoomLevel} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
