import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import path from 'path';

// Load service account key
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath));

// Initialize Admin SDK
initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = getFirestore();

const initialTranslations = {
    namespaces: {
        common: {
            welcome: "Welcome to EcoBridge",
            loading: "Loading...",
            error: "An error occurred",
            description: "Description",
            howToHelp: "How to Help",
            distance: "Distance",
            coordinates: "Coordinates",
            youAreHere: "You are here",
        },
        aboutUs: {
          aboutEcoBridge: "EcoBridge - Connecting You to Environmental Change",
          aboutDescription:
              "Ecobridge is a platform to connect people with other organizations or charities to support environmental causes. Whether it is donating items, volunteering, or getting involved in local sustainability initiatives, we make it easier to get involved and take action.",
          ourMission: "Our Mission",
          missionDescription:
              "At EcoBridge, our mission is to facilitate individuals and communities to take meaningful action for the environment by connecting them with opportunities to donate, volunteer, and contribute to sustainable initiatives. We want advocacy for sustainability to be easily accessible by others who are interested in actively supporting the environment.",
          meetTheTeam: "Meet the Team",
          teamDescription:
              "We are a team of environmental enthusiasts, coders, and volunteers passionate about making a difference. If you'd like to contribute, get in touch with us at supp0rtecobridge@gmail.com.",
          siyeongBio:
              "Hi! I am Siyeong Park, the founder of Ecobridge. I am a freshman at Shanghai American School. The LA wildfire that occurred at the start of 2025 inspired me to make this platform.",
          charlieBio:
              "Hi! I am Charlie Hopkins-Ng, Ecobridge's website developer. I have always been passionate about the environment, and have been to multiple protests about the environment.",
        },
        nav: {
            home: "Home",
            aboutUs: "About Us",
            news: "News",
            submitLocation: "Submit Location",
            addLocation: "Add Location",
            admin: "Admin",
            yourLocations: "Your Locations",
            yourProfile: "Your Profile",
            inbox: "Inbox",
            signUp: "Sign Up",
            logIn: "Log In",
            signOut: "Sign Out",
            translator: "Translator",
        },
        map: {
            search: "Search locations",
            filters: "Filters",
            viewList: "List View",
            viewMap: "Map View",
        },
    },
};

// Helper: deep merge, only add missing keys
const deepMerge = (source, target) => {
    const result = { ...target };
    for (const ns in source) {
        if (!result[ns]) result[ns] = {};
        for (const key in source[ns]) {
            if (!(key in result[ns])) {
                result[ns][key] = source[ns][key];
            }
        }
    }
    return result;
};

const initializeTranslations = async () => {
    try {
        console.log('Initializing translations...');

        // English
        const enDocRef = db.collection('translations').doc('en');
        const enSnap = await enDocRef.get();
        if (enSnap.exists) {
            const existing = enSnap.data().namespaces || {};
            const merged = deepMerge(initialTranslations.namespaces, existing);
            await enDocRef.set({ namespaces: merged }, { merge: true });
            console.log('✅ English translations merged');
        } else {
            await enDocRef.set(initialTranslations);
            console.log('✅ English translations created');
        }

        // Other languages
        const languages = ['fr', 'es', 'de', 'zh', 'ko', 'ms', 'th', 'it'];
        for (const lang of languages) {
            const docRef = db.collection('translations').doc(lang);
            const snap = await docRef.get();

            if (snap.exists) {
                const existing = snap.data().namespaces || {};
                const mergedNamespaces = { ...existing };

                // Ensure every namespace exists
                for (const ns in initialTranslations.namespaces) {
                    if (!mergedNamespaces[ns]) {
                        mergedNamespaces[ns] = {};
                    }
                    // Ensure every key exists in each namespace
                    for (const key in initialTranslations.namespaces[ns]) {
                        if (!(key in mergedNamespaces[ns])) {
                            mergedNamespaces[ns][key] = "";
                        }
                    }
                }

                await docRef.set({ namespaces: mergedNamespaces }, { merge: true });
                console.log(`✅ Merged missing keys for ${lang}`);
            } else {
                // Create a fully blank doc
                const blankDoc = {};
                for (const ns in initialTranslations.namespaces) {
                    blankDoc[ns] = {};
                    for (const key in initialTranslations.namespaces[ns]) {
                        blankDoc[ns][key] = "";
                    }
                }
                await docRef.set({ namespaces: blankDoc });
                console.log(`✅ Created blank translations for ${lang}`);
            }
        }

        console.log('All translations initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing translations:', error);
    }
};

initializeTranslations();
