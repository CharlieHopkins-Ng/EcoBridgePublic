import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore, app, db} from "../firebaseConfig";
import { useAuthRoles } from "../context/authRolesContext";
import { getAuth, signOut } from "firebase/auth";
import Navbar from "../components/navBar";
import { useTranslation } from "../hooks/useTranslation";

const TranslatorPanel = ({ currentLanguage, onLanguageChange }) => {
    const { isAuthenticated, isAdmin, isTranslator} = useAuthRoles();
    const auth = getAuth(app);

    const [selectedLanguage, setSelectedLanguage] = useState("en");
    const [selectedNamespace, setSelectedNamespace] = useState("nav");
    const [currentTranslations, setCurrentTranslations] = useState({});
    const [editedTranslations, setEditedTranslations] = useState({});
    const [englishTranslations, setEnglishTranslations] = useState({});

    const { t: tnavBar } = useTranslation(currentLanguage, "nav");

    const handleSignOut = async () => {
        await signOut(auth);
    };


    // Load translations
    const loadTranslations = async (lang, ns) => {
        const snap = await getDoc(doc(firestore, "translations", lang));
        if (snap.exists()) {
            const data = snap.data();
            setCurrentTranslations(data.namespaces?.[ns] || {});
            setEditedTranslations(data.namespaces?.[ns] || {});
        } else {
            setCurrentTranslations({});
            setEditedTranslations({});
        }
    };

    useEffect(() => {
        loadTranslations(selectedLanguage, selectedNamespace);
    }, [selectedLanguage, selectedNamespace]);

    // Save translations
    const saveTranslations = async () => {
        const ref = doc(firestore, "translations", selectedLanguage);
        await setDoc(
            ref,
            {
                namespaces: {
                    [selectedNamespace]: editedTranslations,
                },
            },
            { merge: true }
        );
        alert("Translations updated!");
        loadTranslations(selectedLanguage, selectedNamespace);
    };

    useEffect(() => {
        const loadEnglish = async () => {
            const snap = await getDoc(doc(firestore, "translations", "en"));
            if (snap.exists()) {
                setEnglishTranslations(snap.data().namespaces?.[selectedNamespace] || {});
            }
        };
        loadEnglish();
    }, [selectedNamespace]);

    if (!isTranslator) {
        return <div> You do not have translator permissions.</div>;
    }

    return (
        <div>
            <Navbar
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                isTranslator={isTranslator}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                handleSignOut={handleSignOut}
            />
            <h1 style={{ marginTop: "150px", marginLeft: "40px"}}>{tnavBar("translator")}</h1>

            <div style={{ marginBottom: "20px" }}>
                <label style={{ marginLeft: "40px" }}>
                    Language:
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        style={{ marginLeft: "40px" }}
                    >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                        <option value="de">German</option>
                        <option value="zh">Chinese</option>
                        <option value="ko">Korean</option>
                        <option value="ms">Malay</option>
                        <option value="th">Thai</option>
                        <option value="it">Italian</option>
                    </select>
                </label>

                <label style={{ marginLeft: "40px" }}>
                    Namespace:
                    <select
                        value={selectedNamespace}
                        onChange={(e) => setSelectedNamespace(e.target.value)}
                        style={{ marginLeft: "40px" }}
                    >
                        <option value="common">Common</option>
                        <option value="nav">Nav</option>
                        <option value="map">Map</option>
                        <option value="aboutUs">About Us</option>
                    </select>
                </label>
            </div>
            <div>
                {Object.entries(editedTranslations).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: "20px" }}>
                        <div
                            style={{
                                fontWeight: "bold",
                                marginBottom: "5px",
                                marginLeft: "40px",
                                whiteSpace: "pre-wrap", 
                                wordBreak: "break-word", 
                                width: "40%",
                            }}
                        >
                            {englishTranslations[key] || key}
                        </div>

                        <textarea
                            value={value}
                            onChange={(e) =>
                                setEditedTranslations({
                                    ...editedTranslations,
                                    [key]: e.target.value,
                                })
                            }
                            style={{
                                marginLeft: "40px",
                                width: "100%",
                                minHeight: "60px",
                                resize: "vertical",
                                whiteSpace: "pre-wrap",
                            }}
                        />
                    </div>
                ))}
            </div>

            <button onClick={saveTranslations} style={{ marginTop: "20px" }}>
                Save Changes
            </button>
        </div>
    );
};

export default TranslatorPanel;
