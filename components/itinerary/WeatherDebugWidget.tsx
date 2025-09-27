import React, { useMemo, useEffect } from 'react';
import { Trip } from '../../types';
import { useLocation } from '../../context/LocationContext';
import { dateToISOString } from '../../utils/dateUtils';

interface WeatherDebugWidgetProps {
    trip: Trip;
}

const WeatherDebugWidget: React.FC<WeatherDebugWidgetProps> = ({ trip }) => {
    // This is a debug component. Set to true to show it in the UI.
    const DEBUG_MODE = true; 
    const { location, isLoadingLocation, locationError } = useLocation();

    const locationForWeather = useMemo(() => {
        return location?.city || trip.countries?.[0] || 'N/A';
    }, [location, trip.countries]);

    const dateRange = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tripStart = new Date(trip.startDate.split('T')[0] + 'T00:00:00Z');
        const tripEnd = new Date(trip.endDate.split('T')[0] + 'T23:59:59Z');

        if (today > tripEnd) {
            return "Trip is over";
        }
        
        const apiStartDate = today > tripStart ? today : tripStart;
        const apiEndDateLimit = new Date(apiStartDate);
        apiEndDateLimit.setDate(apiEndDateLimit.getDate() + 8);
        const apiEndDate = apiEndDateLimit < tripEnd ? apiEndDateLimit : tripEnd;
        
        return `${dateToISOString(apiStartDate)} to ${dateToISOString(apiEndDate)}`;

    }, [trip.startDate, trip.endDate]);

    // ADDED: Console logs for debugging
    useEffect(() => {
        if (DEBUG_MODE) {
            console.log('[Weather Debug] Status:', isLoadingLocation ? 'Loading location...' : (locationError || 'Location OK'));
            console.log('[Weather Debug] Location for fetch:', locationForWeather);
            console.log('[Weather Debug] Calculated Date Range:', dateRange);
        }
    }, [isLoadingLocation, locationError, locationForWeather, dateRange]);


    if (!DEBUG_MODE) {
        return null;
    }
    
    return (
        <div style={{
            backgroundColor: 'rgba(240, 240, 255, 0.9)',
            border: '1px solid blue',
            color: 'black',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            lineHeight: '1.4',
            opacity: 0.8,
            position: 'fixed',
            bottom: '6rem',
            left: '1rem',
            zIndex: 1000,
        }}>
            <h4 style={{ margin: '0 0 5px', fontWeight: 'bold' }}>[Weather Debug]</h4>
            <p><strong>Status:</strong> {isLoadingLocation ? 'Loading location...' : (locationError || 'Location OK')}</p>
            <p><strong>Location for fetch:</strong> {locationForWeather}</p>
            <p><strong>Calculated Date Range:</strong> {dateRange}</p>
            <p style={{fontStyle: 'italic', marginTop: '5px'}}>This widget shows parameters for the weather API call. It does not display fetch results.</p>
        </div>
    );
};

export default WeatherDebugWidget;
