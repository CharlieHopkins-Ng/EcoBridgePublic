import Head from "next/head";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { app, db } from "../firebaseConfig";
import Navbar from "../components/navBar";
import { useTranslation } from "../hooks/useTranslation";

const AboutUs = ({ currentLanguage, onLanguageChange }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTranslator, setIsTranslator] = useState(false);
    const [adminEmails, setAdminEmails] = useState([]);
    const [adminUids, setAdminUids] = useState([]);
    const [translatorUids, setTranslatorUids] = useState([]);
    const auth = getAuth(app);

    const { t: taboutUs } = useTranslation(currentLanguage, "aboutUs");
	const { t: tnavBar } = useTranslation(currentLanguage, "nav");

    // Fetch admin emails
    useEffect(() => {
        const adminEmailsRef = ref(db, "adminEmails");
        onValue(adminEmailsRef, (snapshot) => {
            const data = snapshot.val();
            setAdminEmails(data ? Object.values(data) : []);
        });
    }, []);

    // Fetch admin UIDs
    useEffect(() => {
        const adminUidsRef = ref(db, "adminUids");
        onValue(adminUidsRef, (snapshot) => {
            const data = snapshot.val();
            setAdminUids(data ? Object.keys(data) : []);
        });
    }, []);

    // Fetch translator UIDs
    useEffect(() => {
        const translatorUidsRef = ref(db, "translatorUids");
        onValue(translatorUidsRef, (snapshot) => {
            const data = snapshot.val();
            setTranslatorUids(data ? Object.keys(data) : []);
        });
    }, []);

    // Auth listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const isUserAdmin = adminEmails.includes(user.email) || adminUids.includes(user.uid);
                const isUserTranslator = translatorUids.includes(user.uid);

                setIsAuthenticated(true);
                setIsAdmin(isUserAdmin);
                setIsTranslator(isUserTranslator || isUserAdmin);
            } else {
                setIsAuthenticated(false);
                setIsAdmin(false);
                setIsTranslator(false);
            }
        });

        return () => unsubscribe();
    }, [adminEmails, adminUids, translatorUids]);

    const handleSignOut = async () => {
        await signOut(auth);
    };

    return (
        <div>
            <Head>
                <title>{tnavBar("aboutUs")} - EcoBridge</title>
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

                    <h1>{taboutUs("aboutEcoBridge")}</h1>
                    <p>
                        {taboutUs("aboutDescription")}
                    </p>

                    <h2>{taboutUs("ourMission")}</h2>
                    <p>{taboutUs("missionDescription")}</p>

                    <h2>{taboutUs("meetTheTeam")}</h2>
                    <p>{taboutUs("teamDescription")}</p>

                    <div style={{ textAlign: "left" }}>
                        <p>
                            <strong>Siyeong Park (Founder):</strong><br />
                            {taboutUs("siyeongBio")}
                        </p>
                        <p>
                            <strong>Charlie Hopkins-Ng (Website Developer & Co-Founder):</strong><br />
                            {taboutUs("charlieBio")}
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AboutUs;