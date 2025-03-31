import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, push, onValue, runTransaction, update, get } from "firebase/database"; // Add runTransaction, update, and get
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
	const [website, setWebsite] = useState(""); // New state for website
	const [error, setError] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [adminEmails, setAdminEmails] = useState([]); // Add missing state
	const [adminUids, setAdminUids] = useState([]); // Add missing state
	const [uid, setUid] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
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
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const userRef = ref(db, `users/${user.uid}`);
				const snapshot = await get(userRef);

				if (snapshot.exists()) {
					const userData = snapshot.val();

					if (userData.banned) {
						const banReason = userData.banReason || "No reason provided";
						const banEndDate = userData.banEndDate || "Indefinite";
						alert(`You are banned. Reason: ${banReason}. Ban expires on: ${banEndDate}`);
						router.push("/");
						return;
					}

					if (!user.emailVerified) {
						alert("Please verify your email to submit a location.");
						router.push("/verifyEmail");
						return;
					}

					setIsAuthenticated(true);
					setUid(user.uid);
					setIsAdmin(adminEmails.includes(user.email) || adminUids.includes(user.uid));
					setUsername(user.displayName || "Anonymous");
					setEmail(user.email);
				}
			} else {
				setIsAuthenticated(false);
				setIsAdmin(false);
			}
		});
		return () => unsubscribe();
	}, [auth, adminEmails, adminUids, router]);

	useEffect(() => {
		const fetchAdminUids = async () => {
			const adminUidsRef = ref(db, "adminUids");
			onValue(adminUidsRef, (snapshot) => {
				const data = snapshot.val();
				setAdminUids(data ? Object.keys(data) : []);
			});
		};

		fetchAdminUids();
	}, [auth]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!name || !address || !latitude || !longitude || !description || !website) {
			setError("All fields are required");
			return;
		}
		try {
			const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

			// Check if locationsSubmittedToday exceeds 50
			const locationsSubmittedTodayRef = ref(db, `users/${uid}/locationsSubmittedToday/${today}`);
			const snapshot = await get(locationsSubmittedTodayRef);
			const locationsSubmittedToday = snapshot.exists() ? snapshot.val() : 0;

			if (locationsSubmittedToday >= 50) {
				setError("You have reached the daily limit of 50 location submissions.");
				return;
			}

			const locationData = {
				Name: name,
				Address: address,
				Latitude: parseFloat(latitude),
				Longitude: parseFloat(longitude),
				Description: description,
				Website: website || "N/A", // Add website field
				Username: username,
				Email: email,
				Uid: uid // Add the user's UID to the location data
			};
			if (isAdmin) {
				const locationsRef = ref(db, "locations");
				await push(locationsRef, locationData);
			} else {
				const pendingLocationsRef = ref(db, "pendingLocations");
				await push(pendingLocationsRef, locationData);
			}

			// Increment locationsSubmitted
			await runTransaction(ref(db, `users/${uid}/locationsSubmitted`), (currentValue) => {
				return (currentValue || 0) + 1;
			});

			// Increment locationsSubmittedToday
			await runTransaction(locationsSubmittedTodayRef, (currentValue) => {
				return (currentValue || 0) + 1;
			});

			// Clean up old entries in locationsSubmittedToday
			const locationsSubmittedTodayParentRef = ref(db, `users/${uid}/locationsSubmittedToday`);
			const parentSnapshot = await get(locationsSubmittedTodayParentRef);
			if (parentSnapshot.exists()) {
				const data = parentSnapshot.val();
				const updatedData = Object.keys(data)
					.filter((date) => date === today) // Keep only today's entry
					.reduce((acc, date) => {
						acc[date] = data[date];
						return acc;
					}, {});
				await update(locationsSubmittedTodayParentRef, updatedData);
			}

			await router.push("/"); // Ensure navigation is awaited
		} catch (error) {
			console.error("Error during location submission:", error);
			setError(error.message);
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut(auth);
			await router.push("/login"); // Ensure navigation is awaited
		} catch (error) {
			console.error("Error during sign-out navigation:", error);
		}
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
						<p style={{ fontSize: "12px", margin: "0px" }}>
							Use <a href="https://www.latlong.net/convert-address-to-lat-long.html" target = "_blank">this website</a> if you want to convert an address into latitude and longitude
						</p>
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
						<input
							type="text"
							placeholder="Website (optional)"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
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
