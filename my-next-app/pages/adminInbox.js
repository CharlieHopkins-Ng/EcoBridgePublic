import { useState} from "react";
import { getAuth, signOut } from "firebase/auth";
import { getDatabase, ref, remove } from "firebase/database";
import { useRouter } from "next/router";
import Head from "next/head";
import { app } from "../firebaseConfig";
import Navbar from '../components/navBar';
import { useAuthRoles } from "../context/authRolesContext";

const AdminInbox = () => {
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();

	const [adminMessages, setAdminMessages] = useState([]);
	const auth = getAuth(app);
	const db = getDatabase(app);
	const router = useRouter();

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
			<Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} isTranslator={isTranslator}/>
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
