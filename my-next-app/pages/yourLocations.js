import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app, db } from "../firebaseConfig";

const YourLocations = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userLocations, setUserLocations] = useState([]);
    const [editingLocation, setEditingLocation] = useState(null);
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [uid, setUid] = useState("");
    const auth = getAuth(app);
    const router = useRouter();

    useEffect(() => {
        const fetchAdminUids = async () => {
            const adminUidsRef = ref(db, "adminUids");
            onValue(adminUidsRef, (snapshot) => {
                const data = snapshot.val();
                setIsAdmin(data ? Object.keys(data).includes(auth.currentUser?.uid) : false);
            });
        };

        fetchAdminUids();
    }, [auth]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setUid(user.uid);
                fetchUserLocations(user.uid);
            } else {
                setIsAuthenticated(false);
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
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!name || !address || !latitude || !longitude || !description) {
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
            };
            const locationRef = ref(db, `locations/${editingLocation}`);
            await update(locationRef, locationData);
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
            <div className="container">
                <h1>Your Locations</h1>
                {isAuthenticated ? (
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
