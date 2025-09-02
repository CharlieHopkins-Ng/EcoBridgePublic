import Head from "next/head";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { app, db } from "../firebaseConfig";
import Navbar from '../components/navBar';

const News = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const [adminEmails, setAdminEmails] = useState([]);
	const [adminUids, setAdminUids] = useState([]);
	const auth = getAuth(app);

	useEffect(() => {
		const fetchAdminEmails = async () => {
			const adminEmailsRef = ref(db, "adminEmails");
			onValue(adminEmailsRef, (snapshot) => {
				const data = snapshot.val();
				setAdminEmails(data ? Object.values(data) : []);
			});
		};

		fetchAdminEmails();
	}, []);

	useEffect(() => {
		const fetchAdminUids = async () => {
			const adminUidsRef = ref(db, "adminUids");
			onValue(adminUidsRef, (snapshot) => {
				const data = snapshot.val();
				setAdminUids(data ? Object.keys(data) : []);
			});
		};

		fetchAdminUids();
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setIsAuthenticated(true);
				setIsAdmin(adminEmails.includes(user.email) || adminUids.includes(user.uid)); // Ensure admin check includes UIDs
			} else {
				setIsAuthenticated(false);
				setIsAdmin(false);
			}
		});
		return () => unsubscribe();
	}, [auth, adminEmails, adminUids]);

	const handleSignOut = async () => {
		await signOut(auth);
	};

	return (
		<div>
			<Head>
				<title>News - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} />
			<header className="header">
				EcoBridge - Latest News and Updates
			</header>
			<main className="main">
				<section className="news-container">
					<h1>Latest News</h1>
					<article>
						<h2>[#insert date here] Beta Launch!</h2>
						<p>
							We are happy to announce that EcoBridge has launched! More features will be coming soon such as:
						</p>
						<ul>
							<li>Leaving reviews on locations</li>
							<li>Multi-language support (feel free to contact us if you want to help with this)</li>
							<li>A custom domain</li>
							<li>Community blogs</li>
						</ul>
					</article>
				</section>
			</main>
			<div id="sidebar" className="sidebar">
				<button className="close-btn" onClick={() => toggleSidebar()}>×</button>
				<h2>User Profile</h2>
				<p id="sidebarUsername">Username: N/A</p>
				<p id="sidebarEmail">Email: N/A</p>
				<p id="authStatus">Not Authenticated</p>
				<button className="sign-out-btn" onClick={() => signOut()}>Sign Out</button>
			</div>
		</div>
	);
};

export default News;
