import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

/**
 * useTranslation hook
 * @param {string} locale - language code, e.g., 'en'
 * @param {string} namespace - translation namespace, e.g., 'common', 'nav', 'map'
 */
export const useTranslation = (locale = 'en', namespace = 'common') => {
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(firestore, 'translations', locale);

        const unsubscribe = onSnapshot(
            docRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    // Use the given namespace, fallback to empty object if not present
                    setTranslations(data.namespaces?.[namespace] || {});
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
    }, [locale, namespace]);

    /**
     * Get translation for a given key in the current namespace.
     * If not found, fallback to the key itself.
     * @param {string} key
     * @returns {string}
     */
    const t = (key) => {
        if (loading) return key;
        return translations[key] || key;
    };

    return { t, translations, loading };
};
