import React, { createContext, useCallback, ReactNode, useContext, useMemo } from 'react';
import { Event } from '../types';
import { useData } from './DataContext';

interface ItineraryContextProps {
    getEventsByTrip: (tripId: string) => Event[];
    // FIX: Update addEvent signature to match the underlying DataContext implementation
    addEvent: (tripId: string, newEventData: Omit<Event, 'eventId' | 'tripId'>) => void;
    updateEvent: (tripId: string, eventId: string, updates: Partial<Omit<Event, 'eventId'>>) => void;
    deleteEvent: (tripId: string, eventId: string) => void;
}

const ItineraryContext = createContext<ItineraryContextProps | undefined>(undefined);

export const ItineraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data, addEvent: addEventToData, updateEvent: updateEventInData, deleteEvent: deleteEventFromData } = useData();

    const getEventsByTrip = useCallback((tripId: string): Event[] => {
        if (!data) return [];
        const trip = data.trips.find(t => t.id === tripId);
        return trip?.events || [];
    }, [data]);

    const addEvent = useCallback((tripId: string, newEventData: Omit<Event, 'eventId' | 'tripId'>) => {
        addEventToData(tripId, newEventData);
    }, [addEventToData]);
    
    const updateEvent = useCallback((tripId: string, eventId: string, updates: Partial<Omit<Event, 'eventId'>>) => {
        updateEventInData(tripId, eventId, updates);
    }, [updateEventInData]);

    const deleteEvent = useCallback((tripId: string, eventId: string) => {
        deleteEventFromData(tripId, eventId);
    }, [deleteEventFromData]);

    const value = useMemo(() => ({
        getEventsByTrip,
        addEvent,
        updateEvent,
        deleteEvent,
    }), [getEventsByTrip, addEvent, updateEvent, deleteEvent]);

    return (
        <ItineraryContext.Provider value={value}>
            {children}
        </ItineraryContext.Provider>
    );
};

export const useItinerary = () => {
    const context = useContext(ItineraryContext);
    if (context === undefined) {
        throw new Error('useItinerary must be used within an ItineraryProvider');
    }
    return context;
};