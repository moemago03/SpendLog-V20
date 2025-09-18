import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';

const SummaryHeader: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { convert } = useCurrencyConverter();

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const spentToday = useMemo(() => {
        const today = new Date();
        return (trip.expenses || [])
            .filter(exp => isSameDay(new Date(exp.date), today))
            .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
    }, [trip.expenses, trip.mainCurrency, convert]);

    const { dailyBudget, remainingBudget } = useMemo(() => {
        const totalSpent = (trip.expenses || []).reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        const remaining = trip.totalBudget - totalSpent;

        const tripStart = new Date(trip.startDate);
        const tripEnd = new Date(trip.endDate);
        const durationDays = Math.max(1, (tripEnd.getTime() - tripStart.getTime()) / (1000 * 3600 * 24) + 1);
        const budgetPerDay = trip.totalBudget > 0 && durationDays > 0 ? trip.totalBudget / durationDays : 0;
        
        return {
            dailyBudget: budgetPerDay,
            remainingBudget: remaining,
        };
    }, [trip.totalBudget, trip.startDate, trip.endDate, trip.expenses, trip.mainCurrency, convert]);

    const formatRoundedCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: trip.mainCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round(amount));
    };

    return (
        <div 
            className="relative overflow-hidden text-center rounded-3xl p-6 flex flex-col items-center justify-center min-h-[240px] shadow-lg"
            style={{ 
                backgroundColor: trip.color || 'var(--color-primary)',
                color: 'var(--trip-on-primary)'
            }}
        >
            <div className="relative z-10 w-full space-y-4">
                <div>
                    <p className="text-sm uppercase tracking-wider opacity-80">Speso Oggi</p>
                    <p className="text-6xl font-bold tracking-tighter">
                         {formatRoundedCurrency(spentToday)}
                    </p>
                </div>
                
                <div className="flex justify-center gap-8 w-full pt-2">
                    <div>
                        <p className="text-xs uppercase tracking-wider opacity-80">Budget Diario</p>
                        <p className="font-semibold">{formatRoundedCurrency(dailyBudget)}</p>
                    </div>
                     <div>
                        <p className="text-xs uppercase tracking-wider opacity-80">Rimanente</p>
                        <p className={`font-semibold ${remainingBudget < 0 ? 'opacity-90' : ''}`}>{formatRoundedCurrency(remainingBudget)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryHeader;