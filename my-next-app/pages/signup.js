import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { app, db } from "../firebaseConfig";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      alert("Verification email sent. Please check your inbox.");
      router.push("/login");
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
        <title>Sign Up - EcoBridge</title>
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
        <h1>Sign Up</h1>
        <form onSubmit={handleSignup} style={{ textAlign: "left", width: "100%" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit">Sign Up</button>
        </form>
        <p>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
