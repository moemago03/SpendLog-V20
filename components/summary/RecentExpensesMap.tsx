import React, { useMemo } from 'react';
import { Trip } from '../../types';
import MultiPointMapView from '../MultiPointMapView';

interface RecentExpensesMapProps {
    trip: Trip;
}

const RecentExpensesMap: React.FC<RecentExpensesMapProps> = ({ trip }) => {
    const expensesWithLocation = useMemo(() => {
        return (trip.expenses || [])
            .filter(exp => exp.location && exp.location.trim() !== '')
            .slice(0, 15); // Limit to recent 15 for performance
    }, [trip.expenses]);
    
    const locations = useMemo(() => {
        return expensesWithLocation.map(exp => exp.location!);
    }, [expensesWithLocation]);

    if (locations.length === 0) {
        return (
             <div className="p-6 bg-surface rounded-3xl text-center shadow-lg">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">map</span>
                <h3 className="font-semibold text-on-surface-variant">Mappa Spese</h3>
                <p className="text-sm text-on-surface-variant/80 mt-1">Aggiungi una posizione alle tue spese per vederle qui.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-bold text-on-surface mb-3 px-1">Mappa Spese Recenti</h2>
            <div className="h-80 w-full rounded-3xl bg-surface-variant flex items-center justify-center overflow-hidden shadow-lg">
                <MultiPointMapView locations={locations} />
            </div>
        </div>
    );
};

export default RecentExpensesMap;
