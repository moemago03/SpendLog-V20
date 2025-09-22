import React, { createContext, useState, useCallback, ReactNode, useContext, useMemo } from 'react';
import { Event } from '../types';

const todayISO = new Date().toISOString().slice(0, 10);

const MOCK_EVENTS: Event[] = [
  {
    eventId: 'evt-today-1',
    tripId: 'mock-trip-1',
    eventDate: todayISO,
    title: 'Colazione al bar',
    type: 'Cibo',
    startTime: '08:30',
    endTime: '09:15',
    description: 'Cappuccino e cornetto per iniziare la giornata.',
    status: 'planned',
    location: 'Bar del Corso, Roma, Italia',
  },
  {
    eventId: 'evt-today-2',
    tripId: 'mock-trip-1',
    eventDate: todayISO,
    title: 'Visita al Museo d\'Arte',
    type: 'Attività',
    startTime: '10:00',
    endTime: '12:30',
    description: 'Mostra temporanea di arte moderna.',
    status: 'planned',
    location: 'Museo d\'Arte Moderna, Roma, Italia',
  },
  {
    eventId: 'evt-today-3',
    tripId: 'mock-trip-1',
    eventDate: todayISO,
    title: 'Pranzo in Trattoria',
    type: 'Cibo',
    startTime: '13:00',
    endTime: '14:30',
    description: 'Pasta alla carbonara.',
    status: 'planned',
    location: 'Trattoria da Luigi, Roma, Italia',
  },
  {
    eventId: 'evt-1',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-02',
    title: 'Grande Palazzo Reale',
    type: 'attraction',
    startTime: '09:00',
    endTime: '12:00',
    description: 'Visita il complesso di templi più sacro della Thailandia.',
    status: 'planned',
    location: 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Phra Nakhon, Bangkok 10200, Thailandia',
  },
  {
    eventId: 'evt-2',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-02',
    title: 'Pranzo da Jay Fai',
    type: 'restaurant',
    startTime: '13:00',
    endTime: '14:30',
    description: 'Famoso street food stellato Michelin.',
    status: 'planned',
    location: '327 Maha Chai Rd, Samran Rat, Phra Nakhon, Bangkok 10200, Thailandia',
  },
   {
    eventId: 'evt-5',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-02',
    title: 'Massaggio da Wat Pho',
    type: 'attraction',
    startTime: '16:00',
    status: 'planned',
  },
   {
    eventId: 'evt-6',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-02',
    title: 'Cena da un Rooftop Bar',
    type: 'restaurant',
    startTime: '20:00',
    endTime: '21:30',
    status: 'planned',
  },
  {
    eventId: 'evt-3',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-03',
    title: 'Volo per Hanoi',
    type: 'booking',
    startTime: '15:30',
    description: 'Volo BKK -> HAN, VietJet Air VJ902.',
    status: 'completed',
  },
  {
    eventId: 'evt-10',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-06',
    endDate: '2024-08-07',
    title: 'Matrimoni',
    type: 'note',
    status: 'planned',
  },
  {
    eventId: 'evt-7',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-15',
    endDate: '2024-08-19', // Multi-day event
    title: 'POSSIBILI FERIE',
    type: 'note',
    status: 'planned',
  },
   {
    eventId: 'evt-8',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-16',
    endDate: '2024-08-20', // Overlapping multi-day
    title: 'DESERTO',
    type: 'booking',
    status: 'planned',
  },
  {
    eventId: 'evt-9',
    tripId: 'mock-trip-1',
    eventDate: '2024-08-18', // single day
    title: 'Certificato',
    type: 'attraction',
    startTime: '11:00',
    status: 'planned',
  },
];

interface ItineraryContextProps {
    events: Event[];
    getEventsByTrip: (tripId: string) => Event[];
    addEvent: (newEventData: Omit<Event, 'eventId'>) => void;
    updateEvent: (eventId: string, updates: Partial<Omit<Event, 'eventId'>>) => void;
    deleteEvent: (eventId: string) => void;
}

const ItineraryContext = createContext<ItineraryContextProps | undefined>(undefined);

export const ItineraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);

    const getEventsByTrip = useCallback((tripId: string) => {
        return events.filter(event => event.tripId === tripId);
    }, [events]);
    
    const addEvent = useCallback((newEventData: Omit<Event, 'eventId'>) => {
        const newEvent: Event = {
            ...newEventData,
            eventId: crypto.randomUUID(),
        };
        setEvents(prevEvents => [...prevEvents, newEvent]);
    }, []);
    
    const updateEvent = useCallback((eventId: string, updates: Partial<Omit<Event, 'eventId'>>) => {
        setEvents(prevEvents => prevEvents.map(event => 
            event.eventId === eventId ? { ...event, ...updates } : event
        ));
    }, []);

    const deleteEvent = useCallback((eventId: string) => {
        setEvents(prevEvents => prevEvents.filter(event => event.eventId !== eventId));
    }, []);

    const value = useMemo(() => ({
        events,
        getEventsByTrip,
        addEvent,
        updateEvent,
        deleteEvent,
    }), [events, getEventsByTrip, addEvent, updateEvent, deleteEvent]);

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