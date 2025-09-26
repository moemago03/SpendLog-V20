import React, { useState } from 'react';
import { useAccommodationFilters, AccommodationFilters } from '../../hooks/useAccommodationFilters';

interface AccommodationFiltersModalProps {
    onClose: () => void;
}

const PROPERTY_TYPES = [
    { id: '204', name: 'Hotel' }, { id: '201', name: 'Appartamenti' },
    { id: '203', name: 'Ostelli' }, { id: '208', name: 'Affittacamere' },
    { id: '206', name: 'B&B' }, { id: '213', name: 'Case vacanza' },
    { id: '215', name: 'Aparthotel' }, { id: '220', name: 'Ville' },
    { id: '216', name: 'Resort' }, { id: '222', name: 'Chalet' },
];

const REVIEW_SCORES = [
    { value: 90, label: 'Eccellente 9+' }, { value: 80, label: 'Ottimo 8+' }, { value: 70, label: 'Buono 7+' }
];

const DISTANCES = [
    { value: 1000, label: '< 1 km' }, { value: 3000, label: '< 3 km' }, { value: 5000, label: '< 5 km' }
];

const FilterButton: React.FC<{ label: string; value: any; selected: boolean; onClick: () => void }> = ({ label, value, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${selected ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}
    >
        {label}
    </button>
);

const AccommodationFiltersModal: React.FC<AccommodationFiltersModalProps> = ({ onClose }) => {
    const { filters: currentFilters, saveFilters, resetFilters } = useAccommodationFilters();
    const [localFilters, setLocalFilters] = useState<AccommodationFilters>(currentFilters);

    const handlePropertyTypeToggle = (id: string) => {
        setLocalFilters(prev => ({
            ...prev,
            propertyTypes: prev.propertyTypes.includes(id)
                ? prev.propertyTypes.filter(pId => pId !== id)
                : [...prev.propertyTypes, id]
        }));
    };

    const handleSave = () => {
        saveFilters(localFilters);
        onClose();
    };
    
    const handleReset = () => {
        setLocalFilters({
            propertyTypes: [],
            reviewScore: null,
            distance: null,
            entirePlace: false,
        });
    }

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant"><span className="material-symbols-outlined">close</span></button>
                <h1 className="text-xl font-bold ml-4">Parametri Alloggio</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <section>
                    <h2 className="font-semibold text-on-surface mb-3">Punteggio recensioni</h2>
                    <div className="flex flex-wrap gap-2">
                        <FilterButton label="Qualsiasi" value={null} selected={!localFilters.reviewScore} onClick={() => setLocalFilters(p => ({ ...p, reviewScore: null }))} />
                        {REVIEW_SCORES.map(score => (
                            <FilterButton key={score.value} label={score.label} value={score.value} selected={localFilters.reviewScore === score.value} onClick={() => setLocalFilters(p => ({ ...p, reviewScore: score.value }))} />
                        ))}
                    </div>
                </section>
                <section>
                    <h2 className="font-semibold text-on-surface mb-3">Distanza dal centro</h2>
                    <div className="flex flex-wrap gap-2">
                         <FilterButton label="Qualsiasi" value={null} selected={!localFilters.distance} onClick={() => setLocalFilters(p => ({ ...p, distance: null }))} />
                        {DISTANCES.map(dist => (
                            <FilterButton key={dist.value} label={dist.label} value={dist.value} selected={localFilters.distance === dist.value} onClick={() => setLocalFilters(p => ({ ...p, distance: dist.value }))} />
                        ))}
                    </div>
                </section>
                <section>
                    <h2 className="font-semibold text-on-surface mb-3">Tipo di struttura</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PROPERTY_TYPES.map(type => (
                            <label key={type.id} className="flex items-center gap-2 p-3 bg-surface-variant rounded-xl cursor-pointer">
                                <input type="checkbox" checked={localFilters.propertyTypes.includes(type.id)} onChange={() => handlePropertyTypeToggle(type.id)} className="h-5 w-5 rounded text-primary focus:ring-primary border-outline" />
                                <span className="font-medium text-sm text-on-surface">{type.name}</span>
                            </label>
                        ))}
                    </div>
                </section>
                <section className="flex justify-between items-center p-4 bg-surface-variant rounded-2xl">
                    <label htmlFor="entire-place" className="font-semibold text-on-surface">Intera struttura</label>
                    <button id="entire-place" role="switch" aria-checked={localFilters.entirePlace} onClick={() => setLocalFilters(p => ({ ...p, entirePlace: !p.entirePlace }))} className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${localFilters.entirePlace ? 'bg-primary' : 'bg-on-surface/20'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${localFilters.entirePlace ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </section>
            </main>
            <footer className="p-4 border-t border-surface-variant mt-auto flex gap-4">
                <button onClick={handleReset} className="flex-1 bg-surface-variant text-on-surface-variant font-bold py-3 rounded-2xl">Resetta</button>
                <button onClick={handleSave} className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-2xl">Salva Filtri</button>
            </footer>
        </div>
    );
};

export default AccommodationFiltersModal;