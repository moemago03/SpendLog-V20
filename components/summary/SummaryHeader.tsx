import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';

const SummaryHeader: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();

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

    const spentTodayPercentage = dailyBudget > 0 ? (spentToday / dailyBudget) * 100 : 0;

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
            <div className="flex justify-between items-start mt-12">
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface-variant">Speso Oggi</p>
                    <p className="text-5xl font-bold text-on-surface tracking-tighter leading-tight truncate">
                         {formatCurrency(spentToday, trip.mainCurrency)}
                    </p>
                    <div className="w-full bg-surface-variant rounded-full h-2 mt-2">
                        <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                                width: `${Math.min(spentTodayPercentage, 100)}%`,
                                backgroundColor: spentToday > dailyBudget ? 'var(--color-error)' : (trip.color || 'var(--color-primary)')
                            }}
                        />
                    </div>
                </div>
                
                <div className="text-right space-y-2 ml-4 flex-shrink-0">
                    <div>
                        <p className="text-sm text-on-surface-variant">Budget Oggi</p>
                        <p className="font-semibold text-on-surface">{formatCurrency(dailyBudget, trip.mainCurrency)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-on-surface-variant">Rimanente Viaggio</p>
                        <p className={`font-semibold ${remainingBudget < 0 ? 'text-error' : 'text-on-surface'}`}>{formatCurrency(remainingBudget, trip.mainCurrency)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryHeader;