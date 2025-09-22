import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Manifest, ManifestCity, Trip } from '../../types';
import LoadingScreen from '../LoadingScreen';
import CityCard from './CityCard';
const ExploreDetailView = lazy(() => import('./CityDetailModal'));

interface ExploreViewProps {
    activeTrip: Trip | null;
}

const ExploreView: React.FC<ExploreViewProps> = ({ activeTrip }) => {
    const [manifest, setManifest] = useState<Manifest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState<ManifestCity | null>(null);

    useEffect(() => {
        const fetchManifest = async () => {
            try {
                const response = await fetch('/data/manifest.json');
                if (!response.ok) {
                    throw new Error('Failed to load travel guides manifest.');
                }
                const data: Manifest = await response.json();
                setManifest(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchManifest();
    }, []);

    const filteredCities = useMemo(() => {
        if (!manifest) return [];
        const lowercasedFilter = searchTerm.toLowerCase();
        return manifest.cities.filter(city => 
            city.name.toLowerCase().includes(lowercasedFilter) ||
            city.country.toLowerCase().includes(lowercasedFilter)
        );
    }, [manifest, searchTerm]);

    if (loading) {
        return <LoadingScreen />;
    }

    if (error) {
        return <div className="p-8 text-center text-error">{error}</div>;
    }

    return (
        <>
            <div className="p-4 pb-28 max-w-6xl mx-auto space-y-6 animate-fade-in">
                <header className="pt-8 pb-4">
                    <h1 className="text-4xl font-bold text-on-background">Esplora Destinazioni</h1>
                    <p className="text-on-surface-variant mt-1">Scopri guide dettagliate per il tuo prossimo viaggio.</p>
                </header>
                
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
                    <input
                        type="text"
                        placeholder="Cerca per città o paese..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface border-2 border-surface-variant rounded-full py-3.5 pl-12 pr-12 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-on-surface-variant hover:bg-on-surface/10"
                            aria-label="Cancella ricerca"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>

                {filteredCities.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCities.map((city, index) => (
                            <div key={city.id} className="animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <CityCard 
                                    city={city}
                                    onClick={() => setSelectedCity(city)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-6 bg-surface-variant/50 rounded-3xl mt-8">
                        <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">location_off</span>
                        <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessun risultato</h2>
                        <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">
                            Nessuna guida trovata per la tua ricerca. Prova con un altro termine.
                        </p>
                    </div>
                )}
            </div>

            {selectedCity && manifest && (
                 <Suspense fallback={<div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50"/>}>
                    <ExploreDetailView
                        cityId={selectedCity.id}
                        countryFileMap={manifest.countryFileMap}
                        activeTrip={activeTrip}
                        onClose={() => setSelectedCity(null)}
                    />
                </Suspense>
            )}
        </>
    );
};

export default ExploreView;