import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';

const BudgetProgress: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const { remainingBudget, spentPercentage } = useMemo(() => {
        const totalSpent = (trip.expenses || []).reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        const remaining = trip.totalBudget - totalSpent;
        const percentage = trip.totalBudget > 0 ? (totalSpent / trip.totalBudget) * 100 : 0;
        
        return {
            remainingBudget: remaining,
            spentPercentage: percentage,
        };
    }, [trip.expenses, trip.totalBudget, trip.mainCurrency, convert]);

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-on-surface">Budget</p>
                <p className="text-sm font-semibold text-on-surface">
                    {formatCurrency(remainingBudget, trip.mainCurrency)} 
                    <span className="font-normal text-on-surface-variant"> rimanenti</span>
                </p>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-2 relative overflow-hidden">
                <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                        width: `${Math.min(spentPercentage, 100)}%`,
                        backgroundColor: trip.color || 'var(--color-primary)' 
                    }}
                />
            </div>
        </div>
    );
};

export default BudgetProgress;