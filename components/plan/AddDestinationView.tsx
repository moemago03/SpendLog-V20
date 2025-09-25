import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Stage } from '../../types';
import { useData } from '../../context/DataContext';
import { COUNTRY_TO_CODE } from '../../constants';

interface PopularDestinationsData {
    [countryCode: string]: {
        countryName: string;
        destinations: { name: string }[];
    };
}

interface AddDestinationViewProps {
    trip: Trip;
    afterStageId: string | null;
    onClose: () => void;
}

const AddDestinationView: React.FC<AddDestinationViewProps> = ({ trip, afterStageId, onClose }) => {
    const { addStage } = useData();
    const [popularDests, setPopularDests] = useState<PopularDestinationsData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDests = async () => {
            try {
                const res = await fetch('/data/popular-destinations.json');
                const data = await res.json();
                setPopularDests(data);
            } catch (error) {
                console.error("Could not load popular destinations", error);
            }
        };
        fetchDests();
    }, []);
    
    const tripCountries = useMemo(() => trip.countries || [], [trip.countries]);

    const destinationsByCountry = useMemo(() => {
        if (!popularDests || tripCountries.length === 0) return [];
        
        return tripCountries.map(countryName => {
            const countryCode = COUNTRY_TO_CODE[countryName];
            if (!countryCode) return null;

            const countryData = popularDests[countryCode.toUpperCase()];
            if (!countryData) return null;

            let destinations = countryData.destinations || [];
            if (searchTerm.trim()) {
                destinations = destinations.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase().trim()));
            }

            if (destinations.length > 0) {
                return {
                    countryName,
                    destinations
                };
            }
            return null;
        }).filter((c): c is { countryName: string; destinations: { name: string }[] } => c !== null);

    }, [popularDests, tripCountries, searchTerm]);

    const handleAddDestination = (name: string, countryName: string) => {
        const newStage: Omit<Stage, 'id' | 'startDate'> = {
            location: `${name}, ${countryName}`,
            nights: 1, // Default to 1 night
            events: [],
        };
        addStage(trip.id, newStage, afterStageId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 border-b border-surface-variant flex-shrink-0">
                 <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <h1 className="text-xl font-bold ml-4">Aggiungi Destinazione</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                 <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
                    <input
                        type="text"
                        placeholder={`Enter name E.g. "Rome"`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-surface-variant border-transparent rounded-full py-3.5 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                
                {destinationsByCountry.length > 0 ? (
                    destinationsByCountry.map(({ countryName, destinations }) => (
                         <div key={countryName}>
                            <h2 className="text-sm font-bold uppercase text-on-surface-variant px-2 py-2">Destinazioni Popolari in {countryName}</h2>
                            <ul className="divide-y divide-surface-variant">
                                {destinations.map((dest, index) => (
                                    <li key={dest.name} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold text-xs">{index + 1}</div>
                                            <p className="font-semibold text-on-surface">{dest.name}</p>
                                        </div>
                                        <button onClick={() => handleAddDestination(dest.name, countryName)} className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary-container/50">
                                            <span className="material-symbols-outlined">add</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 px-4">
                        <p className="font-semibold text-on-surface-variant">Nessuna destinazione trovata.</p>
                        <p className="text-sm text-on-surface-variant/80 mt-1">Prova a modificare la ricerca o i paesi del viaggio.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AddDestinationView;