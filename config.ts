// FIX: Update imports to use Firebase v9 compatibility layer, which exposes the v8 API.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Incolla qui la configurazione del tuo progetto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCN-ocf0Spoe_Wk8q_q08RJY1cHv67ymHY",
  authDomain: "spendlog-cafa2.firebaseapp.com",
  projectId: "spendlog-cafa2",
  storageBucket: "spendlog-cafa2.firebasestorage.app",
  messagingSenderId: "859713826525",
  appId: "1:859713826525:web:eaa292602a07d7daafb534"
};

// Check for placeholder configuration values to prevent the app from hanging.
const isConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

let db: firebase.firestore.Firestore;

if (isConfigured) {
    // Initialize Firebase only if it hasn't been initialized already.
    // This prevents errors during hot-reloading in development.
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
        } catch (e) {
            console.error("Firebase initialization failed:", e);
        }
    } else {
        db = firebase.app().firestore();
    }
} else {
    // Log a clear error in the console if the Firebase config is missing.
    console.error(
        "****************************************************\n" +
        "** ERRORE: Configurazione Firebase mancante!      **\n" +
        "** Per favore, inserisci le tue credenziali     **\n" +
        "** Firebase reali nel file `config.ts` per      **\n" +
        "** connetterti al database.                     **\n" +
        "****************************************************"
    );
    // Create a dummy db object that will make data calls fail gracefully
    // instead of crashing the app.
    db = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.reject(new Error("Firebase non è configurato. Controlla il file config.ts.")),
                set: () => Promise.reject(new Error("Firebase non è configurato. Controlla il file config.ts.")),
            }),
        }),
    } as unknown as firebase.firestore.Firestore;
}

// Esporta l'istanza di Firestore (reale o fittizia)
export { db };