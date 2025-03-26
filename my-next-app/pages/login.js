import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { ref, get, update } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app, db } from "../firebaseConfig";

const Login = () => {
	const [emailOrUsername, setEmailOrUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [adminUids, setAdminUids] = useState([]);
	const router = useRouter();
	const auth = getAuth(app);

	useEffect(() => {
		const fetchAdminUids = async () => {
			const adminUidsRef = ref(db, "adminUids");
			const snapshot = await get(adminUidsRef);
			const data = snapshot.val();
			setAdminUids(data ? Object.keys(data) : []);
		};

		fetchAdminUids();
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				if (!user.emailVerified) {
					router.push("/verifyEmail");
					return;
				}
				setIsAuthenticated(true);

				const adminUidsRef = ref(db, "adminUids");
				const snapshot = await get(adminUidsRef);
				const data = snapshot.val();
				const updatedAdminUids = data ? Object.keys(data) : [];

				setAdminUids(updatedAdminUids);
				setIsAdmin(updatedAdminUids.includes(user.uid));
			} else {
				setIsAuthenticated(false);
				setIsAdmin(false);
			}
		});

		return () => unsubscribe();
	}, [auth, router]);

	const handleLogin = async (e) => {
		e.preventDefault();
		try {
			let email = emailOrUsername;

			if (!email.includes("@")) {
				// If input is a username, fetch the corresponding email
				const usersRef = ref(db, "users");
				const snapshot = await get(usersRef);
				const users = snapshot.val();
				const user = users ? Object.values(users).find(user => user.username === emailOrUsername) : null;

				if (user) {
					email = user.email;
				} else {
					throw new Error("Username not found");
				}
			}

			const userCredential = await signInWithEmailAndPassword(auth, email, password);

			// Update email verification status in the database
			const userRef = ref(db, `users/${userCredential.user.uid}`);
			await update(userRef, { emailVerified: userCredential.user.emailVerified });

			if (userCredential.user.emailVerified) {
				router.push("/");
			} else {
				router.push("/verifyEmail");
			}
		} catch (error) {
			setError(error.message);
		}
	};

	const handleForgotPassword = async () => {
		if (!emailOrUsername) {
			setError("Please enter your email or username to reset your password.");
			return;
		}

		try {
			let email = emailOrUsername;

			if (!email.includes("@")) {
				// If input is a username, fetch the corresponding email
				const usersRef = ref(db, "users");
				const snapshot = await get(usersRef);
				const users = snapshot.val();
				const user = users ? Object.values(users).find(user => user.username === emailOrUsername) : null;

				if (user) {
					email = user.email;
				} else {
					throw new Error("Username not found");
				}
			}

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
				<title>Login - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>

			<nav className="nav">
				<div className="nav-left">
					<Link href="/" legacyBehavior><button>Home</button></Link>
					<Link href="/aboutUs" legacyBehavior><button>About Us</button></Link>
					<Link href="/news" legacyBehavior><button>News</button></Link>
					<Link href="/submitLocation" legacyBehavior>
						<button>{isAdmin ? "Add Location" : "Submit Location"}</button>
					</Link>
					{isAdmin && <Link href="/admin" legacyBehavior><button>Admin</button></Link>}
				</div>
				<div className="nav-right">
					{!isAuthenticated && (
						<>
							<Link href="/signup" legacyBehavior><button>Sign Up</button></Link>
							<Link href="/login" legacyBehavior><button>Log In</button></Link>
						</>
					)}
					{isAuthenticated && <button onClick={handleSignOut}>Sign Out</button>}
				</div>
			</nav>

			<div className="container" style={{ maxWidth: "900px", width: "100%" }}>
				<h1>Login</h1>
				<form onSubmit={handleLogin} style={{ textAlign: "left", width: "100%" }}>
					<input
						type="text"
						placeholder="Email or Username"
						value={emailOrUsername}
						onChange={(e) => setEmailOrUsername(e.target.value)}
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					{error && <p style={{ color: "red" }}>{error}</p>}
					<button type="submit">Login</button>
				</form>
				<p>
					Don't have an account? <Link href="/signup">Sign up</Link>
				</p>
				<p>
					<a href="#" onClick={handleForgotPassword} style={{ color: "blue", textDecoration: "underline" }}>
						Forgot Password?
					</a>
				</p>
			</div>
		</div>
	);
};

export default Login;
