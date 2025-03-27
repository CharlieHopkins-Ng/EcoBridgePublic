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
	const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false); // New state for filtering unverified users
	const [editingLocation, setEditingLocation] = useState(null);
	const [editName, setEditName] = useState("");
	const [editAddress, setEditAddress] = useState("");
	const [editLatitude, setEditLatitude] = useState("");
	const [editLongitude, setEditLongitude] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editWebsite, setEditWebsite] = useState(""); // New state for editing website
	const [editError, setEditError] = useState("");
	const [activeSection, setActiveSection] = useState(null); // State to track the active section
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

			// Fetch all users
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
					}));
					setAllUsers(users);
				} else {
					setAllUsers([]); // Clear the list if no users are found
				}
			}, (error) => {
				console.error("Error fetching users:", error); // Debugging check for errors
			});
		}
	}, [isAdmin, db]);

	const filteredUsers = showUnverifiedOnly
		? allUsers.filter(user => !user.emailVerified)
		: allUsers;

	const handleSignOut = async () => {
		await signOut(auth);
		router.push("/login");
	};

	const handleApprove = async (locationId, locationData) => {
		try {
			// Increment locationsApproved for the user atomically
			const userRef = ref(db, `users/${locationData.Uid}/locationsApproved`);
			await runTransaction(userRef, (currentApproved) => {
				return (currentApproved || 0) + 1; // Increment atomically
			});

			// Update the database with the approved location and remove it from pending locations
			const updates = {};
			updates[`locations/${locationId}`] = locationData;
			updates[`pendingLocations/${locationId}`] = null;
			await update(ref(db), updates); // Apply location updates
		} catch (error) {
			alert("Failed to approve location: " + error.message);
		}
	};

	const handleDeny = async (locationId) => {
		try {
			// Fetch the location data from pending locations
			const locationRef = ref(db, `pendingLocations/${locationId}`);
			const snapshot = await get(locationRef);
			const locationData = snapshot.val();

			if (locationData) {
				// Increment locationsDenied for the user atomically
				const userRef = ref(db, `users/${locationData.Uid}/locationsDenied`);
				await runTransaction(userRef, (currentDenied) => {
					return (currentDenied || 0) + 1; // Increment atomically
				});

				// Remove the location from pending locations
				const updates = {};
				updates[`pendingLocations/${locationId}`] = null;
				await update(ref(db), updates); // Apply updates
			}
		} catch (error) {
			alert("Failed to deny location: " + error.message);
		}
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

	const handleDeleteUser = async (userId) => {
		try {
			await remove(ref(db, `users/${userId}`));
			await remove(ref(db, `usernames/${allUsers.find(user => user.id === userId)?.username}`));
			setAllUsers(allUsers.filter(user => user.id !== userId));
			alert("User deleted successfully.");
		} catch (error) {
			alert("Failed to delete user: " + error.message);
		}
	};

	const handleEdit = (locationId, locationData) => {
		setEditingLocation(locationId);
		setEditName(locationData.Name);
		setEditAddress(locationData.Address);
		setEditLatitude(locationData.Latitude);
		setEditLongitude(locationData.Longitude);
		setEditDescription(locationData.Description);
		setEditWebsite(locationData.Website || ""); // Set website for editing
	};

	const handleUpdateLocation = async (e) => {
		e.preventDefault();
		if (!editName || !editAddress || !editLatitude || !editLongitude || !editDescription) {
			setEditError("All fields are required");
			return;
		}
		try {
			const updatedLocation = {
				Name: editName,
				Address: editAddress,
				Latitude: parseFloat(editLatitude),
				Longitude: parseFloat(editLongitude),
				Description: editDescription,
				Website: editWebsite || "N/A", // Include website in the updated location
			};
			await set(ref(db, `locations/${editingLocation}`), updatedLocation);

			// Increment locationsEdited for the user
			const locationRef = ref(db, `locations/${editingLocation}`);
			const snapshot = await get(locationRef); // Use get instead of onValue
			const locationData = snapshot.val();
			if (locationData) {
				const userRef = ref(db, `users/${locationData.Uid}/locationsEdited`);
				const userSnapshot = await get(userRef); // Use get instead of onValue
				const currentValue = userSnapshot.val() || 0;
				await set(userRef, currentValue + 1); // Update the value
			}

			alert("Location updated successfully.");
			setEditingLocation(null);
			setSearchResults(searchResults.map(([id, loc]) => id === editingLocation ? [id, updatedLocation] : [id, loc]));
		} catch (error) {
			setEditError(error.message);
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
			<div className="container" style={{ marginTop: "80px" }}>
				<h1>Admin Panel</h1>
				{isAdmin ? (
					<div>
						<div style={{ display: "flex", justifyContent: "left", gap: "10px", marginBottom: "20px", marginTop: "20px" }}>
							<button onClick={() => setActiveSection("users")}>Manage Users</button>
							<button onClick={() => setActiveSection("pendingLocations")}>Pending Locations</button>
							<button onClick={() => setActiveSection("locations")}>Search and Edit Locations</button>
						</div>

						{activeSection === "users" && (
							<div>
								<h2>All Users</h2>
								<div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
									<input
										type="checkbox"
										checked={showUnverifiedOnly}
										onChange={(e) => setShowUnverifiedOnly(e.target.checked)}
										style={{ marginRight: "5px" }}
									/>
									<label>Show only unverified users</label>
								</div>
								{filteredUsers.length > 0 ? (
									filteredUsers.map((user) => (
										<div key={user.id} className="location">
											<h3>{user.username}</h3>
											<p><strong>Email:</strong> {user.email}</p>
											<p><strong>Account Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
											<p><strong>Email Verified:</strong> {user.emailVerified ? "Yes" : "No"}</p>
											<button onClick={() => handleDeleteUser(user.id)}>Delete User</button>
										</div>
									))
								) : (
									<p>No users found.</p>
								)}
							</div>
						)}

						{activeSection === "pendingLocations" && (
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
							</div>
						)}

						{activeSection === "locations" && (
							<div>
								<h2>Search and Edit Locations</h2>
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
											<p><strong>Website:</strong> {location.Website !== "N/A" ? <a href={location.Website} target="_blank" rel="noopener noreferrer">{location.Website}</a> : "N/A"}</p>
											<button onClick={() => handleEdit(id, location)}>Edit</button>
											<button onClick={() => handleDeleteLocation(id)}>Delete</button>
										</div>
									))
								) : (
									<p>No locations found.</p>
								)}
								{editingLocation && (
									<form onSubmit={handleUpdateLocation} style={{ textAlign: "left", width: "100%" }}>
										<h3>Edit Location</h3>
										<input
											type="text"
											placeholder="Name"
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											required
										/>
										<input
											type="text"
											placeholder="Address"
											value={editAddress}
											onChange={(e) => setEditAddress(e.target.value)}
											required
										/>
										<input
											type="text"
											placeholder="Latitude"
											value={editLatitude}
											onChange={(e) => setEditLatitude(e.target.value)}
											required
										/>
										<input
											type="text"
											placeholder="Longitude"
											value={editLongitude}
											onChange={(e) => setEditLongitude(e.target.value)}
											required
										/>
										<textarea
											placeholder="Description"
											value={editDescription}
											onChange={(e) => setEditDescription(e.target.value)}
											required
										/>
										<input
											type="text"
											placeholder="Website (optional)"
											value={editWebsite}
											onChange={(e) => setEditWebsite(e.target.value)}
										/>
										{editError && <p style={{ color: "red" }}>{editError}</p>}
										<button type="submit">Update Location</button>
										<button type="button" onClick={() => setEditingLocation(null)}>Cancel</button>
									</form>
								)}
							</div>
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
