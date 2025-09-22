import React, { useState } from 'react';
import { Category } from '../types';

export interface Filters {
    startDate: string;
    endDate: string;
    categories: string[];
}

interface AdvancedFilterPanelProps {
    onClose: () => void;
    onApply: (filters: Filters) => void;
    currentFilters: Filters;
    allCategories: Category[];
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({ onClose, onApply, currentFilters, allCategories }) => {
    const [filters, setFilters] = useState<Filters>(currentFilters);

    const handleCategoryToggle = (categoryName: string) => {
        const newCategories = filters.categories.includes(categoryName)
            ? filters.categories.filter(c => c !== categoryName)
            : [...filters.categories, categoryName];
        setFilters(prev => ({ ...prev, categories: newCategories }));
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };
    
    const handleReset = () => {
        const defaultFilters = { startDate: '', endDate: '', categories: [] };
        setFilters(defaultFilters);
        onApply(defaultFilters);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} aria-hidden="true"></div>
            <div
                className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="filter-panel-title"
            >
                <header className="flex justify-between items-center p-4 border-b border-surface-variant flex-shrink-0">
                    <h2 id="filter-panel-title" className="text-xl font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">filter_list</span>
                        Filtri Spese
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant" aria-label="Chiudi">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <main className="overflow-y-auto p-6 flex-1 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Periodo</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none"
                            />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full bg-surface-variant text-on-surface p-3 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-2">Categorie</label>
                        <div className="flex flex-wrap gap-2">
                            {allCategories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryToggle(category.name)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        filters.categories.includes(category.name)
                                            ? 'bg-primary-container text-on-primary-container'
                                            : 'bg-surface-variant text-on-surface-variant'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 border-t border-surface-variant flex-shrink-0 flex gap-4 mt-auto">
                    <button
                        onClick={handleReset}
                        className="flex-1 bg-surface-variant text-on-surface-variant font-bold py-3 rounded-2xl"
                    >
                        Resetta
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-2xl"
                    >
                        Applica Filtri
                    </button>
                </footer>
            </div>
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-\\[slide-up_0\\.3s_ease-out\\] {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default AdvancedFilterPanel;