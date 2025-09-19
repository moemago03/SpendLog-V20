// By loading Firebase via script tags in index.html, we no longer need to import it here.
// This ensures the firebase object is globally available before our app code runs.
declare const firebase: any;


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

let db: any;

if (isConfigured) {
    try {
        // Use compat initialization from the global firebase object
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
    } catch (e) {
        console.error("Firebase initialization failed:", e);
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
}

// Esporta l'istanza di Firestore
export { db };