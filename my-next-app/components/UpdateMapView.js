import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

const UpdateMapView = ({ center, zoom, onZoomChange }) => {
  const map = useMap();
  const prevCenter = useRef(center);

  // Only update the map view when the center changes
  useEffect(() => {
    if (map && prevCenter.current && (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1])) {
      map.setView(center, zoom, { animate: true });
      prevCenter.current = center;
    }
  }, [center, zoom, map]);

  // Detect zoom changes without resetting the view
  useEffect(() => {
    if (map) {
      const handleZoomEnd = () => {
        const newZoom = map.getZoom();
        onZoomChange(newZoom); // Call the parent function to update zoom level
      };

      map.on("zoomend", handleZoomEnd);

      return () => {
        if (map) {
          map.off("zoomend", handleZoomEnd);
        }
      };
    }
  }, [map, onZoomChange]);

  return null;
};

export default UpdateMapView;