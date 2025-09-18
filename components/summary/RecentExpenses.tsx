import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Trip, Expense, Category } from '../../types';
import ExpenseList from '../ExpenseList';

const AdvancedFilterPanel = lazy(() => import('../AdvancedFilterPanel'));

interface RecentExpensesProps {
    trip: Trip;
    allCategories: Category[];
    onEditExpense: (expense: Expense) => void;
}

interface Filters {
    startDate: string;
    endDate: string;
    categories: string[];
}

const RecentExpenses: React.FC<RecentExpensesProps> = ({ trip, allCategories, onEditExpense }) => {
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<'today' | '3days' | '7days' | 'all'>('all');

    const [filters, setFilters] = useState<Filters>({
        startDate: '',
        endDate: '',
        categories: [],
    });

    const expenses = useMemo(() => {
        // Sort by date (most recent day first), then by creation timestamp (most recent entry first).
        return [...(trip.expenses || [])].sort((a, b) => {
            const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateComparison !== 0) {
                return dateComparison;
            }
            // If dates are identical, sort by creation timestamp (newest first)
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    }, [trip.expenses]);

    const filteredExpenses = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        
        const isSameDay = (d1: Date, d2: Date) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            let matchesTime = false;

            if (timeFilter === 'all') {
                matchesTime = true;
            } else if (timeFilter === 'today') {
                matchesTime = isSameDay(expenseDate, new Date());
            } else {
                const daysDiff = (now.getTime() - expenseDate.getTime()) / (1000 * 3600 * 24);
                if (timeFilter === '3days') matchesTime = daysDiff < 3;
                else if (timeFilter === '7days') matchesTime = daysDiff < 7;
            }
            if (!matchesTime) return false;

            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' || 
                expense.category.toLowerCase().includes(lowerSearchTerm) ||
                expense.amount.toString().replace('.',',').includes(lowerSearchTerm) ||
                expense.currency.toLowerCase().includes(lowerSearchTerm);
            if (!matchesSearch) return false;
            
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            if (startDate) {
                startDate.setHours(0, 0, 0, 0);
                if (expenseDate < startDate) return false;
            }
            if (endDate) {
                endDate.setHours(23, 59, 59, 999);
                if (expenseDate > endDate) return false;
            }
            if (filters.categories.length > 0 && !filters.categories.includes(expense.category)) {
                return false;
            }
            
            return true;
        });
    }, [expenses, filters, searchTerm, timeFilter]);

    const handleApplyFilters = (newFilters: Filters) => {
        setFilters(newFilters);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Spese Recenti</h2>
                <div className="relative">
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as 'today' | '3days' | '7days' | 'all')}
                        className="bg-surface-variant text-on-surface-variant text-sm font-medium rounded-lg py-1.5 pl-3 pr-8 border-transparent focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                        aria-label="Filtra per periodo"
                    >
                        <option value="today">Oggi</option>
                        <option value="3days">Ultimi 3 giorni</option>
                        <option value="7days">Ultimi 7 giorni</option>
                        <option value="all">Tutte</option>
                    </select>
                    <span className="material-symbols-outlined text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-lg">expand_more</span>
                </div>
            </div>

            <div className="relative">
                 <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
                 <input
                    type="text"
                    placeholder="Cerca per categoria, importo, valuta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-variant border-transparent rounded-full py-3.5 pl-12 pr-12 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-on-surface-variant hover:bg-on-surface/10"
                        aria-label="Cancella ricerca"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            <div className="mt-4">
                <ExpenseList expenses={filteredExpenses} trip={trip} onEditExpense={onEditExpense} />
            </div>

             <Suspense fallback={null}>
                {isFilterPanelOpen && (
                    <AdvancedFilterPanel
                        onClose={() => setIsFilterPanelOpen(false)}
                        onApply={handleApplyFilters}
                        currentFilters={filters}
                        allCategories={allCategories}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default RecentExpenses;