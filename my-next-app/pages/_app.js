import { useState, useEffect } from "react";
import Navbar from "../components/navBar";
import { AuthRolesProvider } from "../context/authRolesContext";
import styles from "../styles/globals.css";

function MyApp({ Component, pageProps }) {
    const [currentLanguage, setCurrentLanguage] = useState("en");

    useEffect(() => {
        // Restore language from localStorage if exists
        const lang = localStorage.getItem("language");
        if (lang) setCurrentLanguage(lang);
    }, []);

    const handleLanguageChange = (lang) => {
        setCurrentLanguage(lang);
        localStorage.setItem("language", lang); // persist across pages
    };

    return (
        <AuthRolesProvider>
            <>
                <Navbar
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                    {...pageProps}
                />
                <Component
                    {...pageProps}
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                />
            </>
        </AuthRolesProvider>
    );
}

export default MyApp;
