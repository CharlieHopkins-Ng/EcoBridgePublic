import { createContext, useContext, useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, app } from "../firebaseConfig";

const AuthRolesContext = createContext();

export const AuthRolesProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isTranslator, setIsTranslator] = useState(false);

    const [adminUids, setAdminUids] = useState([]);
    const [translatorUids, setTranslatorUids] = useState([]);
    const [user, setUser] = useState(null);

    const auth = getAuth(app);

    // Fetch admin UIDs
    useEffect(() => {
        const adminUidsRef = ref(db, "adminUids");
        return onValue(adminUidsRef, (snapshot) => {
            const data = snapshot.val();
            setAdminUids(data ? Object.keys(data) : []);
        });
    }, []);

    // Fetch translator UIDs
    useEffect(() => {
        const translatorUidsRef = ref(db, "translatorUids");
        return onValue(translatorUidsRef, (snapshot) => {
            const data = snapshot.val();
            setTranslatorUids(data ? Object.keys(data) : []);
        });
    }, []);

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                const isUserAdmin = adminUids.includes(user.uid);
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
    }, [adminUids, translatorUids]);

    return (
        <AuthRolesContext.Provider value={{ isAuthenticated, isAdmin, isTranslator, user }}>
            {children}
        </AuthRolesContext.Provider>
    );
};

export const useAuthRoles = () => useContext(AuthRolesContext);
