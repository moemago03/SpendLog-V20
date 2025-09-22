// components/itinerary/EventForm.tsx

import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Event } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { useNotification } from '../../context/NotificationContext';
import { useData } from '../../context/DataContext';

const MapView = lazy(() => import('../MapView'));

interface EventFormProps {
    event?: Event;
    selectedDate: string; // YYYY-MM-DD
    tripId: string;
    onClose: () => void;
}

const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};

const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const EventForm: React.FC<EventFormProps> = ({ event, selectedDate, tripId, onClose }) => {
    const { addEvent, updateEvent, deleteEvent } = useItinerary();
    const { addNotification } = useNotification();
    const { data } = useData();

    const itineraryCategories = useMemo(() => {
        return data.categories.filter(c => c.isItineraryCategory);
    }, [data.categories]);

    const [title, setTitle] = useState(event?.title || '');
    const [type, setType] = useState<string>(event?.type || itineraryCategories[0]?.name || 'Varie');
    const [description, setDescription] = useState(event?.description || '');
    const [location, setLocation] = useState(event?.location || '');
    const [isAllDay, setIsAllDay] = useState(event ? !event.startTime : false);
    
    const [startDate, setStartDate] = useState(event?.eventDate || selectedDate);
    const [endDate, setEndDate] = useState(event?.endDate || event?.eventDate || selectedDate);
    
    const [startTime, setStartTime] = useState(event?.startTime || '09:00');
    const [endTime, setEndTime] = useState(event?.endTime || '10:00');

    // Auto-adjust end time when start time changes, maintaining a 1-hour duration
    useEffect(() => {
        if (!isAllDay) {
            const newEndMinutes = timeToMinutes(startTime) + 60;
            setEndTime(minutesToTime(newEndMinutes));
        }
    }, [startTime, isAllDay]);

    // Ensure end date is not before start date
    useEffect(() => {
        if (new Date(endDate) < new Date(startDate)) {
            setEndDate(startDate);
        }
    }, [startDate, endDate]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            addNotification("Il titolo è obbligatorio.", 'error');
            return;
        }

        const eventData = {
            tripId,
            eventDate: startDate,
            endDate: (isAllDay && startDate !== endDate) ? endDate : (isAllDay ? undefined : endDate),
            title,
            type,
            startTime: isAllDay ? undefined : startTime,
            endTime: isAllDay ? undefined : (startTime === endTime ? undefined : endTime),
            description: description.trim() || undefined,
            location: location.trim() || undefined,
            status: 'planned' as 'planned',
        };

        if (event) {
            updateEvent(event.eventId, { ...eventData, status: event.status });
            addNotification("Evento aggiornato!", 'success');
        } else {
            addEvent(eventData);
            addNotification("Evento aggiunto!", 'success');
        }
        onClose();
    };
    
    const handleDelete = () => {
        if (event && window.confirm("Sei sicuro di voler eliminare questo evento?")) {
            deleteEvent(event.eventId);
            addNotification("Evento eliminato.", 'info');
            onClose();
        }
    };
    
    const DateInputRow: React.FC<{ date: string, time?: string, onDateChange: (d: string) => void, onTimeChange?: (t: string) => void }> = ({ date, time, onDateChange, onTimeChange }) => {
        const d = new Date(date + 'T12:00:00Z');
        const formattedDate = d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        
        return (
            <div className="flex items-center justify-between text-on-surface font-medium">
                <div className="relative">
                    <input type="date" value={date} onChange={e => onDateChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full"/>
                    <span>{formattedDate}</span>
                </div>
                {time !== undefined && onTimeChange && (
                     <div className="relative">
                        <input type="time" value={time} onChange={e => onTimeChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full"/>
                        <span>{time}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="flex-grow" />
                <button type="submit" form="event-form" className="px-6 py-2 bg-primary text-on-primary font-bold rounded-full">
                    Salva
                </button>
            </header>
            
            <main className="flex-1 overflow-y-auto px-4">
                <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        required 
                        placeholder="Aggiungi titolo"
                        className="w-full bg-transparent text-on-surface text-3xl font-bold focus:outline-none placeholder:text-on-surface-variant/70"
                    />
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                        {itineraryCategories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setType(cat.name)}
                                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                    type === cat.name ? '' : 'bg-surface-variant text-on-surface-variant'
                                }`}
                                 style={type === cat.name ? { backgroundColor: cat.color, color: 'white' } : {}}
                            >
                                {cat.icon}
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    
                    <div className="space-y-2 py-2 border-y border-surface-variant">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-on-surface font-medium">
                                <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                                <span>Tutto il giorno</span>
                            </div>
                            <button
                                type="button" role="switch" aria-checked={isAllDay} onClick={() => setIsAllDay(!isAllDay)}
                                className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${isAllDay ? 'bg-primary' : 'bg-on-surface/20'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAllDay ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        {isAllDay ? (
                            <>
                                <DateInputRow date={startDate} onDateChange={setStartDate} />
                                <DateInputRow date={endDate} onDateChange={setEndDate} />
                            </>
                        ) : (
                            <>
                                <DateInputRow date={startDate} time={startTime} onDateChange={setStartDate} onTimeChange={setStartTime} />
                                <DateInputRow date={endDate} time={endTime} onDateChange={setEndDate} onTimeChange={setEndTime} />
                            </>
                        )}
                    </div>
                    
                     <div className="flex items-center gap-3 text-on-surface font-medium p-3 bg-surface-variant/50 rounded-xl">
                        <span className="material-symbols-outlined text-on-surface-variant">location_on</span>
                        <input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="Aggiungi luogo"
                            className="w-full bg-transparent focus:outline-none"
                        />
                    </div>
                    
                    <div className="flex items-start gap-3 text-on-surface font-medium p-3 bg-surface-variant/50 rounded-xl">
                         <span className="material-symbols-outlined text-on-surface-variant mt-1">notes</span>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-transparent text-on-surface focus:outline-none" placeholder="Aggiungi descrizione..." />
                    </div>
                    
                    {event?.location && (
                        <div className="pt-2">
                            <Suspense fallback={<div className="h-40 bg-surface-variant rounded-xl animate-pulse" />}>
                                <MapView location={event.location} />
                            </Suspense>
                        </div>
                    )}

                    {event && (
                         <button type="button" onClick={handleDelete} className="w-full flex items-center justify-center gap-2 p-3 text-error font-semibold hover:bg-error-container/30 rounded-xl">
                            <span className="material-symbols-outlined">delete</span>
                            Elimina Evento
                        </button>
                    )}
                </form>
            </main>
        </div>
    );
};

export default EventForm;