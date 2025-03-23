import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app, db } from "../firebaseConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmails, setAdminEmails] = useState([]);
  const router = useRouter();
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setIsAdmin(adminEmails.includes(user.email));
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [auth, adminEmails]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div>
      <Head>
        <title>Login - EcoBridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <nav className="nav">
        <div className="nav-left">
          <Link href="/" legacyBehavior>
            <button>Home</button>
          </Link>
          <Link href="/aboutUs" legacyBehavior>
            <button>About Us</button>
          </Link>
          <Link href="/news" legacyBehavior>
            <button>News</button>
          </Link>
          <Link href="/submitLocation" legacyBehavior>
            <button>{isAdmin ? "Add Location" : "Submit Location"}</button>
          </Link>
          {isAdmin && (
            <Link href="/admin" legacyBehavior>
              <button>Admin</button>
            </Link>
          )}
        </div>
        <div className="nav-right">
          {!isAuthenticated && (
            <Link href="/signup" legacyBehavior>
              <button>Sign Up</button>
            </Link>
          )}
          {!isAuthenticated && (
            <Link href="/login" legacyBehavior>
              <button>Log In</button>
            </Link>
          )}
          {isAuthenticated && (
            <button onClick={handleSignOut}>Sign Out</button>
          )}
        </div>
      </nav>
      <div className="container" style={{ maxWidth: "900px", width: "100%" }}>
        <h1>Login</h1>
        <form onSubmit={handleLogin} style={{ textAlign: "left", width: "100%" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit">Login</button>
        </form>
        <p>
          Don't have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
