import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Trip, FrequentExpense } from '../types';
import FrequentExpenseForm from './FrequentExpenseForm';

interface FrequentExpenseManagerProps {
    activeTrip: Trip;
    onClose: () => void;
}

const FrequentExpenseGridItem: React.FC<{
    expense: FrequentExpense;
    onClick: () => void;
}> = ({ expense, onClick }) => (
    <div className="flex flex-col items-center gap-2 text-center cursor-pointer" onClick={onClick}>
        <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-secondary-container"
        >
            {expense.icon}
        </div>
        <p className="text-sm text-on-surface-variant w-full truncate">{expense.name}</p>
    </div>
);

const CreateItem: React.FC<{ onClick: () => void; }> = ({ onClick }) => (
     <div className="flex flex-col items-center gap-2 text-center cursor-pointer" onClick={onClick}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-variant">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">add</span>
        </div>
        <p className="text-sm text-on-surface-variant font-medium">Crea</p>
    </div>
);


const FrequentExpenseManager: React.FC<FrequentExpenseManagerProps> = ({ activeTrip, onClose }) => {
    const { updateTrip } = useData();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingExpense, setEditingExpense] = useState<FrequentExpense | null>(null);

    const frequentExpenses = activeTrip.frequentExpenses || [];
    
    const handleCreate = () => {
        setEditingExpense(null);
        setView('form');
    };
    
    const handleEdit = (expense: FrequentExpense) => {
        setEditingExpense(expense);
        setView('form');
    };

    const handleSave = (expenseData: Omit<FrequentExpense, 'id'>) => {
        let updatedFrequentExpenses: FrequentExpense[];
        
        if (editingExpense) {
            // Update existing
            updatedFrequentExpenses = frequentExpenses.map(fe => 
                fe.id === editingExpense.id ? { ...editingExpense, ...expenseData } : fe
            );
        } else {
            // Add new
            const newFrequentExpense: FrequentExpense = { 
                ...expenseData, 
                id: `freq-${Date.now().toString()}` 
            };
            updatedFrequentExpenses = [...frequentExpenses, newFrequentExpense];
        }

        const updatedTrip = { ...activeTrip, frequentExpenses: updatedFrequentExpenses };
        updateTrip(updatedTrip);
        
        setView('list');
        setEditingExpense(null);
    };

    const handleDelete = () => {
        if (!editingExpense || !window.confirm("Sei sicuro di voler eliminare questa spesa frequente?")) {
            return;
        }
        
        const updatedFrequentExpenses = frequentExpenses.filter(fe => fe.id !== editingExpense.id);
        const updatedTrip = { ...activeTrip, frequentExpenses: updatedFrequentExpenses };
        updateTrip(updatedTrip);

        setView('list');
        setEditingExpense(null);
    };

    return (
        <div className="fixed inset-0 bg-background z-50">
            {view === 'list' && (
                <div className="h-full flex flex-col">
                    <header className="flex items-center p-4">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                             <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold ml-4">Spese Frequenti</h1>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-4 gap-y-6">
                            <CreateItem onClick={handleCreate} />
                            {frequentExpenses.map(exp => (
                                <FrequentExpenseGridItem key={exp.id} expense={exp} onClick={() => handleEdit(exp)} />
                            ))}
                        </div>
                    </main>
                </div>
            )}
            {view === 'form' && (
                <FrequentExpenseForm
                    expense={editingExpense || undefined}
                    onSave={handleSave}
                    onClose={() => setView('list')}
                    onDelete={editingExpense ? handleDelete : undefined}
                />
            )}
        </div>
    );
};

export default FrequentExpenseManager;