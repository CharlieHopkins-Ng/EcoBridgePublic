import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, push, get, remove } from "firebase/database";
import { useRouter } from "next/router";
import Head from "next/head";
import { app } from "../firebaseConfig";
import Navbar from '../components/navBar';

const Inbox = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
	const [inboxMessages, setInboxMessages] = useState([]);
	const auth = getAuth(app);
	const db = getDatabase(app);
	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				setIsAuthenticated(true);

				// Check if the user is an admin
				const adminUidsRef = ref(db, "adminUids");
				onValue(adminUidsRef, (snapshot) => {
					const adminUids = snapshot.val() ? Object.keys(snapshot.val()) : [];
					if (adminUids.includes(user.uid)) {
						router.push("/adminInbox"); // Redirect admins to adminInbox
					} else {
						setIsAdmin(false);
					}
				});

				// Fetch inbox messages
				const inboxRef = ref(db, `users/${user.uid}/inbox`);
				onValue(inboxRef, (snapshot) => {
					const data = snapshot.val();
					const messages = data ? Object.entries(data).map(([id, message]) => ({ id, ...message })) : [];
					setInboxMessages(messages);
				});

				// Check if the user is banned
				const userRef = ref(db, `users/${user.uid}`);
				const userSnapshot = await get(userRef);
				const userData = userSnapshot.val();
				if (userData?.banned) {
					setInboxMessages((prevMessages) => [
						{
							id: "ban-notification",
							message: "You have been banned.",
							reason: userData.banReason || "No reason provided",
							banEndDate: userData.banEndDate || "Indefinite",
							timestamp: new Date().toISOString(),
						},
						...prevMessages,
					]);
				}
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

	const sendUnbanAppeal = async (appealMessage) => {
		try {
			const userRef = ref(db, `users/${auth.currentUser.uid}`);
			const userSnapshot = await get(userRef);
			const userData = userSnapshot.val();

			const adminInboxRef = ref(db, `adminInbox`);
			await push(adminInboxRef, {
				message: "Unban Appeal",
				appealMessage: appealMessage,
				userId: auth.currentUser.uid,
				username: userData.username || "Anonymous",
				email: userData.email || "N/A",
				timestamp: new Date().toISOString(),
			});
			alert("Your appeal has been sent to the admin.");
		} catch (error) {
			alert("Failed to send appeal: " + error.message);
		}
	};

	const deleteMessage = async (messageId) => {
		try {
			const messageRef = ref(db, `users/${auth.currentUser.uid}/inbox/${messageId}`);
			await remove(messageRef);
			alert("Message deleted successfully.");
		} catch (error) {
			alert("Failed to delete message: " + error.message);
		}
	};

	return (
		<div>
			<Head>
				<title>Inbox - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} />
			<div className="container">
				<h1>Your Inbox</h1>
				{inboxMessages.length > 0 ? (
					<ul>
						{inboxMessages.map((message) => (
							<li key={message.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
								<p><strong>Message:</strong> {message.message}</p>
								<p><strong>Reason:</strong> {message.reason}</p>
								{message.banEndDate && <p><strong>Ban End Date:</strong> {new Date(message.banEndDate).toLocaleString()}</p>}
								<p><strong>Timestamp:</strong> {new Date(message.timestamp).toLocaleString()}</p>
								{message.id !== "ban-notification" && (
									<button onClick={() => deleteMessage(message.id)} style={{ marginTop: "10px", backgroundColor: "red", color: "white" }}>
										Delete Message
									</button>
								)}
							</li>
						))}
					</ul>
				) : (
					<p>No messages in your inbox.</p>
				)}

				{/* Appeal for unban */}
				{inboxMessages.some((msg) => msg.message === "You have been banned.") && (
					<div>
						<h2>Appeal for Unban</h2>
						<textarea
							placeholder="Write your appeal message here..."
							id="appealMessage"
							style={{ width: "100%", height: "100px", marginBottom: "10px" }}
						></textarea>
						<button onClick={() => sendUnbanAppeal(document.getElementById("appealMessage").value)}>
							Send Appeal
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Inbox;
