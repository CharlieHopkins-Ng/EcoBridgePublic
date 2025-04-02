import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, get, remove } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app } from "../firebaseConfig";

const AdminInbox = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [adminMessages, setAdminMessages] = useState([]);
	const auth = getAuth(app);
	const db = getDatabase(app);
	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				setIsAuthenticated(true);

				// Check if the user is an admin using only adminUids
				const adminUidsRef = ref(db, "adminUids");
				const adminUidsSnapshot = await get(adminUidsRef);
				const adminUids = adminUidsSnapshot.val() ? Object.keys(adminUidsSnapshot.val()) : [];

				setIsAdmin(adminUids.includes(user.uid));

				// Fetch admin inbox messages
				const adminInboxRef = ref(db, "adminInbox");
				onValue(adminInboxRef, (snapshot) => {
					const data = snapshot.val();
					const messages = data ? Object.entries(data).map(([id, message]) => ({ id, ...message })) : [];
					setAdminMessages(messages);
				});
			} else {
				setIsAuthenticated(false);
				router.push("/login");
			}
		});
		return () => unsubscribe();
	}, [auth, db, router]);

	const handleSignOut = async () => {
		await signOut(auth);
		router.push("/login");
	};

	const deleteAdminMessage = async (messageId) => {
		try {
			const messageRef = ref(db, `adminInbox/${messageId}`);
			await remove(messageRef);
			alert("Message deleted successfully.");
		} catch (error) {
			alert("Failed to delete message: " + error.message);
		}
	};

	return (
		<div>
			<Head>
				<title>Admin Inbox - EcoBridge</title>
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
							<Link href="/inbox" legacyBehavior>
								<button>Inbox</button>
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
				<h1>Admin Inbox</h1>
				{isAdmin ? (
					adminMessages.length > 0 ? (
						<ul>
							{adminMessages.map((message) => (
								<li key={message.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
									<p><strong>Message:</strong> {message.message}</p>
									<p><strong>Appeal:</strong> {message.appealMessage}</p>
									<p><strong>User ID:</strong> {message.userId}</p>
									<p><strong>Username:</strong> {message.username}</p>
									<p><strong>Timestamp:</strong> {new Date(message.timestamp).toLocaleString()}</p>
									<button onClick={() => deleteAdminMessage(message.id)} style={{ marginTop: "10px", backgroundColor: "red", color: "white" }}>
										Delete Message
									</button>
								</li>
							))}
						</ul>
					) : (
						<p>No messages in the admin inbox.</p>
					)
				) : (
					<p>You do not have permission to access this page.</p>
				)}
			</div>
		</div>
	);
};

export default AdminInbox;
