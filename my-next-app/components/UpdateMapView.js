import { useEffect } from "react";
import { useMap } from "react-leaflet";

const UpdateMapView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

export default UpdateMapView;
