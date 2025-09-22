import React, { useState, useEffect } from 'react';
import { Trip, Category } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';

const CategoryPickerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (categoryName: string) => void;
    allCategories: Category[];
    selectedCategory: string;
}> = ({ isOpen, onClose, onSelect, allCategories, selectedCategory }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">Seleziona Categoria</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {allCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.name)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors ${selectedCategory === cat.name ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant'}`}
                        >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: cat.color }}>
                                {cat.icon}
                            </div>
                            <p className="text-xs font-semibold w-full truncate">{cat.name}</p>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
};


interface QuickAddBarProps {
    trip: Trip;
    topCategories: Category[];
    allCategories: Category[];
    onAddDetailed: () => void;
}

const QuickAddBar: React.FC<QuickAddBarProps> = ({ trip, topCategories, allCategories, onAddDetailed }) => {
    const { addExpense } = useData();
    const { addNotification } = useNotification();

    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>(topCategories[0]?.name || allCategories[0]?.name || '');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    useEffect(() => {
        // If topCategories change, and the currently selected category is not in the new top list,
        // reset to the first top category. This prevents stale selections.
        if (topCategories.length > 0 && !topCategories.some(c => c.name === selectedCategory)) {
            setSelectedCategory(topCategories[0].name);
        } else if (topCategories.length === 0 && allCategories.length > 0) {
            setSelectedCategory(allCategories[0].name);
        }
    }, [topCategories, allCategories, selectedCategory]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/,/, '.');
        // Allow only numbers and a single dot
        if (/^\d*\.?\d*$/.test(value)) {
            setAmount(value);
        }
    };
    
    const handleAdd = () => {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
            addNotification("Inserisci un importo valido.", 'error');
            return;
        }
        if (!selectedCategory) {
            addNotification("Seleziona una categoria.", 'error');
            return;
        }

        const firstMemberId = trip.members && trip.members.length > 0 ? trip.members[0].id : 'user-self';

        addExpense(trip.id, {
            amount: numericAmount,
            currency: trip.mainCurrency,
            category: selectedCategory,
            date: new Date().toISOString(),
            // Set default split options for a simple expense
            paidById: firstMemberId,
            splitType: 'equally',
            splitBetweenMemberIds: [firstMemberId],
        });

        // Reset for next entry
        setAmount('');
        addNotification("Spesa aggiunta rapidamente!", 'success');
    };

    const handleCategorySelect = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setIsCategoryModalOpen(false);
    };

    return (
        <>
            <div className="bg-surface p-4 rounded-3xl shadow-sm space-y-4">
                <h2 className="text-xl font-semibold text-on-surface">Aggiunta Rapida</h2>

                <div className="flex items-center gap-2 bg-surface-variant rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary">
                    <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className="w-full bg-transparent text-3xl font-bold text-on-surface focus:outline-none placeholder:text-on-surface-variant/50 p-2"
                    />
                    <span className="font-semibold text-on-surface-variant pr-2">{trip.mainCurrency}</span>
                </div>

                <div>
                    <p className="text-sm font-medium text-on-surface-variant mb-2 ml-1">Categoria</p>
                    <div className="flex items-center gap-2">
                        {topCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors ${selectedCategory === cat.name ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant'}`}
                            >
                                <span className="text-2xl">{cat.icon}</span>
                                <span className="text-xs font-semibold truncate w-full">{cat.name}</span>
                            </button>
                        ))}
                         <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl bg-surface-variant"
                        >
                            <span className="material-symbols-outlined text-2xl">more_horiz</span>
                            <span className="text-xs font-semibold">Tutte</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button onClick={onAddDetailed} className="text-sm font-semibold text-primary py-3 px-4 rounded-full hover:bg-primary-container/30">
                        Più opzioni
                    </button>
                    <button onClick={handleAdd} disabled={!amount || !selectedCategory} className="flex-1 bg-trip-primary text-trip-on-primary font-bold py-3 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                         <span className="material-symbols-outlined">add</span>
                         Aggiungi
                    </button>
                </div>
            </div>

            <CategoryPickerModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSelect={handleCategorySelect}
                allCategories={allCategories}
                selectedCategory={selectedCategory}
            />
        </>
    );
};

export default QuickAddBar;
