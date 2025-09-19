import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Trip, ExploreCity } from '../../types';
import { EXPLORE_CITY_DATA } from '../../constants';
import CityCard from './CityCard';
import TravelInfo from '../checklist/TravelInfo';

const CityDetailModal = lazy(() => import('./CityDetailModal'));

interface ExploreViewProps {
    trip: Trip;
}

const ExploreView: React.FC<ExploreViewProps> = ({ trip }) => {
    const [selectedCity, setSelectedCity] = useState<ExploreCity | null>(null);

    const availableCities = useMemo(() => {
        const tripCountries = new Set(trip.countries);
        return Object.values(EXPLORE_CITY_DATA).filter(city => tripCountries.has(city.country));
    }, [trip.countries]);

    return (
        <>
            <div className="p-4 pb-28 max-w-4xl mx-auto space-y-6">
                <header className="pt-8 pb-4">
                    <h1 className="text-4xl font-bold text-on-background">Lasciati ispirare!</h1>
                    <p className="text-on-surface-variant mt-1">Scopri i posti più popolari per avventure indimenticabili.</p>
                </header>

                {availableCities.length > 0 ? (
                     <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                        {availableCities.map(city => (
                            <CityCard 
                                key={city.name}
                                city={city}
                                onClick={() => setSelectedCity(city)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 px-6 bg-surface-variant/50 rounded-3xl mt-8">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">travel_explore</span>
                        <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessuna guida trovata</h2>
                        <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">
                            Non abbiamo ancora guide per i paesi selezionati in questo viaggio.
                        </p>
                    </div>
                )}

                <TravelInfo countries={trip.countries || []} />
            </div>

            {selectedCity && (
                <Suspense fallback={<div/>}>
                    <CityDetailModal
                        city={selectedCity}
                        onClose={() => setSelectedCity(null)}
                    />
                </Suspense>
            )}
        </>
    );
};

export default ExploreView;