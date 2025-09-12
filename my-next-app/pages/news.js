import Head from "next/head";
import { getAuth, signOut } from "firebase/auth";
import { useAuthRoles } from "../context/authRolesContext";
import { app } from "../firebaseConfig";
import Navbar from '../components/navBar';

const News = () => {
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();
	const auth = getAuth(app);

	const handleSignOut = async () => {
		await signOut(auth);
	};

	return (
		<div>
			<Head>
				<title>News - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} handleSignOut={handleSignOut} isTranslator={isTranslator}/>
			<header className="header">
				EcoBridge - Latest News and Updates
			</header>
			<main className="main">
				<section className="news-container">
					<h1>Latest News</h1>
					<article>
						<h2>10 September 2025 - Beta Launch!</h2>
						<p>
							We are happy to announce that EcoBridge has launched! More features will be coming soon such as:
						</p>
						<ul>
							<li>Leaving reviews on locations</li>
							<li>Multi-language support (feel free to contact us if you want to help with this)</li>
							<li>A custom domain</li>
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
