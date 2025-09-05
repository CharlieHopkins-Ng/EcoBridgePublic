import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig.js'; // Your existing config

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      youAreHere: "You are here"
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
      signOut: "Sign Out"
    },
    map: {
      search: "Search locations",
      filters: "Filters",
      viewList: "List View",
      viewMap: "Map View"
    }
  }
};

const initializeTranslations = async () => {
  try {
    // Create English translations
    await setDoc(doc(db, 'translations', 'en'), initialTranslations);
    
    // Create empty documents for other languages
    const languages = ['es', 'fr', 'de', 'zh', 'ko'];
    for (const lang of languages) {
      await setDoc(doc(db, 'translations', lang), { namespaces: {} });
    }
    
    console.log('Firestore translation structure created successfully!');
  } catch (error) {
    console.error('Error creating translation structure:', error);
  }
};

initializeTranslations();