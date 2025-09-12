import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {ref, onValue, update, remove, runTransaction } from "firebase/database";
import { useRouter } from "next/router";
import Navbar from '../components/navBar';
import Head from "next/head";
import { app, db } from "../firebaseConfig";
import { useAuthRoles } from "../context/authRolesContext";

const YourLocations = () => {
    const [userLocations, setUserLocations] = useState([]);
    const [editingLocation, setEditingLocation] = useState(null);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState(""); // New state for website
    const [howToHelp, setHowToHelp] = useState(""); // New state for "How to Help"
    const [error, setError] = useState("");
    const [uid, setUid] = useState("");
    const [bannedMessage, setBannedMessage] = useState(""); // New state for banned message
    const auth = getAuth(app);
    const router = useRouter();
    const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
                fetchUserLocations(user.uid);

                const userRef = ref(db, `users/${user.uid}`);
                onValue(userRef, (snapshot) => {
                    const userData = snapshot.val();
                    if (userData?.banned) {
                        const banReason = userData.banReason || "No reason provided";
                        const banEndDate = userData.banEndDate || "Indefinite";
                        setBannedMessage(`You are banned. Reason: ${banReason}. Ban expires on: ${banEndDate}`);
                    }
                });
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    const fetchUserLocations = (uid) => {
        const locationsRef = ref(db, "locations");
        onValue(locationsRef, (snapshot) => {
            const data = snapshot.val();
            const userLocations = data ? Object.entries(data).filter(([id, location]) => location.Uid === uid) : [];
            setUserLocations(userLocations);
        });
    };

    const handleEdit = (location) => {
        setEditingLocation(location[0]);
        setName(location[1].Name);
        setAddress(location[1].Address);
        setLatitude(location[1].Latitude);
        setLongitude(location[1].Longitude);
        setDescription(location[1].Description);
        setWebsite(location[1].Website || "N/A");
        setHowToHelp(location[1].HowToHelp || ""); // Set "How to Help" field
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!name || !address || !latitude || !longitude || !description || !website || !howToHelp) {
            setError("All fields are required");
            return;
        }
        try {
            const locationData = {
                Name: name,
                Address: address,
                Latitude: parseFloat(latitude),
                Longitude: parseFloat(longitude),
                Description: description,
                Website: website || "N/A",
                HowToHelp: howToHelp // Add "How to Help" field
            };
            const locationRef = ref(db, `locations/${editingLocation}`);
            await update(locationRef, locationData);

            // Increment locationsEdited for the user
            const userRef = ref(db, `users/${uid}/locationsEdited`);
            await runTransaction(userRef, (currentValue) => {
                return (currentValue || 0) + 1; // Increment atomically
            });

            setEditingLocation(null);
            fetchUserLocations(uid);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDelete = async (locationId) => {
        try {
            const locationRef = ref(db, `locations/${locationId}`);
            await remove(locationRef);
            fetchUserLocations(uid);
            alert("Location deleted successfully.");
        } catch (error) {
            setError(error.message);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <div>
            <Head>
                <title>Your Locations - EcoBridge</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} isTranslator={isTranslator}/>
            <div className="container">
                <h1>Your Locations</h1>
                {bannedMessage ? (
                    <p style={{ color: "red" }}>{bannedMessage}</p>
                ) : isAuthenticated ? (
                    <div>
                        <p><strong>Current UID:</strong> {uid}</p>
                        {userLocations.length > 0 ? (
                            userLocations.map(([id, location]) => (
                                <div key={id} className="location">
                                    <h3>{location.Name}</h3>
                                    <p><strong>Address:</strong> {location.Address}</p>
                                    <p><strong>Latitude:</strong> {location.Latitude}</p>
                                    <p><strong>Longitude:</strong> {location.Longitude}</p>
                                    <p><strong>Description:</strong> {location.Description}</p>
                                    <p><strong>Website:</strong> {location.Website !== "N/A" ? <a href={location.Website} target="_blank" rel="noopener noreferrer">{location.Website}</a> : "N/A"}</p>
                                    <p><strong>How to Help:</strong> {location.HowToHelp || "N/A"}</p>
                                    <button onClick={() => handleEdit([id, location])}>Edit</button>
                                    <button onClick={() => handleDelete(id)}>Delete</button>
                                </div>
                            ))
                        ) : (
                            <p>No locations submitted.</p>
                        )}
                        {editingLocation && (
                            <form onSubmit={handleUpdate} style={{ textAlign: "left", width: "100%" }}>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Latitude"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Longitude"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    required
                                />
                                <textarea
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Website (optional)"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                                <textarea
                                    placeholder="How to Help"
                                    value={howToHelp}
                                    onChange={(e) => setHowToHelp(e.target.value)}
                                    required
                                />
                                {error && <p style={{ color: "red" }}>{error}</p>}
                                <button type="submit">Update Location</button>
                            </form>
                        )}
                    </div>
                ) : (
                    <p>You need to be signed in to view your locations.</p>
                )}
            </div>
        </div>
    );
};

export default YourLocations;
