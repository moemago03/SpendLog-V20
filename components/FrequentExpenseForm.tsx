import React, { useState } from 'react';
import { FrequentExpense } from '../types';
import { useData } from '../context/DataContext';
import { CATEGORY_ICONS } from '../constants';

interface FrequentExpenseFormProps {
    expense?: FrequentExpense;
    onSave: (expenseData: Omit<FrequentExpense, 'id'>) => void;
    onClose: () => void;
    onDelete?: () => void; // Optional delete handler
}

const FrequentExpenseForm: React.FC<FrequentExpenseFormProps> = ({ expense, onSave, onClose, onDelete }) => {
    const { data } = useData();
    const [name, setName] = useState(expense?.name || '');
    const [icon, setIcon] = useState(expense?.icon || CATEGORY_ICONS[0]);
    const [category, setCategory] = useState(expense?.category || data.categories[0]?.name || '');
    const [amount, setAmount] = useState(expense?.amount?.toString() || '');

    const handleSubmit = () => {
        const numericAmount = parseFloat(amount);
        if (!name.trim() || !icon.trim() || !category.trim() || isNaN(numericAmount) || numericAmount <= 0) {
            alert("Per favore, compila tutti i campi. L'importo deve essere valido.");
            return;
        }
        onSave({ name, icon, category, amount: numericAmount });
    };
    
    return (
        <div className="bg-background text-on-background h-full flex flex-col">
            <header className="flex items-center p-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">Spesa frequente</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                 <div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome (es. Caffè)"
                        className="w-full bg-surface-variant text-on-surface text-lg p-4 rounded-2xl border-2 border-transparent focus:border-primary focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Importo</label>
                         <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                            min="0.01"
                            placeholder="0.00"
                            className="w-full bg-surface-variant text-on-surface p-4 rounded-2xl border-2 border-transparent focus:border-primary focus:outline-none"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-1">Categoria</label>
                         <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)} 
                            required 
                            className="w-full bg-surface-variant text-on-surface p-4 rounded-2xl border-2 border-transparent focus:border-primary focus:outline-none appearance-none"
                        >
                            {data.categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-surface-variant p-4 rounded-3xl">
                     <p className="text-sm font-medium text-on-surface-variant mb-3">Seleziona Icona</p>
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                        {CATEGORY_ICONS.map(i => (
                            <button
                                key={i}
                                onClick={() => setIcon(i)}
                                className={`aspect-square rounded-full flex items-center justify-center text-3xl transition-transform transform hover:scale-110 bg-secondary-container ${icon === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-variant' : ''}`}
                                aria-label={`Seleziona icona ${i}`}
                            >
                                {i}
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="p-4 border-t border-surface-variant mt-auto">
                 <div className="flex items-center gap-4">
                    {expense && onDelete && (
                        <button
                            onClick={onDelete}
                            type="button"
                            className="w-16 h-16 flex items-center justify-center bg-error-container text-on-error-container rounded-2xl"
                            aria-label="Elimina spesa frequente"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-on-surface-variant text-surface font-bold py-4 rounded-2xl"
                    >
                        Salva
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default FrequentExpenseForm;