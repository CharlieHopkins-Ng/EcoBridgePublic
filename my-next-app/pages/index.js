import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { db, auth } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useRouter } from "next/router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import React from "react";

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const UpdateMapView = dynamic(() => import("../components/UpdateMapView"), { ssr: false });

const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [filteredClusters, setFilteredClusters] = useState([]);
  const [icons, setIcons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [center, setCenter] = useState([12.3686, -1.5275]); // Default: Ouagadougou
  const [zoomLevel, setZoomLevel] = useState(2);
  const [mapInstance, setMapInstance] = useState(null);
  const mapRef = useRef(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmails, setAdminEmails] = useState([]);
  const [adminUids, setAdminUids] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAdminEmails = async () => {
      const adminEmailsRef = ref(db, "adminEmails");
      onValue(adminEmailsRef, (snapshot) => {
        const data = snapshot.val();
        setAdminEmails(data ? Object.values(data) : []);
      });
    };

    fetchAdminEmails();
  }, []);

  useEffect(() => {
    const fetchAdminUids = async () => {
      const adminUidsRef = ref(db, "adminUids");
      onValue(adminUidsRef, (snapshot) => {
        const data = snapshot.val();
        setAdminUids(data ? Object.keys(data) : []);
      });
    };

    fetchAdminUids();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsAdmin(user && adminUids.includes(user.uid));
    });
    return () => unsubscribe();
  }, [auth, adminUids]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Load location data from Firebase
  useEffect(() => {
    const locationsRef = ref(db, "locations");
    const clustersRef = ref(db, "clusteredLocations");

    const unsubscribeLocations = onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Locations fetched:", data); // Debugging check for locations
      setLocations(data ? Object.values(data) : []);
      setIsLoading(false);
    });

    const unsubscribeClusters = onValue(clustersRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Clusters fetched:", data); // Debugging check for clusters
      setClusters(data ? Object.values(data) : []);
    });

    return () => {
      unsubscribeLocations();
      unsubscribeClusters();
    };
  }, []);

  // Load map icons dynamically
  useEffect(() => {
    const loadIcons = async () => {
      if (typeof window !== "undefined") {
        const L = await import("leaflet");
        const iconPaths = [
          "/treeIcon.png",
          "/treeIcon2.png",
          "/treeIcon3.png",
          "/treeIcon4.png",
          "/treeIcon5.png",
          "/treeIcon6.png",
          "/treeIcon7.png",
          "/treeIcon8.png",
          "/treeIcon9.png",
          "/treeIcon9+.png"
        ];
        const loadedIcons = {};

        for (let i = 0; i < iconPaths.length; i++) {
          loadedIcons[i] = new L.Icon({
            iconUrl: iconPaths[i],
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            popupAnchor: [0, -48],
          });
        }

        setIcons(loadedIcons);
      }
    };

    loadIcons();
  }, []);

  // Get user location for centering the map
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
          setZoomLevel(12);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
        }
      );
    }
  }, []);

  // Update clusters when zoom changes
  useEffect(() => {
    const filtered = clusters.filter(cluster => cluster.ZoomLevel === zoomLevel);
    setFilteredClusters(filtered);
  }, [zoomLevel, clusters]);

  // Attach zoom event listener
  useEffect(() => {
    if (mapInstance) {
      const handleZoomEnd = () => {
        const newZoom = mapInstance.getZoom();
        setZoomLevel(newZoom);
      };

      mapInstance.on("zoomend", handleZoomEnd);

      return () => {
        mapInstance.off("zoomend", handleZoomEnd);
      };
    }
  }, [mapInstance]);

  if (isLoading || Object.keys(icons).length === 0) {
    return <div>Loading...</div>;
  }

  const getClusterIcon = (count) => {
    if (count >= 10) return icons[9];
    if (count >= 9) return icons[8];
    if (count >= 8) return icons[7];
    if (count >= 7) return icons[6];
    if (count >= 6) return icons[5];
    if (count >= 5) return icons[4];
    if (count >= 4) return icons[3];
    if (count >= 3) return icons[2];
    if (count >= 2) return icons[1];
    return icons[0];
  };

  const nonClusteredLocations = locations.filter(location => {
    return !filteredClusters.some(cluster => cluster.LocationNames.includes(location.Name));
  });

  const MemoizedMarker = React.memo(({ position, icon, onClick, popupContent }) => (
    <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
      <Popup>{popupContent}</Popup>
    </Marker>
  ));

  return (
    <div>
      <nav className="nav">
        <div className="nav-left">
          <Link href="/" legacyBehavior>
            <button>Home</button>
          </Link>
          <Link href="/aboutUs" legacyBehavior>
            <button>About Us</button>
          </Link>
          <Link href="/news" legacyBehavior>
            <button>News</button>
          </Link>
          <Link href="/submitLocation" legacyBehavior>
            <button>{isAdmin ? "Add Location" : "Submit Location"}</button>
          </Link>
          {isAdmin && (
            <Link href="/admin" legacyBehavior>
              <button>Admin</button>
            </Link>
          )}
          {isAuthenticated && (
            <>
              <Link href="/yourLocations" legacyBehavior>
                <button>Your Locations</button>
              </Link>
              <Link href="/yourProfile" legacyBehavior>
                <button>Your Profile</button>
              </Link>
            </>
          )}
        </div>
        <div className="nav-right">
          {!isAuthenticated && (
            <>
              <Link href="/signup" legacyBehavior>
                <button>Sign Up</button>
              </Link>
              <Link href="/login" legacyBehavior>
                <button>Log In</button>
              </Link>
            </>
          )}
          {isAuthenticated && (
            <button onClick={handleSignOut}>Sign Out</button>
          )}
        </div>
      </nav>

      <header className="header" style={{ color: "green", marginTop: "100px" , padding: "10px"}} >
        <h2>Find locations to help the environment near you</h2>
      </header>

      <div className="map-container" style={{ height: "50vh", marginTop: "20px" }}>
        <MapContainer
          center={center}
          zoom={zoomLevel}
          className="map"
          whenCreated={(map) => {
            mapRef.current = map;
            setMapInstance(map);
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredClusters.map((cluster, index) => {
            const icon = getClusterIcon(cluster.LocationNames.length);
            return (
              <MemoizedMarker
                key={index}
                position={[cluster.Latitude, cluster.Longitude]}
                icon={icon}
                onClick={() => setSelectedMarker(cluster.UUID)}
                popupContent={<><strong>{cluster.Name}</strong><br />{cluster.Description}</>}
              />
            );
          })}
          {nonClusteredLocations.map((location, index) => {
            return (
              <MemoizedMarker
                key={index}
                position={[location.Latitude, location.Longitude]}
                icon={icons[0]}
                onClick={() => setSelectedMarker(location.UUID)}
                popupContent={<><strong>{location.Name}</strong><br />{location.Description}</>}
              />
            );
          })}
          <UpdateMapView center={center} zoom={zoomLevel} onZoomChange={setZoomLevel} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
