import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, remove, set, get, update, runTransaction } from "firebase/database";
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
	const [allUsers, setAllUsers] = useState([]);
	const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);
	const [sortByMostSubmitted, setSortByMostSubmitted] = useState(false);
	const [editingLocation, setEditingLocation] = useState(null);
	const [editName, setEditName] = useState("");
	const [editAddress, setEditAddress] = useState("");
	const [editLatitude, setEditLatitude] = useState("");
	const [editLongitude, setEditLongitude] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editWebsite, setEditWebsite] = useState("");
	const [editError, setEditError] = useState("");
	const [activeSection, setActiveSection] = useState(null);
	const [showNoWebsiteOnly, setShowNoWebsiteOnly] = useState(false);
	const [showAllLocations, setShowAllLocations] = useState(false);
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

			const usersRef = ref(db, "users");
			onValue(usersRef, (snapshot) => {
				if (snapshot.exists()) {
					const data = snapshot.val();
					const users = Object.entries(data).map(([id, user]) => ({
						id,
						username: user.username || "N/A",
						email: user.email || "N/A",
						createdAt: user.createdAt || "N/A",
						emailVerified: user.emailVerified || false,
						locationsSubmitted: user.locationsSubmitted || 0,
						locationsApproved: user.locationsApproved || 0,
						locationsDenied: user.locationsDenied || 0,
					}));
					setAllUsers(users);
				} else {
					setAllUsers([]);
				}
			});
		}
	}, [isAdmin, db]);

	const filteredUsers = showUnverifiedOnly
		? allUsers.filter(user => !user.emailVerified)
		: allUsers;

	const sortedUsers = sortByMostSubmitted
		? [...filteredUsers].sort((a, b) => b.locationsSubmitted - a.locationsSubmitted)
		: filteredUsers;

	const handleSignOut = async () => {
		await signOut(auth);
		router.push("/login");
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
			<div className="container" style={{ marginTop: "80px" }}>
				<h1>Admin Panel</h1>
				{isAdmin ? (
					<div>
						<div style={{ display: "flex", justifyContent: "left", gap: "10px", marginBottom: "20px", marginTop: "20px" }}>
							<button onClick={() => setActiveSection("users")}>Manage Users</button>
							<button onClick={() => setActiveSection("pendingLocations")}>Pending Locations</button>
							<button onClick={() => setActiveSection("locations")}>Search and Edit Locations</button>
						</div>
					</div>
				) : (
					<p>You do not have permission to access this page.</p>
				)}
			</div>
		</div>
	);
};

export default Admin;