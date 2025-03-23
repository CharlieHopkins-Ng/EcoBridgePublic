import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, remove, set } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app } from "../firebaseConfig";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [adminEmails, setAdminEmails] = useState([]);
  const auth = getAuth(app);
  const db = getDatabase(app);
  const router = useRouter();

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

  useEffect(() => {
    if (isAdmin) {
      const pendingLocationsRef = ref(db, "pendingLocations");
      onValue(pendingLocationsRef, (snapshot) => {
        const data = snapshot.val();
        setPendingLocations(data ? Object.entries(data) : []);
      });
    }
  }, [isAdmin, db]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleApprove = async (locationId, locationData) => {
    const approvedLocationsRef = ref(db, "locations");
    await set(ref(db, `locations/${locationId}`), locationData);
    await remove(ref(db, `pendingLocations/${locationId}`));
  };

  const handleDeny = async (locationId) => {
    await remove(ref(db, `pendingLocations/${locationId}`));
  };

  return (
    <div>
      <Head>
        <title>Admin - EcoBridge</title>
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
        <h1>Admin Panel</h1>
        {isAdmin ? (
          <div>
            <h2>Pending Locations</h2>
            {pendingLocations.length > 0 ? (
              pendingLocations.map(([id, location]) => (
                <div key={id} className="location">
                  <h3>{location.Name}</h3>
                  <p><strong>Address:</strong> {location.Address}</p>
                  <p><strong>Latitude:</strong> {location.Latitude}</p>
                  <p><strong>Longitude:</strong> {location.Longitude}</p>
                  <p><strong>Description:</strong> {location.Description}</p>
                  <button onClick={() => handleApprove(id, location)}>Approve</button>
                  <button onClick={() => handleDeny(id)}>Deny</button>
                </div>
              ))
            ) : (
              <p>No pending locations.</p>
            )}
          </div>
        ) : (
          <p>You do not have permission to access this page.</p>
        )}
      </div>
    </div>
  );
};

export default Admin;
