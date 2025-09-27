import { Trip, Stage } from '../types';
import { dateToISOString } from './dateUtils';

/**
 * Derives dynamic properties of a trip from its stages.
 * @param trip The trip object with a stages array.
 * @returns An object with calculated startDate,endDate, durationDays, and countries.
 */
export const getTripProperties = (trip: Trip) => {
    const today = new Date().toISOString();

    if (!trip.stages || trip.stages.length === 0) {
        // For trips without stages, use the trip's own dates or default to today.
        return { 
            startDate: trip.startDate || today, 
            endDate: trip.endDate || today, 
            durationDays: 1, 
            countries: trip.countries || [] 
        };
    }
    
    // Filter out any stages that don't have a valid start date before processing.
    const validStages = trip.stages.filter(s => s.startDate && typeof s.startDate === 'string');

    if (validStages.length === 0) {
        // If no stages have valid dates, fallback to the trip's dates or today.
        return {
            startDate: trip.startDate || today,
            endDate: trip.endDate || today,
            durationDays: 1,
            countries: trip.countries || []
        };
    }

    const firstStage = validStages[0];
    const lastStage = validStages[validStages.length - 1];

    // Safely create date objects. Invalid dates will result in NaN time.
    const startDate = new Date(firstStage.startDate + 'T12:00:00Z');
    const endDate = new Date(lastStage.startDate + 'T12:00:00Z');

    // Check if dates are valid before doing calculations
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
            startDate: today,
            endDate: today,
            durationDays: 1,
            countries: []
        };
    }

    endDate.setDate(endDate.getDate() + (lastStage.nights || 0));
    
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.max(1, Math.round(durationMs / (1000 * 3600 * 24)));
    
    const countries = [...new Set(trip.stages.map(s => {
        if (!s.location) return null;
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
        if (!stage.startDate) continue; // Skip stages without a start date
        const stageStart = new Date(stage.startDate + 'T12:00:00Z');
        const stageEnd = new Date(stageStart);
        stageEnd.setDate(stageEnd.getDate() + (stage.nights || 0));
        
        if (targetDate >= stageStart.getTime() && targetDate < stageEnd.getTime()) {
            return stage;
        }
    }

    // Fallback for the very last day of the last stage
    const lastStage = trip.stages[trip.stages.length - 1];
    if (!lastStage.startDate) return null; // Can't calculate if the last stage has no date
    const lastStageStart = new Date(lastStage.startDate + 'T12:00:00Z');
    const lastStageEnd = new Date(lastStageStart);
    lastStageEnd.setDate(lastStageEnd.getDate() + (lastStage.nights || 0));
    if(dateToISOString(new Date(targetDate)) === dateToISOString(new Date(lastStageEnd.getTime() - 1))) {
        return lastStage;
    }
    
    return null;
};