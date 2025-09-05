import { useEffect, useRef } from "react";

const LeafletMap = ({ center, zoomLevel, locations, userLocation, icons }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mapInstance;

    import("leaflet").then((L) => {
      // Only initialize once
      if (!mapRef.current) {
        const mapDiv = document.getElementById("map");
        if (!mapDiv) return;

        mapInstance = L.map(mapDiv).setView(center, zoomLevel);
        mapRef.current = mapInstance;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance);

        // Add markers
        locations.forEach((loc) => {
          const icon = icons?.[0] || undefined;
          L.marker([loc.Latitude, loc.Longitude], { icon })
            .addTo(mapInstance)
            .bindPopup(`<strong>${loc.Name}</strong><br/>${loc.Description}`);
        });

        // User location
        if (userLocation) {
          L.marker(userLocation, { icon: icons?.[10] })
            .addTo(mapInstance)
            .bindPopup("<strong>You are here</strong>");
        }
      }
    });

    return () => {
      // Cleanup map when unmounting
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoomLevel, locations, userLocation, icons]);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "70vh", // Make sure it has a height
        marginTop: "20px",
      }}
    />
  );
};

export default LeafletMap;
