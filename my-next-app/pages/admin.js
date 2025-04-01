import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, remove, set, get, update, runTransaction, push } from "firebase/database";
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
	const [editingUser, setEditingUser] = useState(null);
	const [editUsername, setEditUsername] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editBanned, setEditBanned] = useState(false);
	const [editBanReason, setEditBanReason] = useState("");
	const [editBanEndDate, setEditBanEndDate] = useState("");
	const [editLocationsSubmitted, setEditLocationsSubmitted] = useState(0);
	const [editLocationsApproved, setEditLocationsApproved] = useState(0);
	const [editLocationsDenied, setEditLocationsDenied] = useState(0);
	const [editLocationsEdited, setEditLocationsEdited] = useState(0);
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
						locationsEdited: user.locationsEdited || 0,
						banned: user.banned || false,
						banEndDate: user.banEndDate || null,
						banReason: user.banReason || null,
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

	const approveLocation = (id) => {
		// Approve location logic
	};

	const denyLocation = (id) => {
		// Deny location logic
	};

	const searchLocations = () => {
		const results = allLocations.filter(([id, location]) => {
			const matchesQuery = location.Name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesNoWebsite = showNoWebsiteOnly ? location.Website === "N/A" : true;
			return matchesQuery && matchesNoWebsite;
		});
		setSearchResults(showAllLocations ? allLocations : results);
	};

	const editLocation = (id, location) => {
		setEditingLocation(id);
		setEditName(location.Name);
		setEditAddress(location.Address);
		setEditLatitude(location.Latitude);
		setEditLongitude(location.Longitude);
		setEditDescription(location.Description);
		setEditWebsite(location.Website || "N/A");
	};

	const handleUpdate = async (e) => {
		e.preventDefault();
		if (!editName || !editAddress || !editLatitude || !editLongitude || !editDescription || !editWebsite) {
			setEditError("All fields are required");
			return;
		}
		try {
			const locationData = {
				Name: editName,
				Address: editAddress,
				Latitude: parseFloat(editLatitude),
				Longitude: parseFloat(editLongitude),
				Description: editDescription,
				Website: editWebsite || "N/A",
			};
			const locationRef = ref(db, `locations/${editingLocation}`);
			await update(locationRef, locationData);

			setEditingLocation(null);
			alert("Location updated successfully.");
		} catch (error) {
			setEditError(error.message);
		}
	};

	const banUser = async (userId, banDuration, banReason) => {
		try {
			const banEndDate = new Date();
			banEndDate.setDate(banEndDate.getDate() + banDuration);

			const userRef = ref(db, `users/${userId}`);
			await update(userRef, {
				banned: true,
				banEndDate: banEndDate.toISOString(),
				banReason: banReason || "No reason provided",
			});

			const banHistoryRef = ref(db, `users/${userId}/banHistory`);
			await push(banHistoryRef, {
				banStartDate: new Date().toISOString(),
				banEndDate: banEndDate.toISOString(),
				banReason: banReason || "No reason provided",
				adminId: auth.currentUser.uid,
			});

			alert("User has been banned.");
		} catch (error) {
			alert("Failed to ban user: " + error.message);
		}
	};

	const unbanUser = async (userId, unbanReason) => {
		try {
			const userRef = ref(db, `users/${userId}`);
			await update(userRef, { banned: false, banEndDate: null });

			// Log the unban in banHistory
			const banHistoryRef = ref(db, `users/${userId}/banHistory`);
			await push(banHistoryRef, {
				unbanDate: new Date().toISOString(),
				unbanReason: unbanReason || "No reason provided",
				adminId: auth.currentUser.uid,
			});

			alert("User has been unbanned.");
		} catch (error) {
			alert("Failed to unban user: " + error.message);
		}
	};

	const deleteUserAccount = async (userId) => {
		try {
			// Remove user data from the database
			const userRef = ref(db, `users/${userId}`);
			const userSnapshot = await get(userRef);

			if (userSnapshot.exists()) {
				const userData = userSnapshot.val();

				// Remove the username reference
				if (userData.username) {
					const usernameRef = ref(db, `usernames/${userData.username}`);
					await remove(usernameRef);
				}
			}

			await remove(userRef);

			alert("User account deleted successfully.");
			setAllUsers(allUsers.filter(user => user.id !== userId)); // Update the UI
		} catch (error) {
			alert("Failed to delete user account: " + error.message);
		}
	};

	const handleEditUser = (user) => {
		setEditingUser(user.id);
		setEditUsername(user.username);
		setEditEmail(user.email);
		setEditBanned(user.banned);
		setEditBanReason(user.banReason || "");
		setEditBanEndDate(user.banEndDate || "");
		setEditLocationsSubmitted(user.locationsSubmitted || 0);
		setEditLocationsApproved(user.locationsApproved || 0);
		setEditLocationsDenied(user.locationsDenied || 0);
		setEditLocationsEdited(user.locationsEdited || 0);
	};

	const handleUpdateUser = async (e) => {
		e.preventDefault();
		if (!editUsername || !editEmail) {
			alert("Username and email cannot be empty.");
			return;
		}

		try {
			// Update user data in the database
			const userRef = ref(db, `users/${editingUser}`);
			await update(userRef, {
				username: editUsername,
				email: editEmail,
				banned: editBanned,
				banReason: editBanned ? editBanReason : null,
				banEndDate: editBanned ? editBanEndDate : null,
				locationsSubmitted: editLocationsSubmitted,
				locationsApproved: editLocationsApproved,
				locationsDenied: editLocationsDenied,
				locationsEdited: editLocationsEdited,
			});

			// Update the username reference if it has changed
			const originalUser = allUsers.find((user) => user.id === editingUser);
			if (originalUser.username !== editUsername) {
				await remove(ref(db, `usernames/${originalUser.username}`));
				await set(ref(db, `usernames/${editUsername}`), editingUser);
			}

			alert("User data updated successfully.");
			setEditingUser(null);
		} catch (error) {
			alert("Failed to update user data: " + error.message);
		}
	};

	const handleBanUser = async (userId, banDuration, banReason) => {
		try {
			const banEndDate = new Date();
			banEndDate.setDate(banEndDate.getDate() + banDuration);

			const userRef = ref(db, `users/${userId}`);
			await update(userRef, {
				banned: true,
				banEndDate: banEndDate.toISOString(),
				banReason: banReason || "No reason provided",
			});

			const banHistoryRef = ref(db, `users/${userId}/banHistory`);
			await push(banHistoryRef, {
				banStartDate: new Date().toISOString(),
				banEndDate: banEndDate.toISOString(),
				banReason: banReason || "No reason provided",
				adminId: auth.currentUser.uid,
			});

			alert("User has been banned.");
		} catch (error) {
			alert("Failed to ban user: " + error.message);
		}
	};

	const handleUnbanUser = async (userId, unbanReason) => {
		try {
			const userRef = ref(db, `users/${userId}`);
			await update(userRef, { banned: false, banEndDate: null });

			const banHistoryRef = ref(db, `users/${userId}/banHistory`);
			await push(banHistoryRef, {
				unbanDate: new Date().toISOString(),
				unbanReason: unbanReason || "No reason provided",
				adminId: auth.currentUser.uid,
			});

			alert("User has been unbanned.");
		} catch (error) {
			alert("Failed to unban user: " + error.message);
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

						{/* Manage Users Section */}
						{activeSection === "users" && (
							<div>
								<h2>Manage Users</h2>
								<label>
									Show Unverified Users Only
									<input
										type="checkbox"
										checked={showUnverifiedOnly}
										onChange={(e) => setShowUnverifiedOnly(e.target.checked)}
										style={{ marginLeft: "10px" }}
									/>
								</label>
								<label>
									Sort by Most Submitted
									<input
										type="checkbox"
										checked={sortByMostSubmitted}
										onChange={(e) => setSortByMostSubmitted(e.target.checked)}
										style={{ marginLeft: "10px" }}
									/>
								</label>
								<div>
									{sortedUsers.map((user) => (
										<div key={user.id} className="user-container" style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
											<h3>{user.username}</h3>
											<p><strong>Email:</strong> {user.email}</p>
											<p><strong>Email Verified:</strong> {user.emailVerified ? "Yes" : "No"}</p>
											<p><strong>Created At:</strong> {user.createdAt}</p>
											<p><strong>Locations Submitted:</strong> {user.locationsSubmitted}</p>
											<p><strong>Locations Approved:</strong> {user.locationsApproved}</p>
											<p><strong>Locations Denied:</strong> {user.locationsDenied}</p>
											<p><strong>Banned:</strong> {user.banned ? "Yes" : "No"}</p>
											{user.banned && <p><strong>Ban End Date:</strong> {user.banEndDate || "N/A"}</p>}
											<div>
												{user.banned ? (
													<div>
														<label>
															Unban Reason:
															<input type="text" id={`unbanReason-${user.id}`} placeholder="Enter reason" />
														</label>
														<button onClick={() => {
															const unbanReason = document.getElementById(`unbanReason-${user.id}`).value;
															handleUnbanUser(user.id, unbanReason);
														}}>Unban</button>
													</div>
												) : (
													<div>
														<label>
															Ban Duration (days):
															<input type="number" min="1" max="365" defaultValue="7" id={`banDuration-${user.id}`} />
														</label>
														<label>
															Ban Reason:
															<input type="text" id={`banReason-${user.id}`} placeholder="Enter reason" />
														</label>
														<button onClick={() => {
															const banDuration = parseInt(document.getElementById(`banDuration-${user.id}`).value, 10);
															const banReason = document.getElementById(`banReason-${user.id}`).value;
															handleBanUser(user.id, banDuration, banReason);
														}}>Ban</button>
													</div>
												)}
												<button onClick={() => deleteUserAccount(user.id)} style={{ marginTop: "10px", backgroundColor: "red", color: "white" }}>
													Delete Account
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Pending Locations Section */}
						{activeSection === "pendingLocations" && (
							<div>
								<h2>Pending Locations</h2>
								<div>
									{pendingLocations.map(([id, location]) => (
										<div key={id} className="location-container" style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
											<h3>{location.Name}</h3>
											<p><strong>Address:</strong> {location.Address}</p>
											<p><strong>Latitude:</strong> {location.Latitude}</p>
											<p><strong>Longitude:</strong> {location.Longitude}</p>
											<p><strong>Description:</strong> {location.Description}</p>
											<button onClick={() => approveLocation(id)}>Approve</button>
											<button onClick={() => denyLocation(id)}>Deny</button>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Search and Edit Locations Section */}
						{activeSection === "locations" && (
							<div>
								<h2>Search and Edit Locations</h2>
								<input
									type="text"
									placeholder="Search locations"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
								<label>
									Show locations with no website only
									<input
										type="checkbox"
										checked={showNoWebsiteOnly}
										onChange={(e) => setShowNoWebsiteOnly(e.target.checked)}
										style={{ marginLeft: "10px" }}
									/>
								</label>
								<label>
									Show all locations
									<input
										type="checkbox"
										checked={showAllLocations}
										onChange={(e) => setShowAllLocations(e.target.checked)}
										style={{ marginLeft: "10px" }}
									/>
								</label>
								<button onClick={searchLocations}>Search</button>
								<div>
									{searchResults.map(([id, location]) => (
										<div key={id} className="location-container" style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
											{editingLocation === id ? (
												<form onSubmit={handleUpdate} style={{ textAlign: "left", width: "100%" }}>
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
											) : (
												<>
													<h3>{location.Name}</h3>
													<p><strong>Address:</strong> {location.Address}</p>
													<p><strong>Latitude:</strong> {location.Latitude}</p>
													<p><strong>Longitude:</strong> {location.Longitude}</p>
													<p><strong>Description:</strong> {location.Description}</p>
													<p><strong>Website:</strong> {location.Website !== "N/A" ? <a href={location.Website} target="_blank" rel="noopener noreferrer">{location.Website}</a> : "N/A"}</p>
													<button onClick={() => editLocation(id, location)}>Edit</button>
												</>
											)}
										</div>
									))}
								</div>
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