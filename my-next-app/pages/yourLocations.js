import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {ref, onValue, update, remove, runTransaction } from "firebase/database";
import { useRouter } from "next/router";
import Navbar from '../components/navBar';
import Head from "next/head";
import { app, db } from "../firebaseConfig";
import { useAuthRoles } from "../context/authRolesContext";
import { useTranslation } from "../hooks/useTranslation";

const YourLocations = ({onLanguageChange, currentLanguage}) => {
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

    const { t: tlocations } = useTranslation(currentLanguage, "YourLocations");
    const { t: tcommon } = useTranslation(currentLanguage, "common");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
                fetchUserLocations(user.uid);

                const userRef = ref(db, `users/${user.uid}`);
                onValue(userRef, (snapshot) => {
                    const userData = snapshot.val();
                    if (userData?.banned) {
                        const banReason = userData.banReason || tcommon("noReasons");
                        const banEndDate = userData.banEndDate || tcommon("indefinite");
                        setBannedMessage(tcommon("banned"), tcommon("reason"), banReason, tcommon("banExpires"), banEndDate);
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
            setError(tlocations(allFieldsRequired));
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
                <title>{tlocations("yourLocations")} - EcoBridge</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <Navbar
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                handleSignOut={handleSignOut}
                isTranslator={isTranslator}
                onLanguageChange={onLanguageChange}
                currentLanguage={currentLanguage}
            />
            <div className="container">
                <h1>{tlocations("yourLocations")}</h1>
                {bannedMessage ? (
                    <p style={{ color: "red" }}>{bannedMessage}</p>
                ) : isAuthenticated ? (
                    <div>
                        {userLocations.length > 0 ? (
                            userLocations.map(([id, location]) => (
                                <div key={id} className="location">
                                    <h3>{location.Name}</h3>
                                    <p>
                                        <strong>{tlocations("address")}:</strong> {location.Address}
                                    </p>
                                    <p>
                                        <strong>{tlocations("latitude")}:</strong> {location.Latitude}
                                    </p>
                                    <p>
                                        <strong>{tlocations("longitude")}:</strong> {location.Longitude}
                                    </p>
                                    <p>
                                        <strong>{tlocations("description")}:</strong> {location.Description}
                                    </p>
                                    <p>
                                        <strong>{tlocations("website")}:</strong>{" "}
                                        {location.Website !== "N/A" ? (
                                            <a
                                                href={location.Website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {location.Website}
                                            </a>
                                        ) : (
                                            "N/A"
                                        )}
                                    </p>
                                    <p>
                                        <strong>{tlocations("howToHelp")}:</strong>{" "}
                                        {location.HowToHelp || "N/A"}
                                    </p>
                                    <button onClick={() => handleEdit([id, location])}>
                                        {tlocations("edit")}
                                    </button>
                                    <button onClick={() => handleDelete(id)}>
                                        {tlocations("delete")}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>{tlocations("noLocations")}</p>
                        )}
                        {editingLocation && (
                            <form onSubmit={handleUpdate} style={{ textAlign: "left", width: "100%" }}>
                                <input
                                    type="text"
                                    placeholder={tlocations("name")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder={tlocations("address")}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder={tlocations("latitude")}
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder={tlocations("longitude")}
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    required
                                />
                                <textarea
                                    placeholder={tlocations("description")}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder={tlocations("website")}
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                                <textarea
                                    placeholder={tlocations("howToHelp")}
                                    value={howToHelp}
                                    onChange={(e) => setHowToHelp(e.target.value)}
                                    required
                                />
                                {error && <p style={{ color: "red" }}>{error}</p>}
                                <button type="submit">{tlocations("updateLocation") || "Update Location"}</button>
                            </form>
                        )}
                    </div>
                ) : (
                    <p>{tlocations("signedIn")}</p>
                )}
            </div>
        </div>

    );
};

export default YourLocations;
