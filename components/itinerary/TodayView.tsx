import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Trip, Event, Expense } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { dateToISOString } from '../../utils/dateUtils';
import { useData } from '../../context/DataContext';
import { getContrastColor } from '../../utils/colorUtils';

const DuplicateEventModal = lazy(() => import('./DuplicateEventModal'));

const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};

interface TodayViewProps {
    trip: Trip;
    onAddExpense: (prefill: Partial<Expense>) => void;
    onOpenDayDetail: (date: Date) => void;
}

const TodayView: React.FC<TodayViewProps> = ({ trip, onAddExpense, onOpenDayDetail }) => {
    const { getEventsByTrip } = useItinerary();
    const [duplicatingEvent, setDuplicatingEvent] = useState<Event | null>(null);
    const { data } = useData();

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

    const { currentEventId, currentEventStatus } = useMemo(() => {
        const now = new Date();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        
        const timedEvents = todaysEvents.filter(e => e.startTime);
        if (timedEvents.length === 0) {
            return { currentEventId: todaysEvents[0]?.eventId || null, currentEventStatus: 'ALL_DAY' };
        }

        const relevantEvent = timedEvents.find(e => {
            const startMinutes = timeToMinutes(e.startTime!);
            const endMinutes = e.endTime ? timeToMinutes(e.endTime) : startMinutes + 60;
            return endMinutes > nowInMinutes; // Find the first event that is not yet over
        });
        
        if (relevantEvent) {
            const startMinutes = timeToMinutes(relevantEvent.startTime!);
            const status = nowInMinutes >= startMinutes ? 'LIVE' : 'NEXT';
            return { currentEventId: relevantEvent.eventId, currentEventStatus: status };
        }
        
        // If all timed events are in the past, highlight the last one
        const lastEvent = timedEvents[timedEvents.length - 1];
        return { currentEventId: lastEvent?.eventId || null, currentEventStatus: 'DONE' };

    }, [todaysEvents]);

    const handleAddExpense = (event: Event) => {
        const prefill: Partial<Expense> = {
            description: event.title,
            date: event.eventDate,
            category: event.type,
            eventId: event.eventId,
        };
        onAddExpense(prefill);
    };

    if (todaysEvents.length === 0) {
        return (
            <div className="text-center py-16 px-6 mt-4 bg-surface-variant/50 rounded-3xl">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">celebration</span>
                <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessun evento per oggi!</h2>
                <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">Goditi la giornata libera o aggiungi un nuovo evento al tuo itinerario.</p>
            </div>
        );
    }

    const getStatusLabel = (status: string) => {
        if (status === 'LIVE') return 'IN CORSO';
        if (status === 'NEXT') return 'PROSSIMO';
        return null;
    }

    return (
        <div className="mt-6">
            <div className="relative">
                {/* Vertical line connector */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-surface-variant -ml-px"></div>
                
                <div className="space-y-6">
                    {todaysEvents.map((event, index) => {
                        const category = data.categories.find(c => c.name === event.type);
                        const isCurrent = event.eventId === currentEventId;
                        const statusLabel = isCurrent ? getStatusLabel(currentEventStatus) : null;
                        const navigateUrl = event.location ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}` : '';

                        const isDarkBg = category && getContrastColor(category.color) === '#FFFFFF';
                        const cardBg = isDarkBg ? category.color : 'var(--color-surface)';
                        const cardBorder = category?.color || 'var(--color-surface-variant)';
                        const textColor = isDarkBg ? 'white' : 'var(--color-on-surface)';
                        const subTextColor = isDarkBg ? 'rgba(255,255,255,0.8)' : 'var(--color-on-surface-variant)';
                        const buttonBg = isDarkBg ? 'rgba(255,255,255,0.15)' : 'var(--color-surface-variant)';
                        const buttonTextColor = isDarkBg ? 'white' : 'var(--color-on-surface-variant)';

                        return (
                            <div key={event.eventId} className="relative pl-12 animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                <div className="absolute left-0 top-1 flex items-center">
                                    <p className={`w-10 text-right font-semibold text-xs ${isCurrent ? 'text-primary' : 'text-on-surface-variant'}`}>
                                        {event.startTime ? event.startTime : 'Giorno'}
                                    </p>
                                    <div className={`absolute left-12 -ml-2 w-4 h-4 rounded-full border-4 border-background ${isCurrent ? 'bg-primary' : 'bg-surface-variant'}`}></div>
                                </div>
                                
                                <div className="ml-4">
                                     <div 
                                        className={`relative p-4 rounded-2xl shadow-sm transition-all duration-300 ${isCurrent ? 'ring-2 ring-offset-background ring-offset-2' : ''}`}
                                        // FIX: Replaced invalid `ringColor` property with `--tw-ring-color` CSS variable for dynamic ring colors with Tailwind.
                                        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, '--tw-ring-color': cardBorder } as React.CSSProperties}
                                    >
                                        {statusLabel && (
                                            <div className="absolute top-2 right-2 text-xs font-bold bg-primary text-on-primary px-2 py-0.5 rounded-full animate-fade-in">
                                                {statusLabel}
                                            </div>
                                        )}
                                        <h3 className="font-bold text-lg" style={{ color: textColor }}>{event.title}</h3>
                                        {event.description && <p className="text-sm mt-1" style={{ color: subTextColor }}>{event.description}</p>}
                                        
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {event.location && (
                                                <a 
                                                    href={navigateUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-opacity hover:opacity-80"
                                                    style={{ backgroundColor: buttonBg, color: buttonTextColor }}
                                                >
                                                    <span className="material-symbols-outlined text-sm">navigation</span>
                                                    Naviga
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => handleAddExpense(event)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-opacity hover:opacity-80"
                                                style={{ backgroundColor: buttonBg, color: buttonTextColor }}
                                            >
                                                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                                Spesa
                                            </button>
                                            <button 
                                                onClick={() => setDuplicatingEvent(event)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-opacity hover:opacity-80"
                                                style={{ backgroundColor: buttonBg, color: buttonTextColor }}
                                            >
                                                 <span className="material-symbols-outlined text-sm">content_copy</span>
                                                Duplica
                                            </button>
                                            <button 
                                                onClick={() => onOpenDayDetail(new Date(event.eventDate + 'T12:00:00Z'))}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-opacity hover:opacity-80"
                                                style={{ backgroundColor: buttonBg, color: buttonTextColor }}
                                            >
                                                 <span className="material-symbols-outlined text-sm">visibility</span>
                                                Dettagli
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
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