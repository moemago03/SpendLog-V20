import React, { useMemo, useState } from 'react';
import { Trip, Expense, Category } from '../../types';
import ExpenseList from '../ExpenseList';

interface RecentExpensesProps {
    trip: Trip;
    allCategories: Category[];
    onEditExpense: (expense: Partial<Expense> | null) => void;
}

type TimeFilter = 'today' | 'yesterday' | '7days' | 'all';

const RecentExpenses: React.FC<RecentExpensesProps> = ({ trip, onEditExpense }) => {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    
    const filteredExpenses = useMemo(() => {
        if (!trip.expenses) return [];

        const sorted = [...trip.expenses].sort((a, b) => {
            const dateA = a.createdAt || new Date(a.date).getTime();
            const dateB = b.createdAt || new Date(b.date).getTime();
            return dateB - dateA;
        });
        
        if (timeFilter === 'all') {
            return sorted;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        
        return sorted.filter(exp => {
            const expDate = new Date(exp.date);
            expDate.setHours(0,0,0,0);
            
            switch (timeFilter) {
                case 'today':
                    return expDate.getTime() === today.getTime();
                case 'yesterday':
                    return expDate.getTime() === yesterday.getTime();
                case '7days':
                    return expDate >= sevenDaysAgo && expDate <= today;
                default:
                    return true;
            }
        });

    }, [trip.expenses, timeFilter]);

    return (
        <div>
            <div className="flex justify-between items-center mb-3 px-1">
                <h2 className="text-lg font-bold text-on-surface">Spese</h2>
                <div className="relative">
                     <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                        className="bg-surface-variant text-on-surface-variant text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="all">Tutte</option>
                        <option value="today">Oggi</option>
                        <option value="yesterday">Ieri</option>
                        <option value="7days">Ultimi 7 giorni</option>
                    </select>
                    <span className="material-symbols-outlined text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base">expand_more</span>
                </div>
            </div>
            
            <ExpenseList
                expenses={filteredExpenses}
                trip={trip}
                onEditExpense={onEditExpense}
            />
        </div>
    );
};

export default RecentExpenses;