import React, { useState } from 'react';
import { auth } from '../config'; // Import auth
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import signIn function

const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) {
            setError("Servizio di autenticazione non disponibile.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // L'observer onAuthStateChanged in App.tsx gestirà il reindirizzamento
        } catch (error: any) {
            // Gestione degli errori di Firebase
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setError("Email o password non validi.");
            } else if (error.code === 'auth/invalid-email') {
                setError("Il formato dell'email non è valido.");
            } else {
                setError("Si è verificato un errore durante il login.");
            }
            console.error("Errore di autenticazione:", error);
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

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
                <div className="relative">
                     <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="w-full px-4 py-3 bg-surface-variant/50 border border-outline/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <div className="relative">
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="w-full px-4 py-3 bg-surface-variant/50 border border-outline/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-on-primary"></span>
                            <span>Accesso in corso...</span>
                        </>
                    ) : (
                        'Accedi'
                    )}
                </button>
            </form>
        </div>
    );
};

export default LoginScreen;