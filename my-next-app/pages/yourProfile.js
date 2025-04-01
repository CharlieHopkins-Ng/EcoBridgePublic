import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut, updatePassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, onValue, update, remove, set } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app, db } from "../firebaseConfig";

const YourProfile = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [username, setUsername] = useState("");
	const [newUsername, setNewUsername] = useState("");
	const [email, setEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const auth = getAuth(app);
	const router = useRouter();

	useEffect(() => {
		const fetchAdminEmails = async () => {
			const adminEmailsRef = ref(db, "adminEmails");
			onValue(adminEmailsRef, (snapshot) => {
				const data = snapshot.val();
				setIsAdmin(data ? Object.values(data).includes(auth.currentUser?.email) : false);
			});
		};

		fetchAdminEmails();
	}, [auth]);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setIsAuthenticated(true);
				setEmail(user.email);
				fetchUsername(user.uid);
			} else {
				setIsAuthenticated(false);
				router.push("/login");
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
					<p>You need to be signed in to view your profile.</p>
				)}
			</div>
		</div>
	);
};

export default YourProfile;
