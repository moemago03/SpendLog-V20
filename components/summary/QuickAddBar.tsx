import React from 'react';
import { Trip, Expense, FrequentExpense } from '../../types';
import { useData } from '../../context/DataContext';

interface QuickAddBarProps {
    trip: Trip;
    onEditExpense: (expense: Partial<Expense> & { checklistItemId?: string } | null) => void;
}

const FrequentExpenseButton: React.FC<{
    frequentExpense: FrequentExpense;
    onClick: () => void;
}> = ({ frequentExpense, onClick }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1.5 w-20 text-center flex-shrink-0"
    >
        <div className="w-12 h-12 bg-surface-variant rounded-2xl flex items-center justify-center text-2xl transition-transform active:scale-90">
            {frequentExpense.icon}
        </div>
        <p className="text-xs font-medium text-on-surface-variant truncate w-full">{frequentExpense.name}</p>
    </button>
);

const AddMoreButton: React.FC<{ onClick: () => void; }> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1.5 w-20 text-center flex-shrink-0"
    >
        <div className="w-12 h-12 border-2 border-dashed border-outline/50 rounded-2xl flex items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-variant">
            <span className="material-symbols-outlined">add</span>
        </div>
        <p className="text-xs font-medium text-on-surface-variant">Altro</p>
    </button>
);


const QuickAddBar: React.FC<QuickAddBarProps> = ({ trip, onEditExpense }) => {
    const { addExpense } = useData();
    const frequentExpenses = trip.frequentExpenses || [];

    const handleFrequentExpenseAdd = (fe: FrequentExpense) => {
        const newExpense: Omit<Expense, 'id' | 'createdAt'> = {
            amount: fe.amount,
            currency: trip.mainCurrency, // Frequent expenses are in main currency
            category: fe.category,
            description: fe.name,
            date: new Date().toISOString(),
            paidById: fe.paidById,
            splitBetweenMemberIds: fe.splitBetweenMemberIds,
            splitType: 'equally',
        };
        addExpense(trip.id, newExpense);
    };

    const handleAddMore = () => {
        // Opens the full expense form via the onEditExpense prop with a null/empty object
        onEditExpense({});
    };

    if (frequentExpenses.length === 0) {
        return null; // Don't show the bar if there are no frequent expenses defined.
    }

    return (
        <div>
            <h2 className="text-lg font-bold text-on-surface mb-3 px-1">Aggiungi al volo</h2>
            <div className="flex items-start gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {frequentExpenses.map(fe => (
                    <FrequentExpenseButton 
                        key={fe.id} 
                        frequentExpense={fe} 
                        onClick={() => handleFrequentExpenseAdd(fe)}
                    />
                ))}
                <AddMoreButton onClick={handleAddMore} />
            </div>
             <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default QuickAddBar;
