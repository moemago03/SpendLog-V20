import React, { useMemo } from 'react';
import { Trip, Expense, Category } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import MultiPointMapView from '../MultiPointMapView'; // Reusing the component from itinerary

interface ExpenseMapViewProps {
    expenses: Expense[];
    trip: Trip;
    allCategories: Category[];
}

const ExpenseMapView: React.FC<ExpenseMapViewProps> = ({ expenses, trip, allCategories }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    
    const expensesWithLocation = useMemo(() => {
        return expenses.filter(exp => exp.location && exp.location.trim() !== '');
    }, [expenses]);
    
    const locations = useMemo(() => {
        return expensesWithLocation.map(exp => exp.location!);
    }, [expensesWithLocation]);

    if (expensesWithLocation.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-surface-variant/50 rounded-3xl mt-8">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">location_off</span>
                <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessuna spesa da mappare</h2>
                <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">
                    Aggiungi una posizione alle tue spese (manualmente o collegandole a un evento) per vederle qui.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="h-80 md:h-96 w-full rounded-3xl bg-surface-variant flex items-center justify-center overflow-hidden shadow-sm">
                <MultiPointMapView locations={locations} />
            </div>
            
            <div className="bg-surface p-2 rounded-3xl shadow-sm">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                    {expensesWithLocation.map(exp => {
                        const category = allCategories.find(c => c.name === exp.category);
                        return (
                            <div key={exp.id} className="flex justify-between items-center p-3 rounded-2xl hover:bg-surface-variant">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{backgroundColor: category?.color || '#ccc', color: 'white'}}>
                                        {category?.icon || '💸'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-on-surface truncate">{exp.description || exp.category}</p>
                                        <p className="text-xs text-on-surface-variant truncate">{exp.location}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                    <p className="font-medium text-on-surface">{formatCurrency(exp.amount, exp.currency)}</p>
                                    {exp.currency !== trip.mainCurrency && <p className="text-xs text-on-surface-variant">{`≈ ${formatCurrency(convert(exp.amount, exp.currency, trip.mainCurrency), trip.mainCurrency)}`}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ExpenseMapView;