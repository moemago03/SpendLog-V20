import React from 'react';
import { Trip, Expense, FrequentExpense } from '../../types';
import { useData } from '../../context/DataContext';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';

interface QuickAddBarProps {
    trip: Trip;
    onEditExpense: (expense: Partial<Expense> & { checklistItemId?: string } | null) => void;
}

const FrequentExpenseButton: React.FC<{
    frequentExpense: FrequentExpense;
    onClick: () => void;
    trip: Trip;
}> = ({ frequentExpense, onClick, trip }) => {
    const { formatCurrency } = useCurrencyConverter();
    return (
        <button 
            onClick={onClick}
            className="flex flex-col items-center justify-start gap-1.5 w-20 text-center flex-shrink-0"
        >
            <div className="w-12 h-12 bg-surface-variant rounded-2xl flex items-center justify-center text-2xl transition-transform active:scale-90">
                {frequentExpense.icon}
            </div>
            <p className="text-xs font-medium text-on-surface-variant truncate w-full">{frequentExpense.name}</p>
            <p className="text-[10px] font-bold text-primary -mt-1">{formatCurrency(frequentExpense.amount, trip.mainCurrency)}</p>
        </button>
    );
};


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
    const frequentExpenses = trip.frequentExpenses || [];

    const handleFrequentExpenseClick = (fe: FrequentExpense) => {
        // Pre-fill the expense form instead of adding directly
        const prefilledExpense: Partial<Expense> = {
            amount: fe.amount,
            currency: trip.mainCurrency,
            category: fe.category,
            description: fe.name,
            date: new Date().toISOString(),
            paidById: fe.paidById,
            splitBetweenMemberIds: fe.splitBetweenMemberIds,
            splitType: 'equally',
        };
        onEditExpense(prefilledExpense);
    };

    const handleAddMore = () => {
        onEditExpense({});
    };

    if (frequentExpenses.length === 0) {
        return null; 
    }

    return (
        <div>
            <h2 className="text-lg font-bold text-on-surface mb-3 px-1">Aggiungi al volo</h2>
            <div className="flex items-start gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {frequentExpenses.map(fe => (
                    <FrequentExpenseButton 
                        key={fe.id} 
                        frequentExpense={fe} 
                        onClick={() => handleFrequentExpenseClick(fe)}
                        trip={trip}
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