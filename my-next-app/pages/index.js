import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
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

  // Load location data from Firebase
  useEffect(() => {
    const locationsRef = ref(db, "locations");
    const clustersRef = ref(db, "clusteredLocations");

    const unsubscribeLocations = onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      setLocations(data ? Object.values(data) : []);
      setIsLoading(false);
      //console.log("Fetched locations from Firebase:", data);
    });

    const unsubscribeClusters = onValue(clustersRef, (snapshot) => {
      const data = snapshot.val();
      setClusters(data ? Object.values(data) : []);
      //console.log("Fetched clusters from Firebase:", data);
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
        //console.log("Icons loaded:", loadedIcons);
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
    //console.log("Zoom level changed:", zoomLevel);
    const filtered = clusters.filter(cluster => cluster.ZoomLevel === zoomLevel);
    setFilteredClusters(filtered);
    //console.log("Filtered clusters:", filtered);
  }, [zoomLevel, clusters]);

  // Attach zoom event listener
  useEffect(() => {
    if (mapInstance) {
      //console.log("Map instance detected! Attaching zoomend listener...");

      const handleZoomEnd = () => {
        const newZoom = mapInstance.getZoom();
        //console.log("Zoom changed! New zoom level:", newZoom);

        setZoomLevel((prevZoom) => {
          if (prevZoom !== newZoom) {
            //console.log("Updating zoom level:", newZoom);
            return newZoom;
          }
          return prevZoom;
        });
      };

      mapInstance.on("zoomend", handleZoomEnd);

      return () => {
        //console.log("Cleaning up zoomend listener...");
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

  return (
    <div>
      <nav className="nav" style={{ textAlign: "left" }}>
        <Link href="/" legacyBehavior>
          <button>Home</button>
        </Link>
        <Link href="/aboutUs" legacyBehavior>
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
          whenCreated={(map) => {
            //console.log("Map instance created:", map);
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
              <Marker key={index} position={[cluster.Latitude, cluster.Longitude]} icon={icon}>
                <Popup>
                  <strong>{cluster.Name}</strong>
                  <br />
                  {cluster.Description}
                </Popup>
              </Marker>
            );
          })}
          {nonClusteredLocations.map((location, index) => {
            return (
              <Marker key={index} position={[location.Latitude, location.Longitude]} icon={icons[0]}>
                <Popup>
                  <strong>{location.Name}</strong>
                  <br />
                  {location.Description}
                </Popup>
              </Marker>
            );
          })}
          <UpdateMapView center={center} zoom={zoomLevel} onZoomChange={setZoomLevel} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
