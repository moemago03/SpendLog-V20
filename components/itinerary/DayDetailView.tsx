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
const HOUR_HEIGHT = 70; // pixels per hour

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
    hasExpense: boolean;
    isBeingDragged: boolean;
    onDragStart: (e: DragEvent<HTMLDivElement>, eventId: string) => void;
    onDragEnd: (e: DragEvent<HTMLDivElement>) => void;
    onStatusToggle: (eventId: string, currentStatus: 'planned' | 'completed') => void;
    isCurrent: boolean;
    statusLabel: string | null;
}> = ({ event, onEditEvent, onAddExpense, onDuplicateEvent, timelineStartHour, hasExpense, isBeingDragged, onDragStart, onDragEnd, onStatusToggle, isCurrent, statusLabel }) => {
    const { data } = useData();
    if (!event.startTime) return null;

    const startMinutes = timeToMinutes(event.startTime);
    const endMinutes = event.endTime ? timeToMinutes(event.endTime) : startMinutes + 60;
    const durationMinutes = Math.max(15, endMinutes - startMinutes);

    const top = ((startMinutes / 60) - timelineStartHour) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT - 2;

    const category = data.categories.find(c => c.name === event.type);
    const eventColor = category?.color || '#757780';
    const textColor = getContrastColor(eventColor);
    const buttonBg = textColor === '#FFFFFF' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    
    const isCompleted = event.status === 'completed';

    return (
        <div
            draggable="true"
            onDragStart={(e) => onDragStart(e, event.eventId)}
            onDragEnd={onDragEnd}
            onClick={() => onEditEvent(event)}
            className={`absolute left-12 right-0 rounded-lg p-2.5 overflow-hidden transition-all duration-200 hover:shadow-lg cursor-grab active:cursor-grabbing ${isBeingDragged ? 'opacity-50 shadow-2xl scale-105' : ''} ${isCompleted ? 'opacity-60' : ''} ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
            style={{
                top: `${top}px`,
                height: `${height}px`,
                animation: 'zoomIn 0.3s ease-out forwards',
                backgroundColor: eventColor,
                color: textColor,
                '--tw-ring-color': eventColor
            } as React.CSSProperties}
            role="button"
            aria-label={`Edit event: ${event.title} at ${event.startTime}`}
        >
             {statusLabel && (
                <div className="absolute top-2 right-2 text-xs font-bold bg-primary text-on-primary px-2 py-0.5 rounded-full animate-fade-in z-10">
                    {statusLabel}
                </div>
            )}
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button 
                             onClick={(e) => { e.stopPropagation(); onStatusToggle(event.eventId, event.status); }}
                             className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200`}
                             style={{
                                borderColor: textColor,
                                backgroundColor: isCompleted ? textColor : 'transparent'
                             }}
                        >
                            {isCompleted && <span className="material-symbols-outlined text-xs" style={{ color: eventColor }}>check</span>}
                        </button>
                        <p className={`font-bold text-sm leading-tight flex-1 ${isCompleted ? 'line-through' : ''}`}>{event.title}</p>
                    </div>
                    {hasExpense && <span className="text-xs font-bold bg-white/80 text-black px-1.5 py-0.5 rounded-full -mr-1 -mt-1 flex-shrink-0">€</span>}
                </div>
                <p className="text-xs opacity-80 pl-7">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</p>
                 {event.description && <p className="text-xs opacity-70 mt-1 truncate pl-7">{event.description}</p>}
            </div>
             <div className="absolute bottom-2 right-2 flex items-center gap-1">
                 {event.location && (
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-7 h-7 rounded-full flex items-center justify-center shadow"
                        style={{ backgroundColor: buttonBg, color: textColor }}
                        aria-label="Naviga"
                    >
                         <span className="material-symbols-outlined text-sm">navigation</span>
                    </a>
                 )}
                 <button
                    onClick={(e) => { e.stopPropagation(); onDuplicateEvent(event); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow"
                    style={{ backgroundColor: buttonBg, color: textColor }}
                    aria-label="Duplica evento"
                >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
                 <button
                    onClick={(e) => { e.stopPropagation(); onAddExpense(event); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center shadow"
                    style={{ backgroundColor: buttonBg, color: textColor }}
                    aria-label="Aggiungi spesa"
                >
                    <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                </button>
            </div>
        </div>
    );
};

const TravelTimeCard: React.FC<{
    fromEvent: Event;
    toEvent: Event;
    timelineStartHour: number;
    calculatedTime: number | null;
    onCalculate: () => void;
}> = ({ fromEvent, toEvent, timelineStartHour, calculatedTime, onCalculate }) => {
    if (!fromEvent.endTime || !toEvent.startTime) return null;

    const startMinutes = timeToMinutes(fromEvent.endTime);
    const endMinutes = timeToMinutes(toEvent.startTime);
    const gapMinutes = endMinutes - startMinutes;

    if (gapMinutes <= 5) return null; // No gap or too small, don't show

    const top = ((startMinutes / 60) - timelineStartHour) * HOUR_HEIGHT;
    const height = (gapMinutes / 60) * HOUR_HEIGHT;

    return (
        <div
            className="absolute left-12 right-0 flex items-center justify-center"
            style={{ top: `${top}px`, height: `${height}px` }}
        >
            <div className="relative w-full h-full">
                <div className="absolute top-2 bottom-2 left-[-21px] w-0.5 border-l-2 border-dashed border-primary/50"></div>
                <div className="flex items-center justify-center h-full">
                    {calculatedTime === null ? (
                        <button
                            onClick={onCalculate}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-secondary-container text-on-secondary-container rounded-full shadow-sm hover:opacity-80 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-sm">directions_car</span>
                            Calcola tempo
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-surface-variant text-on-surface-variant rounded-full">
                            <span className="material-symbols-outlined text-base">more_time</span>
                            <span>~ {calculatedTime} min</span>
                        </div>
                    )}
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
    travelTimes: Record<string, number | null>;
    onCalculateTravelTime: (fromEventId: string, toEventId: string) => void;
    onStatusToggle: (eventId: string, currentStatus: 'planned' | 'completed') => void;
    currentEvent: Event | null;
    currentEventStatus: string | null;
    // Drag & Drop props
    draggedEventId: string | null;
    dropIndicatorPosition: number | null;
    onDragStart: (e: DragEvent<HTMLDivElement>, eventId: string) => void;
    onDragEnd: (e: DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
}

const Timeline: React.FC<TimelineProps> = ({ events, onEditEvent, onAddExpense, onDuplicateEvent, startHour, endHour, expenses, travelTimes, onCalculateTravelTime, onStatusToggle, currentEvent, currentEventStatus, ...dragProps }) => {
    const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);

    return (
        <div 
            className="relative"
            onDragOver={dragProps.onDragOver}
            onDrop={dragProps.onDrop}
            onDragLeave={dragProps.onDragLeave}
        >
            {hours.map(hour => (
                <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                    <div className="absolute -left-1 top-[-8px] text-xs font-medium text-on-surface-variant w-10 text-right pr-2">
                        {hour < 10 ? `0${hour}` : hour}:00
                    </div>
                    <div className="h-px bg-surface-variant ml-10"></div>
                </div>
            ))}
             {dragProps.dropIndicatorPosition !== null && (
                <div 
                    className="absolute left-10 right-0 h-0.5 bg-primary z-10 pointer-events-none"
                    style={{ top: `${dragProps.dropIndicatorPosition}px` }}
                />
            )}

            <div className="absolute top-0 left-0 right-0 bottom-0">
                {events.map(event => {
                    const hasExpense = expenses.some(e => e.eventId === event.eventId);
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
                            hasExpense={hasExpense}
                            isBeingDragged={dragProps.draggedEventId === event.eventId}
                            onDragStart={dragProps.onDragStart}
                            onDragEnd={dragProps.onDragEnd}
                            onStatusToggle={onStatusToggle}
                            isCurrent={isCurrent}
                            statusLabel={statusLabel}
                         />
                    );
                })}
                {events.map((event, index) => {
                    if (index < events.length - 1) {
                        const nextEvent = events[index + 1];
                        if (event.location && nextEvent.location) {
                            const key = `${event.eventId}_${nextEvent.eventId}`;
                            return (
                                <TravelTimeCard
                                    key={key}
                                    fromEvent={event}
                                    toEvent={nextEvent}
                                    timelineStartHour={startHour}
                                    calculatedTime={travelTimes[key] ?? null}
                                    onCalculate={() => onCalculateTravelTime(event.eventId, nextEvent.eventId)}
                                />
                            );
                        }
                    }
                    return null;
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
    hasExpense: boolean;
    onStatusToggle: (eventId: string, currentStatus: 'planned' | 'completed') => void;
}

const AllDayEventPill: React.FC<AllDayEventPillProps> = ({ event, onEditEvent, onAddExpense, onDuplicateEvent, hasExpense, onStatusToggle }) => {
    const { data } = useData();
    const category = data.categories.find(c => c.name === event.type);
    const bgColor = category?.color || '#9E9E9E';
    const textColor = getContrastColor(bgColor);
    const isCompleted = event.status === 'completed';

    return (
        <div
            className={`w-full p-2 rounded-lg flex items-center gap-2 transition-opacity ${isCompleted ? 'opacity-60' : ''}`}
            style={{ backgroundColor: bgColor, color: textColor }}
        >
             <button 
                onClick={(e) => { e.stopPropagation(); onStatusToggle(event.eventId, event.status); }}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200`}
                style={{ borderColor: textColor, backgroundColor: isCompleted ? textColor : 'transparent' }}
            >
                {isCompleted && <span className="material-symbols-outlined text-xs" style={{ color: bgColor }}>check</span>}
            </button>
            <div onClick={() => onEditEvent(event)} className="flex-grow cursor-pointer flex items-center gap-2 min-w-0">
                {hasExpense && <span className="text-xs font-bold bg-white/80 text-black px-1.5 py-0.5 rounded-full">€</span>}
                <p className={`font-bold text-sm truncate ${isCompleted ? 'line-through' : ''}`}>{event.title}</p>
            </div>
             <div className="flex items-center gap-1">
                {event.location && (
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-white/20 dark:bg-black/20 rounded-full hover:bg-white/40"
                        aria-label="Naviga"
                        style={{ color: textColor }}
                    >
                        <span className="material-symbols-outlined text-sm">navigation</span>
                    </a>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDuplicateEvent(event); }}
                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-white/20 dark:bg-black/20 rounded-full hover:bg-white/40"
                    aria-label="Duplica evento"
                    style={{ color: textColor }}
                >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onAddExpense(event); }}
                    className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-white/20 dark:bg-black/20 rounded-full hover:bg-white/40"
                    aria-label="Aggiungi spesa"
                    style={{ color: textColor }}
                >
                    <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                </button>
            </div>
        </div>
    );
};


interface DayDetailViewProps {
    tripId: string;
    selectedDate: string; // YYYY-MM-DD
    onClose: () => void;
    onAddExpense: (prefill: Partial<Expense>) => void;
    isEmbedded?: boolean;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({ tripId, selectedDate, onClose, onAddExpense, isEmbedded = false }) => {
    const { getEventsByTrip, updateEvent } = useItinerary();
    const { data } = useData();
    const { convert, formatCurrency } = useCurrencyConverter();
    const [editingEvent, setEditingEvent] = useState<Event | null | 'new'>(null);
    const [duplicatingEvent, setDuplicatingEvent] = useState<Event | null>(null);
    const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
    const [dropIndicatorPosition, setDropIndicatorPosition] = useState<number | null>(null);
    const [travelTimes, setTravelTimes] = useState<Record<string, number | null>>({});
    const timelineRef = useRef<HTMLDivElement>(null);

    const tripData = data.trips.find(t => t.id === tripId);
    const expenses = tripData?.expenses || [];

    const date = useMemo(() => new Date(selectedDate + 'T12:00:00Z'), [selectedDate]);
    const todayISO = useMemo(() => dateToISOString(new Date()), []);
    const isToday = selectedDate === todayISO;


    const { timedEvents, allDayEvents, timelineStartHour, timelineEndHour, dayTotal } = useMemo(() => {
        const allTripEvents = getEventsByTrip(tripId);
        const eventsForDay = allTripEvents.filter(event => event.eventDate === selectedDate);
        
        const timed = eventsForDay
            .filter(event => !!event.startTime)
            .sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
            
        const allDay = eventsForDay.filter(event => !event.startTime);
        
        const expensesForDay = expenses.filter(e => e.date.startsWith(selectedDate));
        const total = expensesForDay.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, tripData!.mainCurrency), 0);

        let startHour = 8;
        let endHour = 17;

        if (timed.length > 0) {
            const allTimesInMinutes = timed.flatMap(event => {
                const start = timeToMinutes(event.startTime!);
                const end = event.endTime ? timeToMinutes(event.endTime) : start + 60;
                return [start, end];
            });
            const minMinutes = Math.min(...allTimesInMinutes);
            const maxMinutes = Math.max(...allTimesInMinutes);
            startHour = Math.max(0, Math.floor(minMinutes / 60) - 1);
            endHour = Math.min(24, Math.ceil(maxMinutes / 60) + 1);
            if (endHour - startHour < 8) endHour = startHour + 8;
        }

        return { timedEvents: timed, allDayEvents: allDay, timelineStartHour: startHour, timelineEndHour: endHour, dayTotal: total };
    }, [getEventsByTrip, tripId, selectedDate, expenses, convert, tripData]);

     const { currentEvent, currentEventStatus } = useMemo(() => {
        if (!isToday) return { currentEvent: null, currentEventStatus: null };

        const now = new Date();
        const nowInMinutes = now.getHours() * 60 + now.getMinutes();
        
        if (timedEvents.length === 0) {
            return { currentEvent: allDayEvents[0] || null, currentEventStatus: 'ALL_DAY' };
        }

        const relevantEvent = timedEvents.find(e => {
            const startMinutes = timeToMinutes(e.startTime!);
            const endMinutes = e.endTime ? timeToMinutes(e.endTime) : startMinutes + 60;
            return endMinutes > nowInMinutes; 
        });
        
        if (relevantEvent) {
            const startMinutes = timeToMinutes(relevantEvent.startTime!);
            const status = nowInMinutes >= startMinutes ? 'LIVE' : 'NEXT';
            return { currentEvent: relevantEvent, currentEventStatus: status };
        }
        
        const lastEvent = timedEvents[timedEvents.length - 1];
        return { currentEvent: lastEvent || null, currentEventStatus: 'DONE' };

    }, [isToday, timedEvents, allDayEvents]);
    
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

    const handleCalculateTravelTime = useCallback((fromEventId: string, toEventId: string) => {
        const mockMinutes = Math.floor(Math.random() * 35) + 10;
        const key = `${fromEventId}_${toEventId}`;
        setTravelTimes(prev => ({ ...prev, [key]: mockMinutes }));
    }, []);

    // --- Drag & Drop Logic ---
    const handleEventReposition = useCallback((eventId: string, newStartTime: string) => {
        const eventToMove = timedEvents.find(e => e.eventId === eventId);
        if (!eventToMove || !eventToMove.startTime) return;

        const startMinutes = timeToMinutes(eventToMove.startTime);
        const endMinutes = eventToMove.endTime ? timeToMinutes(eventToMove.endTime) : startMinutes + 60;
        const durationMinutes = endMinutes - startMinutes;

        const newStartMinutes = timeToMinutes(newStartTime);
        const newEndMinutes = newStartMinutes + durationMinutes;

        const updates: { eventId: string; changes: Partial<Event> }[] = [];

        const movedEvent = {
            ...eventToMove,
            startTime: newStartTime,
            endTime: minutesToTime(newEndMinutes),
        };
        updates.push({ eventId: eventToMove.eventId, changes: { startTime: movedEvent.startTime, endTime: movedEvent.endTime } });
        
        let updatedEvents = timedEvents
            .map(e => e.eventId === eventId ? movedEvent : e)
            .sort((a, b) => (a.startTime!).localeCompare(b.startTime!));

        for (let i = 1; i < updatedEvents.length; i++) {
            const prevEvent = updatedEvents[i - 1];
            const currentEvent = updatedEvents[i];
            
            if (!prevEvent.startTime || !currentEvent.startTime) continue;
            
            const prevStartMins = timeToMinutes(prevEvent.startTime);
            const prevEndMins = prevEvent.endTime ? timeToMinutes(prevEvent.endTime) : prevStartMins + 60;
            
            const currentStartMins = timeToMinutes(currentEvent.startTime);

            if (currentStartMins < prevEndMins) {
                const currentDuration = currentEvent.endTime ? (timeToMinutes(currentEvent.endTime) - currentStartMins) : 60;
                const newCurrentStartMins = prevEndMins;
                
                const newTimes = {
                    startTime: minutesToTime(newCurrentStartMins),
                    endTime: minutesToTime(newCurrentStartMins + currentDuration),
                };

                updatedEvents[i] = { ...currentEvent, ...newTimes };
                updates.push({ eventId: currentEvent.eventId, changes: newTimes });
            }
        }
        
        updates.forEach(u => updateEvent(u.eventId, u.changes));
    }, [timedEvents, updateEvent]);
    
    const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, eventId: string) => {
        e.dataTransfer.setData('text/plain', eventId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggedEventId(eventId), 0);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedEventId(null);
    }, []);
    
    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            setDropIndicatorPosition(y);
        }
    }, []);
    
    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const eventId = e.dataTransfer.getData('text/plain');
        if (timelineRef.current && eventId) {
            const rect = timelineRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minutesFromTop = (y / HOUR_HEIGHT) * 60;
            const totalMinutes = Math.round(((timelineStartHour * 60) + minutesFromTop) / 15) * 15; // Snap to 15 mins
            const newStartTime = minutesToTime(totalMinutes);
            
            handleEventReposition(eventId, newStartTime);
        }
        setDropIndicatorPosition(null);
    }, [timelineStartHour, handleEventReposition]);

    const handleDragLeave = useCallback(() => {
        setDropIndicatorPosition(null);
    }, []);

    const containerClasses = isEmbedded
        ? "mt-4"
        : "fixed inset-0 bg-background z-40 flex flex-col animate-[slide-in-up_0.4s_cubic-bezier(0.25,1,0.5,1)]";

    return (
        <div className={containerClasses}>
             <style>{`
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes slide-in-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
            `}</style>

            {!isEmbedded && (
                <header className={`flex items-center p-4 flex-shrink-0 ${!isEmbedded && 'border-b border-surface-variant'}`}>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="ml-4">
                        <h1 className="text-xl font-bold capitalize">
                            {date.toLocaleString('it-IT', { day:'numeric', month: 'long', year: 'numeric' })}
                        </h1>
                        {dayTotal > 0 && <p className="text-sm font-semibold text-primary -mt-1">{formatCurrency(dayTotal, tripData!.mainCurrency)} spesi</p>}
                    </div>
                </header>
            )}
            
            <main className={isEmbedded ? "" : "flex-1 overflow-y-auto"}>
                <div className="flex items-start gap-2 px-2 py-4 border-b border-surface-variant">
                    <div className="w-12 text-center flex-shrink-0">
                        <p className="text-sm font-semibold uppercase text-on-surface-variant">
                            {date.toLocaleDateString('it-IT', { weekday: 'short' })}
                        </p>
                        <p className="text-3xl font-bold text-on-surface">
                            {date.getDate()}
                        </p>
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                        {allDayEvents.map(event => {
                             const hasExpense = expenses.some(e => e.eventId === event.eventId);
                            return <AllDayEventPill key={event.eventId} event={event} onEditEvent={() => handleOpenForm(event)} onAddExpense={handleAddExpenseForEvent} onDuplicateEvent={handleOpenDuplicateModal} hasExpense={hasExpense} onStatusToggle={handleStatusToggle} />
                        })}
                         <div className="h-8 border-2 border-primary/50 border-dashed rounded-lg flex items-center justify-center text-primary/70 cursor-pointer hover:bg-primary-container/20" onClick={() => handleOpenForm('new')}>
                            <span className="text-sm font-medium">Aggiungi evento</span>
                        </div>
                    </div>
                </div>

                <div className="px-2" ref={timelineRef}>
                    <Timeline events={timedEvents} onEditEvent={handleOpenForm} onAddExpense={handleAddExpenseForEvent} onDuplicateEvent={handleOpenDuplicateModal} startHour={timelineStartHour} endHour={timelineEndHour} expenses={expenses}
                        travelTimes={travelTimes}
                        onCalculateTravelTime={handleCalculateTravelTime}
                        onStatusToggle={handleStatusToggle}
                        currentEvent={currentEvent}
                        currentEventStatus={currentEventStatus}
                        draggedEventId={draggedEventId}
                        dropIndicatorPosition={dropIndicatorPosition}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragLeave={handleDragLeave}
                    />
                </div>
            </main>
            
            {!isEmbedded && (
                <button
                    onClick={() => handleOpenForm('new')}
                    className="fixed bottom-6 right-6 h-14 w-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 z-20"
                    aria-label="Aggiungi evento"
                >
                    <span className="material-symbols-outlined text-2xl">add</span>
                </button>
            )}
            
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