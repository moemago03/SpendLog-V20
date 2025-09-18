import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';

const BudgetProgress: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const { totalTripSpent, remainingBudget, spentPercentage } = useMemo(() => {
        const totalSpent = (trip.expenses || []).reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        const remaining = trip.totalBudget - totalSpent;
        const percentage = trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0;
        
        return {
            totalTripSpent: totalSpent,
            remainingBudget: remaining,
            spentPercentage: percentage,
        };
    }, [trip.expenses, trip.totalBudget, trip.mainCurrency, convert]);

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-on-surface">Budget Totale</p>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                    <span>Rimanente: {formatCurrency(remainingBudget, trip.mainCurrency)}</span>
                </div>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-2 my-3 relative overflow-hidden">
                <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                        width: `${Math.min(spentPercentage, 100)}%`,
                        backgroundColor: trip.color || 'var(--color-primary)' 
                    }}
                />
            </div>
            <p className="text-sm text-on-surface-variant text-center">
                {formatCurrency(totalTripSpent, trip.mainCurrency)} di {formatCurrency(trip.totalBudget, trip.mainCurrency)}
            </p>
        </div>
    );
};

export default BudgetProgress;
