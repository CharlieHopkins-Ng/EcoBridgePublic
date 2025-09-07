import { useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const UpdateMapView = dynamic(() => import("./UpdateMapView"), { ssr: false });

const MapView = ({
    center,
    zoomLevel,
    setZoomLevel,
    filteredClusters,
    nonClusteredLocations,
    icons,
    userLocation,
    getClusterIcon,
    setSelectedMarker,
    setMapInstance,
    mapRef
}) => {
    const MemoizedMarker = ({ position, icon, onClick, popupContent }) => (
        <Marker position={position} icon={icon} eventHandlers={{ click: onClick }}>
            <Popup>{popupContent}</Popup>
        </Marker>
    );

    // Attach zoom event listener
    useEffect(() => {
        if (mapRef.current) {
            const handleZoomEnd = () => {
                const newZoom = mapRef.current.getZoom();
                setZoomLevel(newZoom);
            };

            mapRef.current.on("zoomend", handleZoomEnd);

            return () => {
                if (mapRef.current) {
                    mapRef.current.off("zoomend", handleZoomEnd);
                }
            };
        }
    }, [mapRef.current, setZoomLevel]);

    return (
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
                {nonClusteredLocations.map((location, index) => (
                    <MemoizedMarker
                        key={index}
                        position={[location.Latitude, location.Longitude]}
                        icon={icons[0]}
                        onClick={() => setSelectedMarker(location.UUID)}
                        popupContent={
                            <>
                                <strong>
                                    {location.Website && location.Website !== "N/A" ? (
                                        <a href={location.Website} target="_blank" rel="noopener noreferrer">
                                            {location.Name}
                                        </a>
                                    ) : (
                                        location.Name
                                    )}
                                </strong>
                                <br />
                                {location.Description}
                                <br />
                                {location.HowToHelp && <><strong>How to Help:</strong> {location.HowToHelp}</>}
                            </>
                        }
                    />
                ))}
                {userLocation && (
                    <MemoizedMarker
                        position={userLocation}
                        icon={icons[10]}
                        popupContent={<strong>You are here</strong>}
                        onClick={() => {}}
                    />
                )}
                <UpdateMapView center={center} zoom={zoomLevel} onZoomChange={setZoomLevel} />
            </MapContainer>
        </div>
    );
};

export default MapView;