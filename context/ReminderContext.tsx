import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useData } from './DataContext';
import { useItinerary } from './ItineraryContext';
import { useNotification } from './NotificationContext';
import { ChecklistItem, Event } from '../types';

const ReminderContext = createContext<null>(null);

const REMINDER_WINDOW_HOURS = 24; // Trigger reminder 24 hours before the event
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export const ReminderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data } = useData();
    const { getEventsByTrip } = useItinerary();
    const { addNotification } = useNotification();
    const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());

    useEffect(() => {
        const checkReminders = () => {
            if (!data || !data.defaultTripId) return;

            const activeTrip = data.trips.find(t => t.id === data.defaultTripId);
            if (!activeTrip || !activeTrip.checklist) return;
            
            const tripEvents = getEventsByTrip(activeTrip.id);
            if (tripEvents.length === 0) return;

            const now = new Date().getTime();
            const reminderThreshold = now + REMINDER_WINDOW_HOURS * 60 * 60 * 1000;

            activeTrip.checklist.forEach((item: ChecklistItem) => {
                if (item.reminderEventId && !sentReminders.has(item.id)) {
                    const event = tripEvents.find((e: Event) => e.eventId === item.reminderEventId);
                    if (event) {
                        const eventTime = new Date(`${event.eventDate}T${event.startTime || '00:00:00'}`).getTime();
                        
                        if (eventTime <= reminderThreshold && eventTime > now) {
                            addNotification(`Promemoria: non dimenticare "${item.text}" per l'evento "${event.title}"!`, 'info');
                            
                            setSentReminders(prev => {
                                const newSet = new Set(prev);
                                newSet.add(item.id);
                                return newSet;
                            });
                        }
                    }
                }
            });
        };

        const intervalId = setInterval(checkReminders, CHECK_INTERVAL);

        return () => clearInterval(intervalId);
    }, [data, getEventsByTrip, addNotification, sentReminders]);

    return (
        <ReminderContext.Provider value={null}>
            {children}
        </ReminderContext.Provider>
    );
};

export const useReminders = () => {
    const context = useContext(ReminderContext);
    if (context === undefined) {
        throw new Error('useReminders must be used within a ReminderProvider');
    }
    return context;
};