import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import { useItinerary } from '../../context/ItineraryContext';
import { ADJUSTMENT_CATEGORY } from '../../constants';

const BudgetProgress: React.FC<{ trip: Trip }> = ({ trip }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    const { getEventsByTrip } = useItinerary();

    const {
        totalSpent,
        totalPlanned,
        freeToSpend,
        spentPercentage,
        plannedPercentage,
    } = useMemo(() => {
        const spent = (trip.expenses || [])
            .filter(exp => exp.category !== ADJUSTMENT_CATEGORY)
            .reduce((sum, exp) => {
            // Le entrate sono negative, quindi sommarle le sottrae correttamente
            return sum + convert(exp.amount, exp.currency, trip.mainCurrency);
        }, 0);

        const allEvents = getEventsByTrip(trip.id);
        const planned = allEvents.reduce((sum, event) => {
            if (event.estimatedCost?.amount && event.estimatedCost.amount > 0) {
                return sum + convert(event.estimatedCost.amount, event.estimatedCost.currency, trip.mainCurrency);
            }
            return sum;
        }, 0);

        const available = trip.totalBudget - spent - planned;
        
        const sPercentage = trip.totalBudget > 0 ? (spent / trip.totalBudget) * 100 : 0;
        const pPercentage = trip.totalBudget > 0 ? (planned / trip.totalBudget) * 100 : 0;
        
        return {
            totalSpent: spent,
            totalPlanned: planned,
            freeToSpend: available,
            spentPercentage: sPercentage,
            plannedPercentage: pPercentage,
        };
    }, [trip, getEventsByTrip, convert]);

    return (
        <div className="bg-surface p-6 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center mb-1">
                <p className="font-semibold text-on-surface">Budget Disponibile</p>
                <p className="text-xl font-bold text-on-surface">
                    {formatCurrency(freeToSpend, trip.mainCurrency)}
                </p>
            </div>
             <p className="text-xs text-on-surface-variant mb-3">
               Su {formatCurrency(trip.totalBudget, trip.mainCurrency)} totali
            </p>

            {/* Stacked Progress Bar */}
            <div className="w-full bg-surface-variant rounded-full h-3 flex overflow-hidden">
                <div
                    className="transition-all duration-500"
                    style={{ 
                        width: `${Math.min(spentPercentage, 100)}%`,
                        backgroundColor: trip.color || 'var(--color-primary)' 
                    }}
                    title={`Speso: ${formatCurrency(totalSpent, trip.mainCurrency)}`}
                />
                <div
                    className="transition-all duration-500 opacity-60"
                    style={{ 
                        width: `${Math.min(plannedPercentage, 100 - spentPercentage)}%`,
                        backgroundColor: trip.color || 'var(--color-primary)' 
                    }}
                    title={`Pianificato: ${formatCurrency(totalPlanned, trip.mainCurrency)}`}
                />
            </div>

            {/* Legend */}
            <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: trip.color || 'var(--color-primary)' }}></div>
                    <div>
                        <p className="text-on-surface-variant">Speso</p>
                        <p className="font-semibold text-on-surface">{formatCurrency(totalSpent, trip.mainCurrency)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full opacity-60" style={{ backgroundColor: trip.color || 'var(--color-primary)' }}></div>
                     <div>
                        <p className="text-on-surface-variant">Pianificato</p>
                        <p className="font-semibold text-on-surface">{formatCurrency(totalPlanned, trip.mainCurrency)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-surface-variant border-2 border-outline/30"></div>
                     <div>
                        <p className="text-on-surface-variant">Disponibile</p>
                        <p className="font-semibold text-on-surface">{formatCurrency(freeToSpend, trip.mainCurrency)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetProgress;