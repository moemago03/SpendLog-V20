

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Trip } from '../types';
import ThemeToggle from './ThemeToggle';

const CategoryManager = lazy(() => import('./CategoryManager'));
const FrequentExpenseManager = lazy(() => import('./FrequentExpenseManager'));
const TripManager = lazy(() => import('./TripManager'));


interface ProfileScreenProps {
    trips: Trip[];
    activeTripId: string | null;
    onSetDefaultTrip: (tripId: string) => void;
    onLogout: () => void;
}

const SettingsItem: React.FC<{
    label: string;
    icon: string;
    onClick?: () => void;
    children?: React.ReactNode;
    color?: string;
}> = ({ label, icon, onClick, children, color = 'text-on-surface' }) => (
    <div 
        onClick={onClick} 
        className={`flex justify-between items-center p-4 min-h-[64px] ${onClick ? 'cursor-pointer hover:bg-on-surface/5 active:bg-on-surface/10 transition-colors' : ''}`}
    >
        <div className="flex items-center gap-4">
            <span className={`material-symbols-outlined ${color === 'text-on-surface' ? 'text-on-surface-variant' : color}`}>{icon}</span>
            <span className={`${color} font-medium`}>{label}</span>
        </div>
        {children ? children : (onClick && <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>)}
    </div>
);


const ProfileScreen: React.FC<ProfileScreenProps> = ({ trips, activeTripId, onSetDefaultTrip, onLogout }) => {
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
    const [isFrequentExpenseManagerOpen, setIsFrequentExpenseManagerOpen] = useState(false);
    const [isTripManagerOpen, setIsTripManagerOpen] = useState(false);
    
    const activeTrip = trips.find(t => t.id === activeTripId) || null;

    const sortedTrips = useMemo(() => {
        if (!trips) return [];
        return [...trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [trips]);

    return (
        <>
            <div className="p-4 pb-24 space-y-8 max-w-2xl mx-auto">
                <header className="pt-8 pb-4">
                    <h1 className="text-4xl font-bold text-on-background">Profilo</h1>
                </header>

                {sortedTrips.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-surface-variant/50 rounded-3xl">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">luggage</span>
                        <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessun viaggio trovato</h2>
                        <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">Crea il tuo primo viaggio per iniziare a tracciare le tue avventure.</p>
                        <button onClick={() => setIsTripManagerOpen(true)} className="mt-8 px-8 py-3 bg-trip-primary text-trip-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95">
                            Crea un Viaggio
                        </button>
                    </div>
                ) : (
                    <section>
                        <label htmlFor="trip-select" className="block text-sm font-medium text-on-surface-variant mb-2 px-2 uppercase tracking-wider">Viaggio Attivo</label>
                        <div className="relative">
                            <select
                                id="trip-select"
                                value={activeTripId || 'none'}
                                onChange={(e) => onSetDefaultTrip(e.target.value)}
                                className="w-full bg-surface-variant border-2 border-transparent text-on-surface font-semibold text-lg rounded-2xl py-4 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-trip-primary"
                            >
                                <option value="none">Nessun viaggio predefinito</option>
                                {sortedTrips.map(trip => (
                                    <option key={trip.id} value={trip.id}>{trip.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined text-on-surface-variant absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">unfold_more</span>
                        </div>
                    </section>
                )}

                {/* --- Management Section --- */}
                <section className="space-y-3">
                    <h2 className="text-sm font-medium text-on-surface-variant px-2 uppercase tracking-wider">Gestione</h2>
                    <div className="bg-surface rounded-3xl divide-y divide-outline/20 overflow-hidden shadow-sm">
                        <SettingsItem icon="luggage" label="Gestione Viaggi" onClick={() => setIsTripManagerOpen(true)} />
                        <SettingsItem icon="category" label="Gestisci Categorie" onClick={() => setIsCategoryManagerOpen(true)} />
                        {activeTrip && (
                            <SettingsItem icon="star" label="Spese Frequenti" onClick={() => setIsFrequentExpenseManagerOpen(true)} />
                        )}
                    </div>
                </section>
                
                {/* --- App Settings Section --- */}
                <section className="space-y-3">
                     <h2 className="text-sm font-medium text-on-surface-variant px-2 uppercase tracking-wider">App</h2>
                    <div className="bg-surface rounded-3xl divide-y divide-outline/20 overflow-hidden shadow-sm">
                        <SettingsItem icon="contrast" label="Tema Scuro">
                            <ThemeToggle />
                        </SettingsItem>
                    </div>
                </section>

                {/* --- Account Section --- */}
                <section className="space-y-3">
                     <h2 className="text-sm font-medium text-on-surface-variant px-2 uppercase tracking-wider">Account</h2>
                    <div className="bg-surface rounded-3xl overflow-hidden shadow-sm">
                        <SettingsItem icon="logout" label="Logout" onClick={onLogout} color="text-error" />
                    </div>
                </section>

                <div className="text-center text-sm text-on-surface-variant/60 pt-8">
                    SpendiLog v18.0.1
                </div>
            </div>
            
            {isTripManagerOpen && (
                <Suspense fallback={<div/>}>
                    <TripManager onClose={() => setIsTripManagerOpen(false)} />
                </Suspense>
            )}
            {isCategoryManagerOpen && (
                <Suspense fallback={<div/>}>
                    <CategoryManager onClose={() => setIsCategoryManagerOpen(false)} />
                </Suspense>
            )}
            {isFrequentExpenseManagerOpen && activeTrip && (
                <Suspense fallback={<div/>}>
                    <FrequentExpenseManager 
                        activeTrip={activeTrip}
                        onClose={() => setIsFrequentExpenseManagerOpen(false)} 
                    />
                </Suspense>
            )}
        </>
    );
};

export default ProfileScreen;