import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut, updatePassword, sendPasswordResetEmail } from "firebase/auth";
import { ref, onValue, update, remove, set } from "firebase/database";
import { useRouter } from "next/router";
import Navbar from '../components/navBar';
import Head from "next/head";
import { app, db } from "../firebaseConfig";
import { useAuthRoles } from "../context/authRolesContext";
import { useTranslation } from "../hooks/useTranslation";

const YourProfile = ({ currentLanguage, onLanguageChange }) => {
	const [username, setUsername] = useState("");
	const [newUsername, setNewUsername] = useState("");
	const [email, setEmail] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [error, setError] = useState("");
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();
	const auth = getAuth(app);
	const router = useRouter();

	const { t: tprofile } = useTranslation(currentLanguage, "yourProfile");
	const { t: tcommon } = useTranslation(currentLanguage, "common");

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setEmail(user.email);
				fetchUsername(user.uid);
			} else {
				setError("You must be logged in to access this page.");
			}
		});
		return () => unsubscribe();
	}, [auth, router]);

	useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
                fetchUserLocations(user.uid);

                const userRef = ref(db, `users/${user.uid}`);
                onValue(userRef, (snapshot) => {
                    const userData = snapshot.val();
                    if (userData?.banned) {
                        const banReason = userData.banReason || tcommon("noReasons");
                        const banEndDate = userData.banEndDate || tcommon("indefinite");
                        setBannedMessage(tcommon("banned"), tcommon("reason"), banReason, tcommon("banExpires"), banEndDate);
                    }
                });
            } else {
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
			setError(tprofile("usernameCannotBeEmpty"));
			return;
		}
		try {
			// Check if the new username already exists
			const usernameRef = ref(db, `usernames/${newUsername}`);
			const snapshot = await new Promise((resolve) => {
				onValue(usernameRef, (snap) => resolve(snap.exists()), { onlyOnce: true });
			});
			if (snapshot) {
				setError(tprofile("usernameTaken"));
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
			alert(tprofile("usernameUpdated"));
		} catch (error) {
			setError(error.message);
		}
	};

	const handleUpdatePassword = async (e) => {
		e.preventDefault();
		if (!newPassword) {
			setError(tprofile("passwordCannotBeEmpty"));
			return;
		}
		try {
			await sendPasswordResetEmail(auth, email);
			alert(tprofile("passwordResetSent"));
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
			<Navbar 
				isAuthenticated={isAuthenticated} 
				isAdmin={isAdmin} 
				handleSignOut={handleSignOut} 
				isTranslator={isTranslator}
				onLanguageChange={onLanguageChange}
				currentLanguage={currentLanguage}
			/>
			<div className="container">
				<h1>{tprofile("yourProfile")}</h1>
				{isAuthenticated ? (
					<div>
						<p><strong>{tprofile("currentUsername")}:</strong> {username}</p>
						<form onSubmit={handleUpdateUsername} style={{ textAlign: "left", width: "100%" }}>
							<h2>{tprofile("updateUsername")}</h2>
							<input
								type="text"
								placeholder="New Username"
								value={newUsername}
								onChange={(e) => setNewUsername(e.target.value)}
								required
							/>
							{error && <p style={{ color: "red" }}>{error}</p>}
							<button type="submit">{tprofile("updateUsername")}</button>
						</form>
						<form onSubmit={handleUpdatePassword} style={{ textAlign: "left", width: "100%" }}>
							<h2>{tprofile("updatePassword")}</h2>
							<input
								type="password"
								placeholder="New Password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
							/>
							{error && <p style={{ color: "red" }}>{error}</p>}
							<button type="submit">{tprofile("updatePassword")}</button>
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
