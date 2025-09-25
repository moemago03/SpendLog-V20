import React, { useState, useEffect, useMemo } from 'react';
import { Country } from './CreateTripFlow';

interface SelectCountriesScreenProps {
    initialSelectedCountries: Country[];
    onDone: (selected: Country[]) => void;
    onClose: () => void;
}

const SelectCountriesScreen: React.FC<SelectCountriesScreenProps> = ({ initialSelectedCountries, onDone, onClose }) => {
    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<Country[]>(initialSelectedCountries);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('/data/countries.json');
                if (!response.ok) throw new Error('Failed to load countries');
                const data: Country[] = await response.json();
                setAllCountries(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    const filteredCountries = useMemo(() => {
        if (!searchTerm) return allCountries;
        const lowercasedFilter = searchTerm.toLowerCase();
        return allCountries.filter(c => c.name.toLowerCase().includes(lowercasedFilter));
    }, [allCountries, searchTerm]);
    
    const isSelected = (country: Country) => {
        return selected.some(s => s.code === country.code);
    };

    const handleToggleCountry = (country: Country) => {
        if (isSelected(country)) {
            setSelected(prev => prev.filter(s => s.code !== country.code));
        } else {
            setSelected(prev => [...prev, country]);
        }
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
            <header className="flex items-center justify-between p-4 flex-shrink-0 border-b border-surface-variant">
                 <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold">Seleziona Paesi</h1>
                <button onClick={() => onDone(selected)} className="font-semibold text-primary px-3 py-1">
                    Fatto
                </button>
            </header>

            <div className="p-4 flex-shrink-0">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
                    <input
                        type="text"
                        placeholder="Cerca paesi..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-surface-variant border-transparent rounded-full py-3 pl-12 pr-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center p-8">Caricamento...</div>
                ) : (
                    <ul className="divide-y divide-surface-variant">
                        {filteredCountries.map(country => (
                            <li key={country.code} onClick={() => handleToggleCountry(country)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-variant">
                                <div className="flex items-center gap-4">
                                    <img src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`} alt={country.name} className="w-8 h-auto rounded-md" />
                                    <span className="font-medium text-on-surface">{country.name}</span>
                                </div>
                                {isSelected(country) && (
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white text-sm">check</span>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
};

export default SelectCountriesScreen;
