import { useEffect } from "react";
import { getAuth, sendEmailVerification, signOut } from "firebase/auth";
import { ref, update } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { db } from "../firebaseConfig";

const VerifyEmail = () => {
	const auth = getAuth();
	const router = useRouter();

	const handleResendVerification = async () => {
		try {
			if (auth.currentUser) {
				await sendEmailVerification(auth.currentUser);
				alert("Verification email sent. Please check your inbox.");
			}
		} catch (error) {
			console.error("Error sending verification email:", error.message);
			alert("Failed to send verification email. Please try again later.");
		}
	};

	const handleSignOut = async () => {
		await signOut(auth);
		router.push("/login");
	};

	useEffect(() => {
		const checkEmailVerification = async () => {
			if (auth.currentUser) {
				await auth.currentUser.reload(); // Reload user data to get the latest emailVerified status
				if (auth.currentUser.emailVerified) {
					// Update the database to reflect email verification
					const userRef = ref(db, `users/${auth.currentUser.uid}`);
					await update(userRef, { emailVerified: true });

					// Redirect to the index page
					router.push("/");
				}
			}
		};

		checkEmailVerification();
	}, [auth, router]);

	return (
		<div>
			<Head>
				<title>Verify Your Email - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<nav className="nav">
				<div className="nav-left">
					<Link href="/" legacyBehavior>
						<button>Home</button>
					</Link>
				</div>
				<div className="nav-right">
					<button onClick={handleSignOut}>Sign Out</button>
				</div>
			</nav>
			<div className="container">
				<h1>Verify Your Email</h1>
				<p>
					A verification email has been sent to your email address. Please check your inbox and verify your email to continue.
				</p>
				<button onClick={handleResendVerification}>Resend Verification Email</button>
			</div>
		</div>
	);
};

export default VerifyEmail;
