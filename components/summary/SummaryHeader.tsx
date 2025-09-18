import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';

const SummaryHeader: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

    const { totalTripSpent, remainingBudget, dailyAverage } = useMemo(() => {
        const totalSpent = (trip.expenses || []).reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        const remaining = trip.totalBudget - totalSpent;
        
        const tripStart = new Date(trip.startDate);
        const today = new Date();
        today.setHours(0,0,0,0);

        let daysElapsed = Math.ceil((today.getTime() - tripStart.getTime()) / (1000 * 3600 * 24));
        if (today < tripStart) daysElapsed = 0;
        if (daysElapsed <= 0 && totalSpent > 0) daysElapsed = 1; 
        
        const avg = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
        
        return {
            totalTripSpent: totalSpent,
            remainingBudget: remaining,
            dailyAverage: avg,
        };
    }, [trip.expenses, trip.totalBudget, trip.startDate, trip.mainCurrency, convert]);

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <div 
                className="absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full"
                style={{ 
                    backgroundColor: trip.color || 'var(--color-primary)', 
                    color: 'var(--trip-on-primary)' 
                }}
            >
                {trip.name.toUpperCase()}
            </div>
            <div className="flex justify-between items-center mt-8">
                <div className="flex-1">
                    <p className="text-sm text-on-surface-variant">Spesa Totale</p>
                    <p className="text-5xl font-bold text-on-surface tracking-tighter leading-tight">
                         {new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalTripSpent)}
                    </p>
                </div>
                <div className="text-right space-y-2 ml-4">
                    <div>
                        <p className="text-sm text-on-surface-variant">Rimanente</p>
                        <p className="font-semibold text-on-surface">{formatCurrency(remainingBudget, trip.mainCurrency)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant">Media Giorno</p>
                        <p className="font-semibold text-on-surface">{formatCurrency(dailyAverage, trip.mainCurrency)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryHeader;
