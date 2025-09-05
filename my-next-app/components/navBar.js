import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useTranslation } from '../hooks/useTranslation';

const Navbar = ({ isAuthenticated, isAdmin, currentLanguage = 'en' }) => {
    const router = useRouter();
    const { t } = useTranslation(currentLanguage);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <nav className="nav">
            <div className="nav-left">
                <Link href="/">
                    <button>{t('home')}</button> {/* No namespace needed */}
                </Link>
                <Link href="/aboutUs">
                    <button>{t('aboutUs')}</button>
                </Link>
                <Link href="/news">
                    <button>{t('news')}</button>
                </Link>
                <Link href="/submitLocation">
                    <button>{isAdmin ? t('addLocation') : t('submitLocation')}</button>
                </Link>
                {isAdmin && (
                    <Link href="/admin">
                        <button>{t('admin')}</button>
                    </Link>
                )}
                {isAuthenticated && (
                    <>
                        <Link href="/yourLocations">
                            <button>{t('yourLocations')}</button>
                        </Link>
                        <Link href="/yourProfile">
                            <button>{t('yourProfile')}</button>
                        </Link>
                        <Link href="/inbox">
                            <button>{t('inbox')}</button>
                        </Link>
                    </>
                )}
            </div>
            <div className="nav-right">
                {!isAuthenticated && (
                    <>
                        <Link href="/signup">
                            <button>{t('signUp')}</button>
                        </Link>
                        <Link href="/login">
                            <button>{t('logIn')}</button>
                        </Link>
                    </>
                )}
                {isAuthenticated && (
                    <button onClick={handleSignOut}>{t('signOut')}</button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;