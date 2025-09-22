import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Trip, Event, Expense } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { dateToISOString } from '../../utils/dateUtils';

const DuplicateEventModal = lazy(() => import('./DuplicateEventModal'));

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};

interface TodayViewProps {
    trip: Trip;
    onAddExpense: (prefill: Partial<Expense>) => void;
    onOpenDayDetail: (date: Date) => void;
}

const EventCard: React.FC<{ event: Event; isCurrent: boolean; onAddExpense: () => void; onDuplicate: () => void; onOpenDayDetail: () => void; }> = ({ event, isCurrent, onAddExpense, onDuplicate, onOpenDayDetail }) => {
    const navigateUrl = event.location ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}` : '';

    return (
        <div className="flex gap-4">
            {/* Timeline Column */}
            <div className="flex flex-col items-center">
                <div className={`w-20 text-center text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {event.startTime ? event.startTime : 'Tutto il giorno'}
                </div>
                <div className={`w-0.5 flex-1 ${isCurrent ? 'bg-primary' : 'bg-surface-variant'}`}></div>
            </div>

            {/* Card Content */}
            <div className={`flex-1 pb-8 animate-slide-in-up ${isCurrent ? 'relative -top-2' : ''}`}>
                <div className={`p-4 rounded-2xl shadow-sm transition-all duration-300 ${isCurrent ? 'bg-primary-container/60' : 'bg-surface-variant'}`}>
                    <h3 className={`font-bold text-lg ${isCurrent ? 'text-on-primary-container' : 'text-on-surface'}`}>{event.title}</h3>
                    {event.description && <p className={`text-sm mt-1 ${isCurrent ? 'text-on-primary-container/80' : 'text-on-surface-variant'}`}>{event.description}</p>}
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                        {event.location && (
                            <a 
                                href={navigateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-secondary-container text-on-secondary-container rounded-full"
                            >
                                <span className="material-symbols-outlined text-sm">navigation</span>
                                Naviga
                            </a>
                        )}
                        <button 
                            onClick={onAddExpense}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-tertiary-container text-on-tertiary-container rounded-full"
                        >
                            <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                            Aggiungi Spesa
                        </button>
                        <button 
                            onClick={onDuplicate}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-surface text-on-surface rounded-full"
                        >
                             <span className="material-symbols-outlined text-sm">content_copy</span>
                            Duplica
                        </button>
                        <button 
                            onClick={onOpenDayDetail}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-surface text-on-surface rounded-full"
                        >
                             <span className="material-symbols-outlined text-sm">visibility</span>
                            Vedi Dettagli
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const TodayView: React.FC<TodayViewProps> = ({ trip, onAddExpense, onOpenDayDetail }) => {
    const { getEventsByTrip } = useItinerary();
    const [duplicatingEvent, setDuplicatingEvent] = useState<Event | null>(null);

    const todayISO = useMemo(() => dateToISOString(new Date()), []);
    
    const todaysEvents = useMemo(() => {
        return getEventsByTrip(trip.id)
            .filter(e => e.eventDate === todayISO)
            .sort((a, b) => {
                if (!a.startTime) return -1; // all-day events first
                if (!b.startTime) return 1;
                return a.startTime.localeCompare(b.startTime);
            });
    }, [getEventsByTrip, trip.id, todayISO]);

    const currentOrNextEventId = useMemo(() => {
        const now = new Date();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        
        const timedEvents = todaysEvents.filter(e => e.startTime);
        if (timedEvents.length === 0) return null;

        const nextEvent = timedEvents.find(e => {
            const endMinutes = e.endTime ? timeToMinutes(e.endTime) : timeToMinutes(e.startTime!) + 60;
            return endMinutes > nowInMinutes;
        });

        if (nextEvent) return nextEvent.eventId;
        
        return timedEvents[timedEvents.length - 1]?.eventId || null;
    }, [todaysEvents]);

    if (todaysEvents.length === 0) {
        return (
            <div className="text-center py-16 px-6 mt-4 bg-surface-variant/50 rounded-3xl">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">celebration</span>
                <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessun evento per oggi!</h2>
                <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">Goditi la giornata libera o aggiungi un nuovo evento al tuo itinerario.</p>
            </div>
        );
    }
    
    const handleAddExpense = (event: Event) => {
        const prefill: Partial<Expense> = {
            description: event.title,
            date: event.eventDate,
            category: event.type === 'restaurant' ? 'Cibo' : 'Attività',
        };
        onAddExpense(prefill);
    };

    return (
        <div className="mt-4">
            {todaysEvents.map((event, index) => (
                <EventCard 
                    key={event.eventId}
                    event={event}
                    isCurrent={event.eventId === currentOrNextEventId}
                    onAddExpense={() => handleAddExpense(event)}
                    onDuplicate={() => setDuplicatingEvent(event)}
                    onOpenDayDetail={() => onOpenDayDetail(new Date(event.eventDate + 'T12:00:00Z'))}
                />
            ))}
            {duplicatingEvent && (
                <Suspense fallback={<div/>}>
                    <DuplicateEventModal
                        eventToDuplicate={duplicatingEvent}
                        trip={trip}
                        onClose={() => setDuplicatingEvent(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default TodayView;