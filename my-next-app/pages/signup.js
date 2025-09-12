import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useAuthRoles } from "../context/authRolesContext";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app, db } from "../firebaseConfig";
import Navbar from '../components/navBar';

const Signup = () => {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();
	const auth = getAuth(app);
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();

	const handleSignup = async (e) => {
		e.preventDefault();
		setError(""); // Clear any previous errors

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		try {
			// Create user account in Firebase Auth
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// Wait until user is authenticated before writing to database
			await new Promise((resolve) => {
				const unsubscribe = onAuthStateChanged(auth, (authUser) => {
					if (authUser && authUser.uid === user.uid) {
						resolve();
						unsubscribe();
					}
				});
			});

			// Check if the username is taken
			const usernameRef = ref(db, `usernames/${username}`);
			const usernameSnapshot = await get(usernameRef);
			if (usernameSnapshot.exists()) {
				setError("Username is already taken. Please choose a different one.");
				return;
			}

			// Write user data to the database
			const userRef = ref(db, `users/${user.uid}`);
			const userData = {
				username: username,
				email: email,
				createdAt: new Date().toISOString(),
				emailVerified: user.emailVerified || false,
			};

			await set(userRef, userData);
			await set(usernameRef, user.uid); // Store the username reference

			// Send email verification
			await sendEmailVerification(user);

			alert("Verification email sent. Please check your inbox.");
			router.push("/verifyEmail");
		} catch (error) {
			console.error("Signup error:", error);
			if (error.code === "auth/email-already-in-use") {
				setError("Email is already registered. Please use a different email.");
			} else if (error.code === "auth/invalid-email") {
				setError("Invalid email format.");
			} else if (error.code === "auth/weak-password") {
				setError("Password is too weak. Use at least 6 characters.");
			} else {
				setError("Error signing up. Please try again.");
			}
		}
	};

	const handleSignOut = async () => {
		await signOut(auth);
		router.push("/login");
	};

	return (
		<div>
			<Head>
				<title>Sign Up - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} isTranslator={isTranslator}/>
			<div className="container" style={{ maxWidth: "900px", width: "100%" }}>
				<h1>Sign Up</h1>
				<form onSubmit={handleSignup} style={{ textAlign: "left", width: "100%" }}>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<input
						type="password"
						placeholder="Confirm Password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
					/>
					{error && <p style={{ color: "red" }}>{error}</p>}
					<button type="submit">Sign Up</button>
				</form>
				<p>
					Already have an account? <Link href="/login">Login</Link>
				</p>
			</div>
		</div>
	);
};

export default Signup;
