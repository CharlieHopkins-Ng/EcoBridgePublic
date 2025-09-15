import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, push, runTransaction, update, get } from "firebase/database"; // Add runTransaction, update, and get
import { useRouter } from "next/router";
import Navbar from '../components/navBar';
import { useAuthRoles } from "../context/authRolesContext";
import Head from "next/head";
import { app} from "../firebaseConfig";
import { useTranslation } from "../hooks/useTranslation";

const SubmitLocation = ({currentLanguage, onLanguageChange}) => {
	const [name, setName] = useState("");
	const [address, setAddress] = useState("");
	const [latitude, setLatitude] = useState("");
	const [longitude, setLongitude] = useState("");
	const [description, setDescription] = useState("");
	const [website, setWebsite] = useState(""); // New state for website
	const [howToHelp, setHowToHelp] = useState(""); // New state for "How to Help"
	const [error, setError] = useState("");
	const [uid, setUid] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [bannedMessage, setBannedMessage] = useState("");
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();
	const router = useRouter();
	const auth = getAuth(app);
	const db = getDatabase(app);

	const { t: tsubmitLocation } = useTranslation(currentLanguage, "submitLocation");

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
						setBannedMessage(`You are banned. Reason: ${banReason}. Ban expires on: ${banEndDate}`);
						return;
					}

					if (!user.emailVerified) {
						alert("Please verify your email to submit a location.");
						router.push("/verifyEmail");
						return;
					}

					setUid(user.uid);
					setUsername(user.displayName || "Anonymous");
					setEmail(user.email);
				}
			}
		});
		return () => unsubscribe();
	}, [auth, router]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!name || !address || !latitude || !longitude || !description || !website || !howToHelp) {
			setError(tsubmitLocation("allFieldsRequired"));
			return;
		}
		try {
			const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

			// Check if locationsSubmittedToday exceeds 50
			const locationsSubmittedTodayRef = ref(db, `users/${uid}/locationsSubmittedToday/${today}`);
			const snapshot = await get(locationsSubmittedTodayRef);
			const locationsSubmittedToday = snapshot.exists() ? snapshot.val() : 0;

			if (locationsSubmittedToday >= 50) {
				setError(tsubmitLocation("maxLocationsReached"));
				return;
			}

			// Fetch the username from the database
			const userRef = ref(db, `users/${uid}`);
			const userSnapshot = await get(userRef);
			const userData = userSnapshot.exists() ? userSnapshot.val() : {};
			const senderUsername = userData.username || "Anonymous";

			const locationData = {
				Name: name,
				Address: address,
				Latitude: parseFloat(latitude),
				Longitude: parseFloat(longitude),
				Description: description,
				Website: website || "N/A", 
				HowToHelp: howToHelp,
				Username: senderUsername, 
				Email: email,
				Uid: uid 
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
			if (error.message.includes("permission_denied")) {
				console.error("Permission denied:", error.message);
				setError("Permission denied. Please check your Firebase rules.");
			} else {
				console.error("Error during location submission:", error);
				setError(error.message);
			}
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
			<Navbar 
                isAuthenticated={isAuthenticated} 
                isAdmin={isAdmin} 
                handleSignOut={handleSignOut} 
                isTranslator={isTranslator} 
                currentLanguage={currentLanguage} 
                onLanguageChange={onLanguageChange}
            />
			<div className="container" style={{ maxWidth: "900px", width: "100%" }}>
				<h1>{isAdmin ? tsubmitLocation("addLocation") : tsubmitLocation("submitLocation")}</h1>
					{bannedMessage ? (
						<p style={{ color: "red" }}>{bannedMessage}</p>
					) : isAuthenticated ? (
					<form onSubmit={handleSubmit} style={{ textAlign: "left", width: "100%" }}>
						<input
							type="text"
							placeholder={tsubmitLocation("name")}
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
						<input
							type="text"
							placeholder={tsubmitLocation("address")}
							value={address}
							onChange={(e) => setAddress(e.target.value)}
							required
						/>
						<p style={{ fontSize: "12px", margin: "0px" }}>
							Use <a href="https://www.latlong.net/convert-address-to-lat-long.html" target = "_blank">this website</a> if you want to convert an address into latitude and longitude
						</p>
						<input
							type="text"
							placeholder={tsubmitLocation("latitude")}
							value={latitude}
							onChange={(e) => setLatitude(e.target.value)}
							required
						/>
						<input
							type="text"
							placeholder={tsubmitLocation("longitude")}
							value={longitude}
							onChange={(e) => setLongitude(e.target.value)}
							required
						/>
						<input
							type="text"
							placeholder={tsubmitLocation("website")}
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
						/>
						<textarea
							placeholder={tsubmitLocation("description")}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							required
						/>
						<textarea
							placeholder={tsubmitLocation("howToHelp")}
							value={howToHelp}
							onChange={(e) => setHowToHelp(e.target.value)}
							required
						/>
						{error && <p style={{ color: "red" }}>{error}</p>}
						<button type="submit">{isAdmin ? tsubmitLocation("addLocation") : tsubmitLocation("submitLocation")}</button>
					</form>
				) : (
					<p>You need to be signed in to use this feature.</p>
				)}
			</div>
		</div>
	);
};

export default SubmitLocation;
