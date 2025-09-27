import React, { useState } from 'react';
import { auth } from '../config'; // Firebase auth instance
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'; // Import signInWithCredential
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface LoginScreenProps {
  onShowPrivacy: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onShowPrivacy }) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        if (!auth) {
            setError("Servizio di autenticazione non disponibile.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Esegui il login nativo con Google
            const googleUser = await GoogleAuth.signIn();
            
            // 2. Crea le credenziali Firebase con il token ottenuto
            const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
            
            // 3. Autentica l'utente in Firebase con le credenziali
            await signInWithCredential(auth, credential);

            // L'observer onAuthStateChanged in App.tsx si occuperà del resto.
        } catch (error: any) {
            console.error("Errore di autenticazione Google:", error);
            // Gestisci gli errori specifici del plugin se necessario
            setError("Si è verificato un errore durante l'accesso con Google.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col justify-center items-center gap-8 bg-gradient-to-b from-tertiary-container/30 via-surface to-primary-container/30 text-on-surface p-4">
            <div className="text-center space-y-4">
                <div className="flex justify-center items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
                    <span className="material-symbols-outlined text-tertiary text-3xl">bar_chart</span>
                    <span className="material-symbols-outlined text-secondary text-3xl">travel</span>
                </div>
                <h1 className="text-5xl font-bold tracking-tighter">SpendiLog</h1>
                <p className="text-on-surface-variant">Accedi per gestire i tuoi viaggi</p>
            </div>

            <div className="w-full max-w-sm space-y-4">
                {error && (
                    <div className="text-red-500 text-sm text-center p-2 bg-red-100 border border-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-on-primary"></span>
                            <span>Accesso in corso...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.4 512 244 512 111.8 512 0 400.2 0 261.8 0 123.4 111.8 11.8 244 11.8c70.3 0 129.8 27.6 174.9 71.6L363.3 167c-43.4-41.2-97.3-66-162.3-66C152 101 79.5 174.1 79.5 261.8c0 87.7 72.5 160.8 164.5 160.8 98.2 0 135-70.4 140.8-106.9H244v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                            <span>Accedi con Google</span>
                        </>
                    )}
                </button>

                <div className="text-center mt-4">
                    <button onClick={onShowPrivacy} className="text-sm text-on-surface-variant hover:text-primary underline">
                        Privacy Policy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
