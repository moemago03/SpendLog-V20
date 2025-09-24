import React, { useMemo } from 'react';
import { Trip } from '../../types';
import { TRAVEL_INFO_DATA } from '../../constants';

interface SafetyAlertWidgetProps {
    trip: Trip;
    selectedDate: string; // YYYY-MM-DD
}

const SafetyAlertWidget: React.FC<SafetyAlertWidgetProps> = ({ trip, selectedDate }) => {
    const currentCountry = useMemo(() => {
        const tripStartDate = new Date(trip.startDate.split('T')[0]);
        const currentDate = new Date(selectedDate);
        const diffTime = Math.abs(currentDate.getTime() - tripStartDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (trip.countries.length === 1) {
            return trip.countries[0];
        }

        // Simple logic for multi-country trips: divide duration by number of countries.
        // This is an approximation. A more advanced version would have country-specific dates.
        const tripDuration = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysPerCountry = Math.ceil(tripDuration / trip.countries.length);
        const countryIndex = Math.min(Math.floor(diffDays / daysPerCountry), trip.countries.length - 1);
        
        return trip.countries[countryIndex] || null;
    }, [trip, selectedDate]);

    const safetyTip = useMemo(() => {
        if (!currentCountry) return null;
        const countryInfo = TRAVEL_INFO_DATA[currentCountry];
        if (!countryInfo || !countryInfo.safetyTips || countryInfo.safetyTips.length === 0) return null;
        
        // Pick a random safety tip to show
        const randomIndex = Math.floor(Math.random() * countryInfo.safetyTips.length);
        return countryInfo.safetyTips[randomIndex];
    }, [currentCountry]);

    if (!safetyTip) {
        return null;
    }

    return (
        <div className="p-4 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-start gap-3 animate-fade-in">
            <span className="material-symbols-outlined mt-0.5">health_and_safety</span>
            <div>
                <h3 className="text-base font-semibold">Consiglio di Sicurezza per {currentCountry}</h3>
                <p className="text-sm leading-relaxed">{safetyTip}</p>
            </div>
        </div>
    );
};

export default SafetyAlertWidget;