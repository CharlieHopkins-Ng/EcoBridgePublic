import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, push, onValue } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app, db } from "../firebaseConfig";

const SubmitLocation = () => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmails, setAdminEmails] = useState([]);
  const router = useRouter();
  const auth = getAuth(app);
  const db = getDatabase(app);

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setIsAdmin(adminEmails.includes(user.email));
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [auth, adminEmails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || !latitude || !longitude || !description) {
      setError("All fields are required");
      return;
    }
    try {
      if (isAdmin) {
        const locationsRef = ref(db, "locations");
        await push(locationsRef, {
          Name: name,
          Address: address,
          Latitude: parseFloat(latitude),
          Longitude: parseFloat(longitude),
          Description: description,
        });
      } else {
        const pendingLocationsRef = ref(db, "pendingLocations");
        await push(pendingLocationsRef, {
          Name: name,
          Address: address,
          Latitude: parseFloat(latitude),
          Longitude: parseFloat(longitude),
          Description: description,
        });
      }
      router.push("/");
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
        <title>{isAdmin ? "Add a New Location" : "Submit a New Location"} - EcoBridge</title>
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
        </div>
        <div className="nav-right">
          {!isAuthenticated && (
            <Link href="/signup" legacyBehavior>
              <button>Sign Up</button>
            </Link>
          )}
          {!isAuthenticated && (
            <Link href="/login" legacyBehavior>
              <button>Log In</button>
            </Link>
          )}
          {isAuthenticated && (
            <button onClick={handleSignOut}>Sign Out</button>
          )}
        </div>
      </nav>
      <div className="container" style={{ maxWidth: "900px", width: "100%" }}>
        <h1>{isAdmin ? "Add a New Location" : "Submit a New Location"}</h1>
        {isAuthenticated ? (
          <form onSubmit={handleSubmit} style={{ textAlign: "left", width: "100%" }}>
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
            <button type="submit">{isAdmin ? "Add Location" : "Submit Location"}</button>
          </form>
        ) : (
          <p>You need to be signed in to use this feature.</p>
        )}
      </div>
    </div>
  );
};

export default SubmitLocation;
