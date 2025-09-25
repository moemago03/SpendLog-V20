import { Trip, Stage } from '../types';
import { dateToISOString } from './dateUtils';

/**
 * Derives dynamic properties of a trip from its stages.
 * @param trip The trip object with a stages array.
 * @returns An object with calculated startDate, endDate, durationDays, and countries.
 */
export const getTripProperties = (trip: Trip) => {
    if (!trip.stages || trip.stages.length === 0) {
        const today = new Date().toISOString();
        return { 
            startDate: trip.startDate || today, 
            endDate: trip.endDate || today, 
            durationDays: 1, 
            countries: trip.countries || [] 
        };
    }
    
    const firstStage = trip.stages[0];
    const lastStage = trip.stages[trip.stages.length - 1];
    
    const startDate = new Date(firstStage.startDate + 'T12:00:00Z');
    
    const endDate = new Date(lastStage.startDate + 'T12:00:00Z');
    endDate.setDate(endDate.getDate() + lastStage.nights);
    
    const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
    
    const countries = [...new Set(trip.stages.map(s => {
        const parts = s.location.split(',');
        return parts.length > 1 ? parts[parts.length - 1].trim() : s.location.trim();
    }).filter(Boolean) as string[])];

    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        durationDays,
        countries
    };
};

/**
 * Finds the stage that a specific date falls into.
 * @param trip The trip object.
 * @param dateISO The date string in "YYYY-MM-DD" format.
 * @returns The matching Stage object or null if not found.
 */
export const findStageForDate = (trip: Trip, dateISO: string): Stage | null => {
    if (!trip.stages || trip.stages.length === 0) return null;
    
    const targetDate = new Date(dateISO + 'T12:00:00Z').getTime();
    
    for (const stage of trip.stages) {
        const stageStart = new Date(stage.startDate + 'T12:00:00Z');
        const stageEnd = new Date(stageStart);
        stageEnd.setDate(stageEnd.getDate() + stage.nights);
        
        if (targetDate >= stageStart.getTime() && targetDate < stageEnd.getTime()) {
            return stage;
        }
    }

    // Fallback for the very last day of the last stage
    const lastStage = trip.stages[trip.stages.length - 1];
    const lastStageStart = new Date(lastStage.startDate + 'T12:00:00Z');
    const lastStageEnd = new Date(lastStageStart);
    lastStageEnd.setDate(lastStageEnd.getDate() + lastStage.nights);
    if(dateToISOString(new Date(targetDate)) === dateToISOString(new Date(lastStageEnd.getTime() - 1))) {
        return lastStage;
    }
    
    return null;
}