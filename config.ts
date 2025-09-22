// FIX: Update Firebase initialization to use v9 modular syntax.
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Incolla qui la configurazione del tuo progetto Firebase
const firebaseConfig = {
  apiKey: "DISABLED_BY_USER_REQUEST",
  authDomain: "spendlog-cafa2.firebaseapp.com",
  projectId: "spendlog-cafa2",
  storageBucket: "spendlog-cafa2.firebasestorage.app",
  messagingSenderId: "859713826525",
  appId: "1:859713826525:web:eaa292602a07d7daafb534"
};

// Check for placeholder configuration values to prevent the app from hanging.
// Force-disabled as per user request to use mock data only.
const isConfigured = false;

let db: Firestore | undefined;

if (isConfigured) {
    // This block is currently unreachable.
    // Initialize Firebase only if it hasn't been initialized already.
    // This prevents errors during hot-reloading in development.
    try {
        // FIX: Use v9 modular syntax (`getApps`, `initializeApp`, `getApp`) to resolve errors.
        if (!getApps().length) {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
        } else {
            db = getFirestore(getApp());
        }
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}
// Firebase connection is intentionally disabled to improve performance in the editor.
// The app will use local mock data.

// Esporta l'istanza di Firestore (sarà sempre undefined)
export { db };