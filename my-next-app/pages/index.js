import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { db, auth } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import haversine from "haversine-distance";
import Navbar from "../components/navBar";

const LeafletMap = dynamic(() => import("../components/leafletMap"), { ssr: false });

const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [center, setCenter] = useState([12.3686, -1.5275]);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUids, setAdminUids] = useState([]);
  const [displayList, setDisplayList] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [icons, setIcons] = useState({});

  // Load Firebase locations
  useEffect(() => {
    const locationsRef = ref(db, "locations");
    onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      setLocations(data ? Object.values(data) : []);
      setIsLoading(false);
    });
  }, []);

  // Load admin UIDs
  useEffect(() => {
    const adminUidsRef = ref(db, "adminUids");
    onValue(adminUidsRef, (snapshot) => {
      const data = snapshot.val();
      setAdminUids(data ? Object.keys(data) : []);
    });
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsAdmin(user && adminUids.includes(user.uid));
    });
    return () => unsubscribe();
  }, [adminUids]);

  // User location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoomLevel(12);
      },
      (err) => console.warn("Geolocation error:", err.message)
    );
  }, []);

  // Load icons client-side
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then((L) => {
      const iconPaths = [
        "/treeIcon.png", "/treeIcon2.png", "/treeIcon3.png",
        "/treeIcon4.png", "/treeIcon5.png", "/treeIcon6.png",
        "/treeIcon7.png", "/treeIcon8.png", "/treeIcon9.png",
        "/treeIcon9+.png", "/youAreHere.png"
      ];
      const loadedIcons = {};
      iconPaths.forEach((path, i) => {
        loadedIcons[i] = new L.Icon({
          iconUrl: path,
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48],
        });
      });
      setIcons(loadedIcons);
    });
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  const switchToList = () => setDisplayList(!displayList);

  if (isLoading || Object.keys(icons).length === 0) return <div>Loading...</div>;

  const filteredLocations = locations.filter(
    (loc) =>
      !searchQuery ||
      loc.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.Description && loc.Description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    if (!userLocation) return 0;
    const dA = haversine(userLocation, [a.Latitude, a.Longitude]);
    const dB = haversine(userLocation, [b.Latitude, b.Longitude]);
    return dA - dB;
  });

  return (
    <div>
      <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} />

      <header style={{ color: "green", marginTop: 100, padding: 10 }}>
        <h2>Find locations to help the environment near you</h2>
      </header>

      <button onClick={switchToList}>
        Switch to {displayList ? "Map" : "List"}
      </button>

      {displayList ? (
        <div style={{ marginTop: 20, padding: 10, width: 800 }}>
          <h2>Locations Near You</h2>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 15, padding: 8, width: "100%", maxWidth: 400 }}
          />

          <div style={{ marginTop: 20 }}>
            {filteredLocations.map((loc, i) => (
              <div key={i} style={{
                border: "1px solid #ccc", padding: 15, marginBottom: 15,
                borderRadius: 5, backgroundColor: "#f9f9f9"
              }}>
                <strong>
                  {loc.Website && loc.Website !== "N/A" ? (
                    <a href={loc.Website} target="_blank" rel="noopener noreferrer">{loc.Name}</a>
                  ) : loc.Name}
                </strong>
                <br />
                {loc.Description}
                <br />
                {loc.HowToHelp && <><strong>How to Help:</strong> {loc.HowToHelp}</>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <LeafletMap
          center={center}
          zoomLevel={zoomLevel}
          locations={locations}
          userLocation={userLocation}
          icons={icons}
        />
      )}
    </div>
  );
};

export default MapPage;
