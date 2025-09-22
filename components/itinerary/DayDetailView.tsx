// components/itinerary/DayDetailView.tsx

import React, { useMemo, useState, lazy, Suspense, useRef, DragEvent, useCallback } from 'react';
import { useItinerary } from '../../context/ItineraryContext';
import { Event, Expense } from '../../types';
import { useData } from '../../context/DataContext';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import { getContrastColor, hexToRgba } from '../../utils/colorUtils';
import { dateToISOString } from '../../utils/dateUtils';

const EventForm = lazy(() => import('./EventForm'));
const DuplicateEventModal = lazy(() => import('./DuplicateEventModal'));

// --- START: Timeline sub-components ---
const HOUR_HEIGHT = 80; // pixels per hour

const timeToMinutes = (time: string): number => {
    if (typeof time !== 'string' || !time.includes(':')) {
        return 0; // Default to midnight if format is invalid
    }
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};

const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const TimelineEventCard: React.FC<{
    event: Event;
    onEditEvent: (event: Event) => void;
    onAddExpense: (event: Event) => void;
    onDuplicateEvent: (event: Event) => void;
    timelineStartHour: number;
    spentAmount: number | undefined;
    isBeingDragged: boolean;
    onDragStart: (e: DragEvent<HTMLDivElement>, eventId: string) => void;
    onDragEnd: (e: DragEvent<HTMLDivElement>) => void;
    onStatusToggle: (eventId: string, currentStatus: 'planned' | 'completed') => void;
    isCurrent: boolean;
    statusLabel: string | null;
}> = ({ event, onEditEvent, onAddExpense, onDuplicateEvent, timelineStartHour, spentAmount, isBeingDragged, onDragStart, onDragEnd, onStatusToggle, isCurrent, statusLabel }) => {
    const { data } = useData();
    const { formatCurrency } = useCurrencyConverter();
    const tripData = data.trips.find(t => t.id === event.tripId);
    if (!event.startTime) return null;

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = event.endTime ? timeToMinutes(event.endTime) : startMinutes + 60;
    const durationMinutes = Math.max(15, endMinutes - startMinutes);

    const top = ((startMinutes / 60) - timelineStartHour) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT - 2;

    const category = data.categories.find(c => c.name === event.type);
    const eventColor = category?.color || '#757780';
    
    const isCompleted = event.status === 'completed';
    
    const navigationUrl = event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : '#';

    const ActionButton: React.FC<{ children: React.ReactNode, onClick: (e: React.MouseEvent) => void, 'aria-label': string }> = ({ children, onClick, 'aria-label': ariaLabel }) => (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(e); }}
            className="h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
            style={{
                backgroundColor: hexToRgba(eventColor, 0.2),
                color: eventColor
            }}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );

    const ActionLink: React.FC<{ children: React.ReactNode, href: string, 'aria-label': string }> = ({ children, href, 'aria-label': ariaLabel }) => (
         <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
            style={{
                backgroundColor: hexToRgba(eventColor, 0.2),
                color: eventColor
            }}
            aria-label={ariaLabel}
        >
            {children}
        </a>
    );

    return (
        <div
            draggable="true"
            onDragStart={(e) => onDragStart(e, event.eventId)}
            onDragEnd={onDragEnd}
            onClick={() => onEditEvent(event)}
            className={`absolute left-16 right-0 rounded-2xl p-3 overflow-hidden transition-all duration-200 hover:shadow-lg cursor-grab active:cursor-grabbing ${isBeingDragged ? 'opacity-50 shadow-2xl scale-105' : ''} ${isCompleted ? 'opacity-60' : ''}`}
            style={{
                top: `${top}px`,
                height: `${height}px`,
                animation: 'zoomIn 0.3s ease-out forwards',
                backgroundColor: hexToRgba(eventColor, 0.1),
                borderLeft: `4px solid ${eventColor}`,
                color: 'var(--color-on-surface)'
            } as React.CSSProperties}
            role="button"
            aria-label={`Modifica evento: ${event.title} alle ${event.startTime}`}
        >
            {statusLabel && (
                <div className="absolute top-2 right-2 text-xs font-bold bg-primary text-on-primary px-2 py-0.5 rounded-full animate-fade-in z-10">
                    {statusLabel}
                </div>
            )}
            <div className="flex flex-col h-full justify-between">
                {/* TOP CONTENT */}
                <div>
                    <div className="flex items-start gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onStatusToggle(event.eventId, event.status); }}
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-0.5`}
                            style={{
                               borderColor: eventColor,
                               backgroundColor: isCompleted ? eventColor : 'transparent'
                            }}
                        >
                            {isCompleted && <span className="material-symbols-outlined text-xs text-white">check</span>}
                        </button>
                        <p className={`font-bold text-sm leading-tight flex-1 ${isCompleted ? 'line-through' : ''}`}>{event.title}</p>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-7">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</p>
                    {event.location && <p className="text-xs text-on-surface-variant mt-1 truncate pl-7 flex items-center gap-1"><span className="material-symbols-outlined text-xs">location_on</span>{event.location}</p>}
                </div>
                 {/* BOTTOM CONTENT */}
                 <div className="flex justify-between items-end mt-1">
                     <div> {/* Spent amount on the left */}
                        {spentAmount && spentAmount > 0 ? (
                            <span className="text-xs font-bold bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded-full self-start ml-7">
                                {formatCurrency(spentAmount, tripData!.mainCurrency).replace(/\.00$/, '')}
                            </span>
                        ) : <div/>}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ActionButton onClick={() => onAddExpense(event)} aria-label="Aggiungi spesa">
                            <span className="material-symbols-outlined text-sm">payments</span>
                        </ActionButton>
                        
                        {event.location && (
                            <ActionLink href={navigationUrl} aria-label="Naviga">
                                <span className="material-symbols-outlined text-sm">near_me</span>
                            </ActionLink>
                        )}

                        <ActionButton onClick={() => onDuplicateEvent(event)} aria-label="Duplica evento">
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface TimelineProps {
    events: Event[];
    onEditEvent: (event: Event) => void;
    onAddExpense: (event: Event) => void;
    onDuplicateEvent: (event: Event) => void;
    startHour: number;
    endHour: number;
    expenses: Expense[];
    onStatusToggle: (eventId: string, currentStatus: 'planned' | 'completed') => void;
    currentEvent: Event | null;
    currentEventStatus: string | null;
    spentPerEvent: Map<string, number>;
    // Drag & Drop props
    draggedEventId: string | null;
    dropIndicatorPosition: number | null;
    onDragStart: (e: DragEvent<HTMLDivElement>, eventId: string) => void;
    onDragEnd: (e: DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, onEditEvent, onAddExpense, onDuplicateEvent, startHour, endHour, onStatusToggle, currentEvent, currentEventStatus, spentPerEvent, ...dragProps }) => {
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

    return (
        <div 
            className="relative"
            onDragOver={dragProps.onDragOver}
            onDrop={dragProps.onDrop}
            onDragLeave={dragProps.onDragLeave}
        >
            {hours.map(hour => (
                <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                    <div className="absolute -left-1 -top-2 text-xs font-semibold text-on-surface-variant/60 w-14 text-right pr-2">
                        {hour < 10 ? `0${hour}` : hour}:00
                    </div>
                    <div className="h-px bg-surface-variant ml-16"></div>
                </div>
            ))}
             {dragProps.dropIndicatorPosition !== null && (
                <div 
                    className="absolute left-16 right-0 h-0.5 bg-primary z-10 pointer-events-none"
                    style={{ top: `${dragProps.dropIndicatorPosition}px` }}
                />
            )}

            <div className="absolute top-0 left-0 right-0 bottom-0">
                {events.map(event => {
                    const isCurrent = currentEvent?.eventId === event.eventId;
                    const statusLabel = isCurrent ? (currentEventStatus === 'LIVE' ? 'IN CORSO' : (currentEventStatus === 'NEXT' ? 'PROSSIMO' : null)) : null;
                    return (
                         <TimelineEventCard 
                            key={event.eventId} 
                            event={event} 
                            onEditEvent={onEditEvent} 
                            onAddExpense={onAddExpense}
                            onDuplicateEvent={onDuplicateEvent}
                            timelineStartHour={startHour} 
                            spentAmount={spentPerEvent.get(event.eventId)}
                            isBeingDragged={dragProps.draggedEventId === event.eventId}
                            onDragStart={dragProps.onDragStart}
                            onDragEnd={dragProps.onDragEnd}
                            onStatusToggle={onStatusToggle}
                            isCurrent={isCurrent}
                            statusLabel={statusLabel}
                         />
                    );
                })}
            </div>
        </div>
    );
};

interface AllDayEventPillProps {
    event: Event;
    onEditEvent: (event: Event) => void;
    onAddExpense: (event: Event) => void;
    onDuplicateEvent: (event: Event) => void;
}

const AllDayEventPill: React.FC<AllDayEventPillProps> = ({ event, onEditEvent, onAddExpense, onDuplicateEvent }) => {
    const { data } = useData();
    const category = data.categories.find(c => c.name === event.type);
    const eventColor = category?.color || '#9E9E9E';

    const navigationUrl = event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : '#';

    return (
        <div
            onClick={() => onEditEvent(event)}
            className="w-full p-2.5 rounded-xl flex items-center justify-between gap-2 transition-transform active:scale-95 text-left cursor-pointer"
            style={{ backgroundColor: hexToRgba(eventColor, 0.2) }}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: eventColor}} />
                <p className="font-bold text-sm text-on-surface truncate">{event.title}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                 <button
                    onClick={(e) => { e.stopPropagation(); onAddExpense(event); }}
                    className="h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ backgroundColor: hexToRgba(eventColor, 0.2), color: eventColor }}
                    aria-label="Aggiungi spesa"
                >
                     <span className="material-symbols-outlined text-sm">payments</span>
                </button>
                {event.location && (
                    <a
                        href={navigationUrl}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                        style={{ backgroundColor: hexToRgba(eventColor, 0.2), color: eventColor }}
                        aria-label="Naviga"
                    >
                        <span className="material-symbols-outlined text-sm">near_me</span>
                    </a>
                )}
                 <button
                    onClick={(e) => { e.stopPropagation(); onDuplicateEvent(event); }}
                    className="h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ backgroundColor: hexToRgba(eventColor, 0.2), color: eventColor }}
                    aria-label="Duplica evento"
                >
                     <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
            </div>
        </div>
    );
};


interface DayDetailViewProps {
    tripId: string;
    selectedDate: string; // YYYY-MM-DD
    onAddExpense: (prefill: Partial<Expense>) => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({ tripId, selectedDate, onAddExpense }) => {
    const { getEventsByTrip, updateEvent } = useItinerary();
    const { data } = useData();
    const { convert } = useCurrencyConverter();
    const [editingEvent, setEditingEvent] = useState<Event | null | 'new'>(null);
    const [duplicatingEvent, setDuplicatingEvent] = useState<Event | null>(null);
    const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
    const [dropIndicatorPosition, setDropIndicatorPosition] = useState<number | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);

    const tripData = data.trips.find(t => t.id === tripId);
    const expenses = tripData?.expenses || [];

    const todayISO = useMemo(() => dateToISOString(new Date()), []);
    const isToday = selectedDate === todayISO;

    const spentPerEvent = useMemo(() => {
        const eventSpending = new Map<string, number>();
        if (!tripData) return eventSpending;

        const expensesForDay = expenses.filter(e => e.date.startsWith(selectedDate) && e.eventId);
        
        for (const expense of expensesForDay) {
            const amountInMain = convert(expense.amount, expense.currency, tripData.mainCurrency);
            const currentTotal = eventSpending.get(expense.eventId!) || 0;
            eventSpending.set(expense.eventId!, currentTotal + amountInMain);
        }
        return eventSpending;
    }, [expenses, selectedDate, tripData, convert]);

    const { timedEvents, allDayEvents, timelineStartHour, timelineEndHour } = useMemo(() => {
        const allTripEvents = getEventsByTrip(tripId);
        const eventsForDay = allTripEvents.filter(event => event.eventDate === selectedDate);
        
        const timed = eventsForDay
            .filter(event => !!event.startTime)
            .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
            
        const allDay = eventsForDay.filter(event => !event.startTime);

        let startHour = 8;
        let endHour = 18;

        if (timed.length > 0) {
            const allTimesInMinutes = timed.flatMap(event => {
                const start = timeToMinutes(event.startTime!);
                const end = event.endTime ? timeToMinutes(event.endTime) : start + 60;
                return [start, end];
            });
            const minMinutes = Math.min(...allTimesInMinutes);
            const maxMinutes = Math.max(...allTimesInMinutes);
            startHour = Math.max(0, Math.floor(minMinutes / 60));
            endHour = Math.min(23, Math.ceil(maxMinutes / 60));
            if (endHour - startHour < 8) endHour = Math.min(23, startHour + 8);
        }

        return { timedEvents: timed, allDayEvents: allDay, timelineStartHour: startHour, timelineEndHour: endHour };
    }, [getEventsByTrip, tripId, selectedDate]);

     const { currentEvent, currentEventStatus } = useMemo(() => {
        if (!isToday) return { currentEvent: null, currentEventStatus: null };

        const now = new Date();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        
        if (timedEvents.length === 0) return { currentEvent: null, currentEventStatus: null };

        const relevantEvent = timedEvents.find(e => {
            const endMinutes = e.endTime ? timeToMinutes(e.endTime) : timeToMinutes(e.startTime!) + 60;
            return endMinutes > nowInMinutes; 
        });
        
        if (relevantEvent) {
            const startMinutes = timeToMinutes(relevantEvent.startTime!);
            const status = nowInMinutes >= startMinutes ? 'LIVE' : 'NEXT';
            return { currentEvent: relevantEvent, currentEventStatus: status };
        }
        
        const lastEvent = timedEvents[timedEvents.length - 1];
        return { currentEvent: lastEvent || null, currentEventStatus: 'DONE' };

    }, [isToday, timedEvents]);
    
    const handleAddExpenseForEvent = useCallback((event: Event) => {
        const prefill: Partial<Expense> = {
            description: event.title,
            date: event.eventDate,
            category: event.type,
            eventId: event.eventId,
        };
        onAddExpense(prefill);
    }, [onAddExpense]);

    const handleOpenForm = useCallback((event: Event | 'new') => setEditingEvent(event), []);
    const handleCloseForm = useCallback(() => setEditingEvent(null), []);
    const handleOpenDuplicateModal = useCallback((event: Event) => setDuplicatingEvent(event), []);
    const handleCloseDuplicateModal = useCallback(() => setDuplicatingEvent(null), []);

     const handleStatusToggle = useCallback((eventId: string, currentStatus: 'planned' | 'completed') => {
        const newStatus = currentStatus === 'planned' ? 'completed' : 'planned';
        updateEvent(eventId, { status: newStatus });
    }, [updateEvent]);

    const handleEventReposition = useCallback((eventId: string, newStartTime: string) => {
        const eventToMove = timedEvents.find(e => e.eventId === eventId);
        if (!eventToMove || !eventToMove.startTime) return;

        const startMinutes = timeToMinutes(eventToMove.startTime);
        const endMinutes = eventToMove.endTime ? timeToMinutes(eventToMove.endTime) : startMinutes + 60;
        const durationMinutes = endMinutes - startMinutes;

        const newStartMinutes = timeToMinutes(newStartTime);
        const newEndMinutes = newStartMinutes + durationMinutes;
        
        updateEvent(eventId, { startTime: newStartTime, endTime: minutesToTime(newEndMinutes) });
    }, [timedEvents, updateEvent]);
    
    const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, eventId: string) => {
        e.dataTransfer.setData('text/plain', eventId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggedEventId(eventId), 0);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedEventId(null);
        setDropIndicatorPosition(null);
    }, []);
    
    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const snapY = Math.round(y / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4);
            setDropIndicatorPosition(snapY);
        }
    }, []);
    
    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const eventId = e.dataTransfer.getData('text/plain');
        if (timelineRef.current && eventId && dropIndicatorPosition !== null) {
            const minutesFromTop = (dropIndicatorPosition / HOUR_HEIGHT) * 60;
            const totalMinutes = (timelineStartHour * 60) + minutesFromTop;
            const newStartTime = minutesToTime(totalMinutes);
            
            handleEventReposition(eventId, newStartTime);
        }
        setDropIndicatorPosition(null);
        setDraggedEventId(null);
    }, [timelineStartHour, handleEventReposition, dropIndicatorPosition]);

    const handleDragLeave = useCallback(() => {
        setDropIndicatorPosition(null);
    }, []);

    return (
        <div className="animate-fade-in">
             <style>{`
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes slide-in-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>
            
            <main>
                {allDayEvents.length > 0 && (
                    <div className="px-4 pb-4 border-b border-surface-variant">
                        <h3 className="text-sm font-semibold text-on-surface-variant mb-2">TUTTO IL GIORNO</h3>
                        <div className="space-y-2">
                             {allDayEvents.map(event => (
                                <AllDayEventPill 
                                    key={event.eventId} 
                                    event={event} 
                                    onEditEvent={() => handleOpenForm(event)}
                                    onAddExpense={() => handleAddExpenseForEvent(event)}
                                    onDuplicateEvent={() => handleOpenDuplicateModal(event)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-2 pt-4" ref={timelineRef}>
                    {timedEvents.length === 0 && allDayEvents.length === 0 ? (
                        <div className="text-center py-16 px-6 bg-surface-variant/50 rounded-3xl flex flex-col items-center">
                            <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">partly_cloudy_day</span>
                            <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessun evento</h2>
                            <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">Questa giornata è libera. Aggiungi un nuovo evento per iniziare a pianificare.</p>
                        </div>
                    ) : (
                        <Timeline events={timedEvents} onEditEvent={handleOpenForm} onAddExpense={handleAddExpenseForEvent} onDuplicateEvent={handleOpenDuplicateModal} startHour={timelineStartHour} endHour={timelineEndHour} expenses={expenses}
                            onStatusToggle={handleStatusToggle}
                            currentEvent={currentEvent}
                            currentEventStatus={currentEventStatus}
                            spentPerEvent={spentPerEvent}
                            draggedEventId={draggedEventId}
                            dropIndicatorPosition={dropIndicatorPosition}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragLeave={handleDragLeave}
                        />
                    )}
                </div>
            </main>
            
            {editingEvent && (
                <Suspense fallback={<div/>}>
                    <EventForm
                        event={typeof editingEvent === 'object' ? editingEvent : undefined}
                        selectedDate={selectedDate}
                        tripId={tripId}
                        onClose={handleCloseForm}
                    />
                </Suspense>
            )}
             {duplicatingEvent && tripData && (
                <Suspense fallback={<div/>}>
                    <DuplicateEventModal
                        eventToDuplicate={duplicatingEvent}
                        trip={tripData}
                        onClose={handleCloseDuplicateModal}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default DayDetailView;
