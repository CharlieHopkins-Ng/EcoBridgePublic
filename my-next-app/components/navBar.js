import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const Navbar = ({ isAuthenticated, isAdmin }) => {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <nav className="nav">
            <div className="nav-left">
                <Link href="/">
                <button>Home</button>
                </Link>
                <Link href="/aboutUs">
                <button>About Us</button>
                </Link>
                <Link href="/news">
                <button>News</button>
                </Link>
                <Link href="/submitLocation">
                <button>{isAdmin ? "Add Location" : "Submit Location"}</button>
                </Link>
                {isAdmin && (
                <Link href="/admin">
                    <button>Admin</button>
                </Link>
                )}
                {isAuthenticated && (
                <>
                    <Link href="/yourLocations">
                    <button>Your Locations</button>
                    </Link>
                    <Link href="/yourProfile">
                    <button>Your Profile</button>
                    </Link>
                    <Link href="/inbox">
                    <button>Inbox</button>
                    </Link>
                </>
                )}
            </div>
            <div className="nav-right">
                {!isAuthenticated && (
                <>
                    <Link href="/signup">
                    <button>Sign Up</button>
                    </Link>
                    <Link href="/login">
                    <button>Log In</button>
                    </Link>
                </>
                )}
                {isAuthenticated && (
                <button onClick={handleSignOut}>Sign Out</button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;