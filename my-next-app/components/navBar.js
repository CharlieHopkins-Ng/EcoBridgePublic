import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useTranslation } from "../hooks/useTranslation";

const Navbar = ({
    isAuthenticated,
    isAdmin,
    isTranslator,
    currentLanguage = "en",
    onLanguageChange
}) => {
    const router = useRouter();
    const { t } = useTranslation(currentLanguage, "nav");

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <nav className="nav">
            <div className="nav-left">
                <Link href="/"><button>{t("home")}</button></Link>
                <Link href="/aboutUs"><button>{t("aboutUs")}</button></Link>
                <Link href="/news"><button>{t("news")}</button></Link>
                <Link href="/submitLocation">
                    <button>{isAdmin ? t("addLocation") : t("submitLocation")}</button>
                </Link>

                {isAdmin && <Link href="/admin"><button>{t("admin")}</button></Link>}
                {isTranslator && <Link href="/translator"><button>Translator</button></Link>}

                {isAuthenticated && (
                    <>
                        <Link href="/yourLocations"><button>{t("yourLocations")}</button></Link>
                        <Link href="/yourProfile"><button>{t("yourProfile")}</button></Link>
                        <Link href="/inbox"><button>{t("inbox")}</button></Link>
                    </>
                )}
            </div>

            <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <select
                    value={currentLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
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


                {!isAuthenticated ? (
                    <>
                        <Link href="/signup"><button>{t("signUp")}</button></Link>
                        <Link href="/login"><button>{t("logIn")}</button></Link>
                    </>
                ) : (
                    <button onClick={handleSignOut}>{t("signOut")}</button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
