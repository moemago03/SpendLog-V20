// FIX: Update Firebase initialization to use v9 modular syntax.
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Incolla qui la configurazione del tuo progetto Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "spendlog-cafa2.firebaseapp.com",
  projectId: "spendlog-cafa2",
  storageBucket: "spendlog-cafa2.firebasestorage.app",
  messagingSenderId: "859713826525",
  appId: "1:859713826525:web:eaa292602a07d7daafb534"
};

// Initialize Firebase only if the API key is provided.
const isConfigured = !!firebaseConfig.apiKey;

let db: Firestore | undefined;

if (isConfigured) {
    try {
        if (!getApps().length) {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
        } else {
            db = getFirestore(getApp());
        }
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    // This warning is helpful for developers deploying to Vercel/other platforms.
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn("Firebase configuration key (FIREBASE_API_KEY) is not set. App will not connect to the database.");
    }
}


// Esporta l'istanza di Firestore (sarà undefined se non configurata)
export { db };