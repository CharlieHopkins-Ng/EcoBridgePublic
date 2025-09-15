import Head from "next/head";
import { getAuth, signOut } from "firebase/auth";
import { useAuthRoles } from "../context/authRolesContext";
import { app } from "../firebaseConfig";
import Navbar from '../components/navBar';
import  { useTranslation } from "../hooks/useTranslation";


const News = ({ currentLanguage, onLanguageChange }) => {
	const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();
	const auth = getAuth(app);

	const { t: tnews } = useTranslation(currentLanguage, "news");

	const handleSignOut = async () => {
		await signOut(auth);
	};

	return (
		<div>
			<Head>
				<title>News - EcoBridge</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</Head>
			<Navbar 
                isAuthenticated={isAuthenticated} 
                isAdmin={isAdmin} 
                handleSignOut={handleSignOut} 
                isTranslator={isTranslator} 
                currentLanguage={currentLanguage} 
                onLanguageChange={onLanguageChange}
            />			<header className="header">
				EcoBridge - Latest News and Updates
			</header>
			<main className="main">
				<section className="news-container">
					<h1>{tnews("latestNews")}</h1>
					<article>
						<h2>{tnews("betaLaunch")}</h2>
						<p>
							{tnews("betaDescription")}
						</p>
						<ul>
							<li>{tnews("feature1")}</li>
							<li>{tnews("feature2")}</li>
							<li>{tnews("feature3")}</li>
						</ul>
					</article>
				</section>
			</main>
		</div>
	);
};

export default News;
