import React from 'react';
import haversine from 'haversine-distance';

const ListView = ({ locations, searchQuery, setSearchQuery, userLocation }) => {
    return (
        <div style={{ marginTop: "20px", padding: "10px", width: "800px"}}>
            <h2>Locations Near You</h2>
            <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: "15px", padding: "8px", width: "100%", maxWidth: "400px" }}
            />
            
            <div style={{ marginTop: "20px" }}>
                {locations
                    .filter(location => 
                        searchQuery === '' || 
                        location.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (location.Description && location.Description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .sort((a, b) => {
                        if (!userLocation) return 0;
                        const distanceA = haversine(userLocation, [a.Latitude, a.Longitude]);
                        const distanceB = haversine(userLocation, [b.Latitude, b.Longitude]);
                        return distanceA - distanceB;
                    })
                    .map((location, index) => (
                        <div key={index} className="location-container" style={{ 
                            border: "1px solid #ccc", 
                            padding: "15px", 
                            marginBottom: "15px", 
                            borderRadius: "5px",
                            backgroundColor: "#f9f9f9"
                        }}>
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
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default ListView;