
import React, { useMemo } from 'react';
import { Trip, Expense, Category } from '../../types';
import ExpenseList from '../ExpenseList';

interface RecentExpensesProps {
    trip: Trip;
    allCategories: Category[];
    onEditExpense: (expense: Partial<Expense> | null) => void;
}

const RecentExpenses: React.FC<RecentExpensesProps> = ({ trip, onEditExpense }) => {
    
    const recentExpenses = useMemo(() => {
        if (!trip.expenses) return [];
        // Sort by date (most recent first) and take the top 5
        return [...trip.expenses]
            .sort((a, b) => {
                const dateA = a.createdAt || new Date(a.date).getTime();
                const dateB = b.createdAt || new Date(b.date).getTime();
                return dateB - dateA;
            })
            .slice(0, 5);
    }, [trip.expenses]);

    return (
        <div>
            <div className="flex justify-between items-center mb-3 px-1">
                <h2 className="text-lg font-bold text-on-surface">Spese Recenti</h2>
                {/* This button could navigate to a full list view in a larger app */}
                <button className="text-sm font-semibold text-primary">Vedi tutte</button>
            </div>
            
            {recentExpenses.length > 0 ? (
                <ExpenseList
                    expenses={recentExpenses}
                    trip={trip}
                    onEditExpense={onEditExpense}
                />
            ) : (
                <div className="text-center py-10 px-4 bg-surface-variant rounded-3xl">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">receipt_long</span>
                    <p className="font-semibold text-on-surface-variant">Nessuna spesa ancora</p>
                    <p className="text-sm text-on-surface-variant/80">La tua prima spesa apparirà qui.</p>
                </div>
            )}
        </div>
    );
};

export default RecentExpenses;
