// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCN-ocf0Spoe_Wk8q_q08RJY1cHv67ymHY",
  authDomain: "spendlog-cafa2.firebaseapp.com",
  projectId: "spendlog-cafa2",
  storageBucket: "spendlog-cafa2.appspot.com",
  messagingSenderId: "859713826525",
  appId: "1:859713826525:web:eaa292602a07d7daafb534"
};

const isConfigured = !!firebaseConfig.apiKey;
let app;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isConfigured) {
    // Initialize Firebase, avoid re-initializing
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} else {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn("Firebase configuration key is not set. App will not connect to Firebase services.");
    }
}

// Export instances for use in other parts of the app
export { db, auth };

// Export debug info
export const firebaseDebugInfo = {
  isConfigured,
  projectId: isConfigured ? firebaseConfig.projectId : 'N/A'
};
