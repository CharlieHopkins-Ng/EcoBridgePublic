import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';  // 👈 use Firestore

export const useTranslation = (locale = 'en') => {
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(firestore, 'translations', locale);
        
        const unsubscribe = onSnapshot(
            docRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    setTranslations(data.namespaces?.nav || {});
                } else {
                    console.warn(`No translations found for language: ${locale}`);
                    setTranslations({});
                }
                setLoading(false);
            },
            (error) => {
                console.error('Translation loading error:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [locale]);

    const t = (key) => {
        if (loading) return key;
        return translations[key] || key;
    };

    return { t, loading };
};
