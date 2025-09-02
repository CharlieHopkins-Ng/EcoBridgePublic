import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, remove, set, get, update, runTransaction, push } from "firebase/database";
import { useRouter } from "next/router";
import Head from "next/head";
import { app } from "../firebaseConfig";
import Navbar from '../components/navBar';

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
	const [editHowToHelp, setEditHowToHelp] = useState(""); // Add state for How to Help field
	const [editError, setEditError] = useState("");
	const [activeSection, setActiveSection] = useState(null);
	const [showNoWebsiteOnly, setShowNoWebsiteOnly] = useState(false);
	const [showNoHowToHelpOnly, setShowNoHowToHelpOnly] = useState(false); // New state for filtering locations without "How to Help"
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
	const [userSearchQuery, setUserSearchQuery] = useState(""); // Add state for user search query
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

	// Filter users based on the search query
	const filteredUsersBySearch = sortedUsers.filter(
		(user) =>
			user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
	);

	const handleSignOut = async () => {
		await signOut(auth);
		router.push("/login");
	};

	const approveLocation = async (id) => {
		try {
			// Get the pending location data
			const pendingLocationRef = ref(db, `pendingLocations/${id}`);
			const snapshot = await get(pendingLocationRef);

			if (snapshot.exists()) {
				const locationData = snapshot.val();

				// Add the location to the approved locations
				const locationsRef = ref(db, "locations");
				await push(locationsRef, locationData);

				 // Increment locationsApproved for the user
				if (locationData.Uid) {
					const userRef = ref(db, `users/${locationData.Uid}/locationsApproved`);
					await runTransaction(userRef, (currentValue) => (currentValue || 0) + 1);
				}

				// Remove the location from pending locations
				await remove(pendingLocationRef);

				alert("Location approved successfully.");
			} else {
				alert("Location not found in pending locations.");
			}
		} catch (error) {
			alert("Failed to approve location: " + error.message);
		}
	};

	const denyLocation = async (id) => {
		try {
			// Get the pending location data
			const pendingLocationRef = ref(db, `pendingLocations/${id}`);
			const snapshot = await get(pendingLocationRef);

			if (snapshot.exists()) {
				const locationData = snapshot.val();

				 // Prompt for a reason
				const reason = prompt("Please provide a reason for denying this location:");
				if (!reason) {
					alert("A reason is required to deny the location.");
					return;
				}

				// Increment locationsDenied for the user
				if (locationData.Uid) {
					const userRef = ref(db, `users/${locationData.Uid}/locationsDenied`);
					await runTransaction(userRef, (currentValue) => (currentValue || 0) + 1);

					// Add the reason to the user's inbox
					const inboxRef = ref(db, `users/${locationData.Uid}/inbox`);
					await push(inboxRef, {
						message: `Your location "${locationData.Name}" was denied.`,
						reason: reason,
						timestamp: new Date().toISOString(),
					});
				}

				// Remove the location from pending locations
				await remove(pendingLocationRef);

				alert("Location denied successfully.");
			} else {
				alert("Location not found in pending locations.");
			}
		} catch (error) {
			alert("Failed to deny location: " + error.message);
		}
	};

	const searchLocations = () => {
		const results = allLocations.filter(([id, location]) => {
			const matchesQuery = location.Name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesNoWebsite = showNoWebsiteOnly ? location.Website === "N/A" : true;
			const matchesNoHowToHelp = showNoHowToHelpOnly ? !location.HowToHelp : true; // Filter locations without "How to Help"
			return matchesQuery && matchesNoWebsite && matchesNoHowToHelp;
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
		setEditHowToHelp(location.HowToHelp || ""); // Set How to Help field
	};

	const deleteLocation = async (id) => {
		try {
			// Remove the location from the database
			const locationRef = ref(db, `locations/${id}`);
			await remove(locationRef);

			// Update the search results and all locations
			setSearchResults(searchResults.filter(([locationId]) => locationId !== id));
			setAllLocations(allLocations.filter(([locationId]) => locationId !== id));

			alert("Location deleted successfully.");
		} catch (error) {
			alert("Failed to delete location: " + error.message);
		}
	};

	const handleUpdate = async (e) => {
		e.preventDefault();
		if (!editName || !editAddress || !editLatitude || !editLongitude || !editDescription || !editWebsite || !editHowToHelp) {
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
				HowToHelp: editHowToHelp, // Include How to Help field
			};
			const locationRef = ref(db, `locations/${editingLocation}`);
			await update(locationRef, locationData);

			setEditingLocation(null);
			alert("Location updated successfully.");
		} catch (error) {
			setEditError(error.message);
		}
	};

	const handleBanUser = async (userId, banDuration, banReason) => {
		console.log(`handleBanUser called with userId: ${userId}, banDuration: ${banDuration}, banReason: ${banReason}`);
		try {
			const banEndDate = new Date();
			banEndDate.setDate(banEndDate.getDate() + banDuration);

			// Update the user's banned status in the database
			const userRef = ref(db, `users/${userId}`);
			await update(userRef, {
				banned: true,
				banEndDate: banEndDate.toISOString(),
				banReason: banReason || "No reason provided",
			});

			// Log the ban in the user's inbox
			const inboxRef = ref(db, `users/${userId}/inbox`);
			await push(inboxRef, {
				message: "You have been banned.",
				reason: banReason || "No reason provided",
				banEndDate: banEndDate.toISOString(),
				timestamp: new Date().toISOString(),
			});

			// Log the ban in banHistory
			const banHistoryRef = ref(db, `users/${userId}/banHistory`);
			await push(banHistoryRef, {
				banStartDate: new Date().toISOString(),
				banEndDate: banEndDate.toISOString(),
				banReason: banReason || "No reason provided",
				adminId: auth.currentUser.uid,
			});

			alert("User has been banned successfully.");
		} catch (error) {
			console.error("Failed to ban user:", error.message);
			alert("Failed to ban user: " + error.message);
		}
	};

	const handleUnbanUser = async (userId, unbanReason) => {
		console.log(`handleUnbanUser called with userId: ${userId}, unbanReason: ${unbanReason}`);
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

			// Notify the user about the unban
			const inboxRef = ref(db, `users/${userId}/inbox`);
			await push(inboxRef, {
				message: "You have been unbanned.",
				reason: unbanReason || "No reason provided",
				timestamp: new Date().toISOString(),
			});

			alert("User has been unbanned and notified.");
		} catch (error) {
			console.error("Failed to unban user:", error.message);
			alert("Failed to unban user: " + error.message);
		}
	};

	const sendMessageToUser = async (userId, messageContent) => {
		try {
			const inboxRef = ref(db, `users/${userId}/inbox`);
			await push(inboxRef, {
				message: messageContent,
				timestamp: new Date().toISOString(),
			});
			alert("Message sent to the user.");
		} catch (error) {
			alert("Failed to send message: " + error.message);
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

	return (
		<div>
			<Head>
				<title>Admin - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} />
			<div className="container" style={{ marginTop: "80px" }}>
				<h1>Admin Panel</h1>
				{isAdmin ? (
					<div>
						<div style={{ display: "flex", justifyContent: "left", gap: "10px", marginBottom: "20px", marginTop: "20px" }}>
							<button onClick={() => setActiveSection("users")}>Manage Users</button>
							<button onClick={() => setActiveSection("pendingLocations")}>Pending Locations</button>
							<button onClick={() => setActiveSection("locations")}>Search and Edit Locations</button>
							<button onClick={() => setActiveSection("sendMessages")}>Send Messages</button>
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
								<input
									type="text"
									placeholder="Search users by username or email"
									value={userSearchQuery}
									onChange={(e) => setUserSearchQuery(e.target.value)}
									style={{ margin: "10px 0", width: "100%", padding: "5px" }}
								/>
								<div>
									{filteredUsersBySearch.map((user) => (
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
											<p><strong>Website:</strong> {location.Website !== "N/A" ? <a href={location.Website} target="_blank" rel="noopener noreferrer">{location.Website}</a> : "N/A"}</p>
											<p><strong>How to Help:</strong> {location.HowToHelp || "N/A"}</p>
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
									Show locations with no "How to Help" only
									<input
										type="checkbox"
										checked={showNoHowToHelpOnly}
										onChange={(e) => setShowNoHowToHelpOnly(e.target.checked)}
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
													<textarea
														placeholder="How to Help"
														value={editHowToHelp}
														onChange={(e) => setEditHowToHelp(e.target.value)}
														required
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
													{location.HowToHelp && <p><strong>How to Help:</strong> {location.HowToHelp}</p>}
													<button onClick={() => editLocation(id, location)}>Edit</button>
													<button onClick={() => deleteLocation(id)} style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}>Delete</button>
												</>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{/* Send Messages Section */}
						{activeSection === "sendMessages" && (
							<div>
								<h2>Send Messages to Users</h2>
								<input
									type="text"
									placeholder="Search users by username or email"
									value={userSearchQuery}
									onChange={(e) => setUserSearchQuery(e.target.value)}
									style={{ margin: "10px 0", width: "100%", padding: "5px" }}
								/>
								{filteredUsersBySearch.map((user) => (
									<div key={user.id} className="user-container" style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
										<h3>{user.username}</h3>
										<p><strong>Email:</strong> {user.email}</p>
										<p><strong>User ID:</strong> {user.id}</p>
										<textarea
											id={`message-${user.id}`}
											placeholder="Write your message here..."
											style={{ width: "100%", height: "100px", marginBottom: "10px" }}
										></textarea>
										<button onClick={() => {
											const messageContent = document.getElementById(`message-${user.id}`).value;
											sendMessageToUser(user.id, messageContent);
										}}>
											Send Message
										</button>
									</div>
								))}
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