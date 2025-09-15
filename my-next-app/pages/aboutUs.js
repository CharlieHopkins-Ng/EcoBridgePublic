import Head from "next/head";
import {signOut } from "firebase/auth";
import Navbar from "../components/navBar";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthRoles } from "../context/authRolesContext";

const AboutUs = ({ currentLanguage, onLanguageChange }) => {
    const { t: taboutUs } = useTranslation(currentLanguage, "aboutUs");

    const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();

    const handleSignOut = async () => {
        await signOut(auth);
    };

    return (
        <div>
            <Head>
                <title>About Us - EcoBridge</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <Navbar
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                isTranslator={isTranslator}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                handleSignOut={handleSignOut}
            />

            <main className="main">
                <section className="about-container">
                    <header className="header">
                        <h1>{taboutUs("aboutEcoBridge")}</h1>
                    </header>

                    <p>
                        {taboutUs("aboutDescription")}
                    </p>

                    <h2>{taboutUs("ourMission")}</h2>
                    <p>{taboutUs("missionDescription")}</p>

                    <h2>{taboutUs("meetTheTeam")}</h2>
                    <p>{taboutUs("teamDescription")}</p>

                    <div style={{ textAlign: "left" }}>
                        <p>
                            <strong>{taboutUs("siyeongDesc")}:</strong><br />
                            {taboutUs("siyeongBio")}
                        </p>
                        <p>
                            <strong>{taboutUs("charlieDesc")}</strong><br />
                            {taboutUs("charlieBio")}
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AboutUs;