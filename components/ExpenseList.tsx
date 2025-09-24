import React, { useState, useRef, useCallback } from 'react';
import { Trip, Expense } from '../types';
import { useData } from '../context/DataContext';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useVirtualList } from '../hooks/useVirtualList';

interface ExpenseListProps {
    expenses: Expense[];
    trip: Trip;
    // FIX: Changed type to Partial<Expense> to match the parent component's state.
    onEditExpense: (expense: Partial<Expense> | null) => void;
}

const ITEM_HEIGHT = 84; // Altezza totale per slot, inclusa la spaziatura

const ExpenseItem: React.FC<{ 
    expense: Expense; 
    onEdit: () => void; 
    onDelete: () => void; 
    categoryIcon: string; 
    isSelected: boolean;
    onSelect: () => void;
    positionerStyle: React.CSSProperties;
    animationDelay: string;
}> = React.memo(({ expense, onEdit, onDelete, categoryIcon, isSelected, onSelect, positionerStyle, animationDelay }) => {
    const { formatCurrency, convert } = useCurrencyConverter();
    const mainCurrency = 'EUR';
    
    const touchStartX = useRef(0);
    const isSwiping = useRef(false);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartX.current = e.targetTouches[0].clientX;
        isSwiping.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (Math.abs(e.targetTouches[0].clientX - touchStartX.current) > 10) {
            isSwiping.current = true;
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartX.current;
        const swipeThreshold = 50;

        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX < 0 && !isSelected) { onSelect(); } 
            else if (deltaX > 0 && isSelected) { onSelect(); }
        }
    };

    const handleClick = () => {
        if (!isSwiping.current) {
            onSelect();
        }
    };
    
    return (
        <div 
            className="absolute top-0 left-0 w-full"
            style={{...positionerStyle, height: `${ITEM_HEIGHT}px` }}
        >
            <div
                className="p-3 rounded-3xl cursor-pointer transition-all duration-300 overflow-hidden bg-surface-variant animate-slide-in-up"
                style={{ height: `${ITEM_HEIGHT - 12}px`, animationDelay }}
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                aria-selected={isSelected}
            >
                <div className={`flex items-center justify-between w-full transition-transform duration-300 ${isSelected ? '-translate-x-28' : 'translate-x-0'}`}>
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 flex-shrink-0 bg-surface text-2xl rounded-full flex items-center justify-center">
                            {categoryIcon}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-on-surface truncate">{expense.description || expense.category}</p>
                            <div className="flex items-center gap-1.5">
                                <p className="text-xs text-on-surface-variant">{new Date(expense.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</p>
                                {expense.paymentMethod && <p className="text-xs text-on-surface-variant/70">- {expense.paymentMethod}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                        <p className="font-semibold text-on-surface">{formatCurrency(expense.amount, expense.currency)}</p>
                        {expense.currency !== mainCurrency && (
                            <p className="text-xs text-on-surface-variant -mt-0.5">
                                {`≈ ${formatCurrency(convert(expense.amount, expense.currency, mainCurrency), mainCurrency)}`}
                            </p>
                        )}
                    </div>
                </div>

                <div className={`absolute top-0 right-0 h-full flex items-center bg-surface-variant transition-opacity duration-300 ${isSelected ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                        className="flex items-center justify-center h-full w-14 text-on-surface-variant hover:bg-outline/20 transition-colors" 
                        aria-label="Modifica spesa"
                        disabled={!isSelected}
                        tabIndex={isSelected ? 0 : -1}
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                        className="flex items-center justify-center h-full w-14 text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors" 
                        aria-label="Elimina spesa"
                        disabled={!isSelected}
                        tabIndex={isSelected ? 0 : -1}
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
});

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, trip, onEditExpense }) => {
    const { deleteExpense, data: { categories } } = useData();
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    
    const { virtualItems, totalHeight } = useVirtualList({
        itemCount: expenses.length,
        itemHeight: ITEM_HEIGHT,
        containerRef: listContainerRef
    });

    const handleSelectExpense = useCallback((expenseId: string) => {
        setSelectedExpenseId(prevId => (prevId === expenseId ? null : expenseId));
    }, []);

    const handleDelete = useCallback((expenseId: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questa spesa?")) {
            deleteExpense(trip.id, expenseId);
            setSelectedExpenseId(null);
        }
    }, [deleteExpense, trip.id]);

    const getCategoryIcon = (categoryName: string) => {
        return categories.find(c => c.name === categoryName)?.icon || '💸';
    }
    
    return (
        <div ref={listContainerRef}>
            {expenses.length > 0 ? (
                <div style={{ height: `${totalHeight}px` }} className="relative">
                    {virtualItems.map(({ index, style }) => {
                        const expense = expenses[index];
                        if (!expense) return null;
                        return (
                            <ExpenseItem
                                key={expense.id}
                                expense={expense}
                                onEdit={() => onEditExpense(expense)}
                                onDelete={() => handleDelete(expense.id)}
                                categoryIcon={getCategoryIcon(expense.category)}
                                isSelected={selectedExpenseId === expense.id}
                                onSelect={() => handleSelectExpense(expense.id)}
                                positionerStyle={style}
                                animationDelay={`${index * 30}ms`}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 px-4 bg-surface-variant rounded-3xl flex flex-col items-center justify-center h-full">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">receipt_long</span>
                    <p className="font-semibold text-on-surface-variant">Nessuna spesa trovata per questo periodo.</p>
                    <p className="text-sm text-on-surface-variant/80 mt-1">Aggiungi una nuova spesa usando il pulsante `+`!</p>
                </div>
            )}
        </div>
    );
};

export default ExpenseList;
