import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getDatabase, ref, onValue, push, get, remove } from "firebase/database";
import { useRouter } from "next/router";
import Head from "next/head";
import { app } from "../firebaseConfig";
import Navbar from '../components/navBar';
import { useAuthRoles } from "../context/authRolesContext";
import { useTranslation } from "../hooks/useTranslation";

const Inbox = ({currentLanguage, onLanguageChange}) => {
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();
	const [inboxMessages, setInboxMessages] = useState([]);
	const auth = getAuth(app);
	const db = getDatabase(app);
	const router = useRouter();

	const { t: tcommon } = useTranslation(currentLanguage, "common");
	const { t: tinbox } = useTranslation(currentLanguage, "inbox");

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {

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
							message: tcommon("banned"),
							reason: userData.banReason || tcommon("noReasons"),
							banEndDate: userData.banEndDate || tcommon("indefinite"),
							timestamp: new Date().toISOString(),
						},
						...prevMessages,
					]);
				}
			} else {
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
				message: tinbox("unbanAppeal"),
				appealMessage: appealMessage,
				userId: auth.currentUser.uid,
				username: userData.username || "Anonymous",
				email: userData.email || "N/A",
				timestamp: new Date().toISOString(),
			});
			alert(tinbox("appealSent"));
		} catch (error) {
			alert(tinbox("appealFailed") + error.message);
		}
	};

	const deleteMessage = async (messageId) => {
		try {
			const messageRef = ref(db, `users/${auth.currentUser.uid}/inbox/${messageId}`);
			await remove(messageRef);
			alert(tinbox("deleteSuccess"));
		} catch (error) {
			alert(tinbox("deleteFailed") + error.message);
		}
	};

	return (
		<div>
			<Head>
				<title>Inbox - EcoBridge</title>
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
				<h1>{tinbox("yourInbox")}</h1>
				{inboxMessages.length > 0 ? (
					<ul>
						{inboxMessages.map((message) => (
							<li key={message.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px", borderRadius: "5px" }}>
								<p><strong>{tinbox("message")}:</strong> {message.message}</p>
								<p><strong>{tinbox("reason")}:</strong> {message.reason}</p>
								{message.banEndDate && <p><strong>{tinbox("banEndDate")}:</strong> {new Date(message.banEndDate).toLocaleString()}</p>}
								<p><strong>{tinbox("timestamp")}:</strong> {new Date(message.timestamp).toLocaleString()}</p>
								{message.id !== "ban-notification" && (
									<button onClick={() => deleteMessage(message.id)} style={{ marginTop: "10px", backgroundColor: "red", color: "white" }}>
										{tinbox("deleteMessage")}
									</button>
								)}
							</li>
						))}
					</ul>
				) : (
					<p>{tinbox("noMessages")}</p>
				)}

				{/* Appeal for unban */}
				{inboxMessages.some((msg) => msg.message === "You have been banned.") && (
					<div>
						<h2>{tinbox("appealTitle")}</h2>
						<textarea
							placeholder="Write your appeal message here..."
							id="appealMessage"
							style={{ width: "100%", height: "100px", marginBottom: "10px" }}
						></textarea>
						<button onClick={() => sendUnbanAppeal(document.getElementById("appealMessage").value)}>
							{tinbox("sendAppeal")}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default Inbox;
