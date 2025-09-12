import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut, updatePassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, onValue, update, remove, set } from "firebase/database";
import { useRouter } from "next/router";
import Navbar from '../components/navBar';
import Head from "next/head";
import { app, db } from "../firebaseConfig";
import { useAuthRoles } from "../context/authRolesContext";

const YourProfile = () => {
	const [username, setUsername] = useState("");
	const [newUsername, setNewUsername] = useState("");
	const [email, setEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();
	const auth = getAuth(app);
	const router = useRouter();


	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setEmail(user.email);
				fetchUsername(user.uid);
			} else {
				setUsername("");
				setNewUsername("");
				setEmail("");
				setError("You must be logged in to access this page.");
			}
		});
		return () => unsubscribe();
	}, [auth, router]);

	const fetchUsername = (uid) => {
		const userRef = ref(db, `users/${uid}`);
		onValue(userRef, (snapshot) => {
			const data = snapshot.val();
			setUsername(data.username);
			setNewUsername(data.username);
		});
	};

	const handleUpdateUsername = async (e) => {
		e.preventDefault();
		if (!newUsername) {
			setError("Username cannot be empty");
			return;
		}
		try {
			// Check if the new username already exists
			const usernameRef = ref(db, `usernames/${newUsername}`);
			const snapshot = await new Promise((resolve) => {
				onValue(usernameRef, (snap) => resolve(snap.exists()), { onlyOnce: true });
			});
			if (snapshot) {
				setError("Username already exists. Please choose a different one.");
				return;
			}

			// Update the username in the users node
			const userRef = ref(db, `users/${auth.currentUser.uid}`);
			await update(userRef, { username: newUsername });

			// Remove the old username from the usernames node
			const oldUsernameRef = ref(db, `usernames/${username}`);
			await remove(oldUsernameRef);

			// Add the new username to the usernames node
			const newUsernameRef = ref(db, `usernames/${newUsername}`);
			await set(newUsernameRef, auth.currentUser.uid);

			setUsername(newUsername);
			alert("Username updated successfully");
		} catch (error) {
			setError(error.message);
		}
	};

	const handleUpdatePassword = async (e) => {
		e.preventDefault();
		if (!newPassword) {
			setError("Password cannot be empty");
			return;
		}
		try {
			await sendPasswordResetEmail(auth, email);
			alert("Password reset email sent. Please check your inbox.");
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
				<title>Your Profile - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} isTranslator={isTranslator}/>
			<div className="container">
				<h1>Your Profile</h1>
				{isAuthenticated ? (
					<div>
						<p><strong>Current Username:</strong> {username}</p>
						<form onSubmit={handleUpdateUsername} style={{ textAlign: "left", width: "100%" }}>
							<h2>Update Username</h2>
							<input
								type="text"
								placeholder="New Username"
								value={newUsername}
								onChange={(e) => setNewUsername(e.target.value)}
								required
							/>
							{error && <p style={{ color: "red" }}>{error}</p>}
							<button type="submit">Update Username</button>
						</form>
						<form onSubmit={handleUpdatePassword} style={{ textAlign: "left", width: "100%" }}>
							<h2>Update Password</h2>
							<input
								type="password"
								placeholder="New Password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
							/>
							{error && <p style={{ color: "red" }}>{error}</p>}
							<button type="submit">Update Password</button>
						</form>
					</div>
				) : (
						<p style={{ color: "red" }}>{error}</p>
				)}
			</div>
		</div>
	);
};

export default YourProfile;
