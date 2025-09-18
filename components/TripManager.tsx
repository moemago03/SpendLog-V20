

import React, { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { useData } from '../context/DataContext';
import { Trip } from '../types';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';

const TripForm = lazy(() => import('./TripForm'));


const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(10);
};

interface TripManagerProps {
    onClose: () => void;
}

const TripCard: React.FC<{
  trip: Trip;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ trip, onEdit, onDelete }) => {
  const { convert, formatCurrency } = useCurrencyConverter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const totalSpent = useMemo(() => {
    return (trip.expenses || []).reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
  }, [trip, convert]);
  
  const spentPercentage = trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0;
  const remainingBudget = trip.totalBudget - totalSpent;

  return (
    <li className="bg-surface rounded-3xl shadow-md overflow-hidden transition-shadow hover:shadow-lg">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-xl text-on-surface">{trip.name}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{trip.countries.join(', ')}</p>
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full text-on-surface-variant hover:bg-on-surface/10 active:scale-90 transition-transform">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-inverse-surface rounded-xl shadow-lg z-10 py-1">
                <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-inverse-on-surface hover:bg-on-surface/10">
                  <span className="material-symbols-outlined text-base">edit</span>
                  <span>Modifica</span>
                </button>
                <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20">
                  <span className="material-symbols-outlined text-base">delete</span>
                  <span>Elimina</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
            <div className="flex justify-between items-center text-sm text-on-surface-variant mb-1">
                <span>Speso</span>
                <span>Rimanente</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-2.5">
                <div 
                    className="h-2.5 rounded-full transition-all duration-500" 
                    style={{ 
                        width: `${Math.min(spentPercentage, 100)}%`,
                        backgroundColor: trip.color || 'var(--color-primary)'
                    }}
                />
            </div>
            <div className="flex justify-between items-center text-sm font-semibold text-on-surface mt-1">
                <span>{formatCurrency(totalSpent, trip.mainCurrency)}</span>
                <span className={remainingBudget < 0 ? 'text-error' : ''}>{formatCurrency(remainingBudget, trip.mainCurrency)}</span>
            </div>
        </div>
      </div>
    </li>
  );
};


const TripManager: React.FC<TripManagerProps> = ({ onClose }) => {
    const { data, deleteTrip } = useData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

    const sortedTrips = useMemo(() => {
        if (!data?.trips) return [];
        return [...data.trips].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [data?.trips]);

    const openNewTripForm = () => {
        triggerHapticFeedback();
        setEditingTrip(null);
        setIsFormOpen(true);
    };

    const openEditTripForm = (trip: Trip) => {
        setEditingTrip(trip);
        setIsFormOpen(true);
    };

    const handleDeleteTrip = (tripId: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questo viaggio e tutte le sue spese? L'azione è irreversibile.")) {
            deleteTrip(tripId);
        }
    }

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
            <header className="flex items-center p-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">I Miei Viaggi</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {sortedTrips.length > 0 ? (
                    <ul className="space-y-4 max-w-2xl mx-auto pb-28">
                        {sortedTrips.map(trip => (
                            <TripCard
                                key={trip.id}
                                trip={trip}
                                onEdit={() => openEditTripForm(trip)}
                                onDelete={() => handleDeleteTrip(trip.id)}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-16 px-6 mt-10 max-w-2xl mx-auto flex flex-col items-center">
                        <div className="w-24 h-24 flex items-center justify-center bg-primary-container rounded-full mb-6">
                            <span className="material-symbols-outlined text-5xl text-on-primary-container opacity-70">travel_explore</span>
                        </div>
                        <h2 className="text-2xl font-bold text-on-surface">Nessun viaggio ancora</h2>
                        <p className="mt-2 text-on-surface-variant max-w-sm">Crea il tuo primo viaggio per iniziare a tracciare le tue avventure e le tue spese.</p>
                        <button 
                            onClick={openNewTripForm}
                            className="mt-8 px-6 py-3 bg-primary text-on-primary font-semibold rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95"
                        >
                            Crea il Tuo Primo Viaggio
                        </button>
                    </div>
                )}
            </main>

            {sortedTrips.length > 0 && (
                <button
                    onClick={openNewTripForm}
                    className="fixed bottom-8 right-6 h-16 w-16 bg-trip-primary text-trip-on-primary rounded-2xl shadow-lg hover:shadow-xl transition-transform active:scale-90 z-30"
                    aria-label="Aggiungi nuovo viaggio"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            )}

            {isFormOpen && (
                <Suspense fallback={<div/>}>
                    <TripForm 
                      trip={editingTrip || undefined}
                      onClose={() => setIsFormOpen(false)} 
                    />
                </Suspense>
            )}
        </div>
    );
};

export default TripManager;