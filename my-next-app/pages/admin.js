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
	const [allLocations, setAllLocations] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [adminUids, setAdminUids] = useState([]);
	const auth = getAuth(app);
	const db = getDatabase(app);
	const router = useRouter();

	useEffect(() => {
		const fetchAdminUids = async () => {
			const adminUidsRef = ref(db, "adminUids");
			onValue(adminUidsRef, (snapshot) => {
				const data = snapshot.val();
				setAdminUids(data ? Object.keys(data) : []);
			});
		};

		fetchAdminUids();
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setIsAuthenticated(true);
				setIsAdmin(adminUids.includes(user.uid));
			} else {
				setIsAuthenticated(false);
				setIsAdmin(false);
			}
		});
		return () => unsubscribe();
	}, [auth, adminUids]);

	useEffect(() => {
		if (isAdmin) {
			const pendingLocationsRef = ref(db, "pendingLocations");
			onValue(pendingLocationsRef, (snapshot) => {
				const data = snapshot.val();
				setPendingLocations(data ? Object.entries(data) : []);
			});

			const allLocationsRef = ref(db, "locations");
			onValue(allLocationsRef, (snapshot) => {
				const data = snapshot.val();
				setAllLocations(data ? Object.entries(data) : []);
			});
		}
	}, [isAdmin, db]);

	const handleSignOut = async () => {
		await signOut(auth);
		router.push("/login");
	};

	const handleApprove = async (locationId, locationData) => {
		await set(ref(db, `locations/${locationId}`), locationData);
		await remove(ref(db, `pendingLocations/${locationId}`));
	};

	const handleDeny = async (locationId) => {
		await remove(ref(db, `pendingLocations/${locationId}`));
	};

	const handleSearch = () => {
		const results = allLocations.filter(([id, location]) =>
			location.Name.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setSearchResults(results);
	};

	const handleDeleteLocation = async (locationId) => {
		try {
			await remove(ref(db, `locations/${locationId}`));
			alert("Location deleted successfully.");
			setSearchResults(searchResults.filter(([id]) => id !== locationId));
		} catch (error) {
			alert("Failed to delete location: " + error.message);
		}
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
									<p><strong>Submitted by:</strong> {location.Username} ({location.Email})</p>
									<button onClick={() => handleApprove(id, location)}>Approve</button>
									<button onClick={() => handleDeny(id)}>Deny</button>
								</div>
							))
						) : (
							<p>No pending locations.</p>
						)}

						<h2>Search and Delete Locations</h2>
						<input
							type="text"
							placeholder="Search by location name"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<button onClick={handleSearch}>Search</button>
						{searchResults.length > 0 ? (
							searchResults.map(([id, location]) => (
								<div key={id} className="location">
									<h3>{location.Name}</h3>
									<p><strong>Address:</strong> {location.Address}</p>
									<p><strong>Latitude:</strong> {location.Latitude}</p>
									<p><strong>Longitude:</strong> {location.Longitude}</p>
									<p><strong>Description:</strong> {location.Description}</p>
									<button onClick={() => handleDeleteLocation(id)}>Delete</button>
								</div>
							))
						) : (
							<p>No locations found.</p>
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
