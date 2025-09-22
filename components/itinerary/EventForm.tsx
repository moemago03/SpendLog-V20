
// components/itinerary/EventForm.tsx

import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Event } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { useNotification } from '../../context/NotificationContext';
import { useData } from '../../context/DataContext';
// FIX: Import getContrastColor to calculate text color based on category color.
import { getContrastColor } from '../../utils/colorUtils';

const MapView = lazy(() => import('../MapView'));

interface EventFormProps {
    event?: Event;
    selectedDate: string; // YYYY-MM-DD
    tripId: string;
    onClose: () => void;
}

const timeToMinutes = (time: string): number => {
    if (!time) return 0;
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

    useEffect(() => {
        if (!isAllDay && event?.startTime) {
            const startMins = timeToMinutes(event.startTime);
            const endMins = event.endTime ? timeToMinutes(event.endTime) : startMins + 60;
            const duration = endMins - startMins;
            const newEndMinutes = timeToMinutes(startTime) + duration;
            setEndTime(minutesToTime(newEndMinutes));
        }
    }, [startTime, isAllDay, event]);

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
    
    const DetailRow: React.FC<{ icon: string; children: React.ReactNode; }> = ({ icon, children }) => (
        <div className="flex items-center gap-4 text-on-surface font-medium py-3 border-b border-surface-variant">
            <span className="material-symbols-outlined text-on-surface-variant">{icon}</span>
            <div className="flex-grow">{children}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center justify-between p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                {event && (
                    <button type="button" onClick={handleDelete} className="p-2 rounded-full text-error hover:bg-error-container/30">
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                )}
            </header>
            
            <main className="flex-1 overflow-y-auto px-6 pb-24">
                <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        required 
                        placeholder="Nome Evento"
                        className="w-full bg-transparent text-on-surface text-4xl font-bold focus:outline-none placeholder:text-on-surface-variant/50"
                    />
                    
                    <div className="space-y-1 pt-4">
                        <p className="text-sm font-semibold text-on-surface-variant px-1">TAG</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
                            {itineraryCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setType(cat.name)}
                                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-transform active:scale-95 ${
                                        type === cat.name ? 'ring-2 ring-offset-2 ring-offset-surface' : 'opacity-70'
                                    }`}
                                     style={{ backgroundColor: cat.color, color: getContrastColor(cat.color) }}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <DetailRow icon="location_on">
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="Aggiungi luogo"
                                className="w-full bg-transparent focus:outline-none"
                            />
                        </DetailRow>
                        <DetailRow icon="schedule">
                            <div className="flex items-center justify-between w-full">
                                <span>Tutto il giorno</span>
                                 <button
                                    type="button" role="switch" aria-checked={isAllDay} onClick={() => setIsAllDay(!isAllDay)}
                                    className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors ${isAllDay ? 'bg-primary' : 'bg-on-surface/20'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAllDay ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </DetailRow>
                        <DetailRow icon="calendar_month">
                            <div className="w-full relative">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full"/>
                                <span>{new Date(startDate + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </DetailRow>

                        {!isAllDay && (
                             <DetailRow icon="access_time">
                                <div className="flex items-center justify-between w-full">
                                    <div className="relative">
                                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full"/>
                                        <span>{startTime}</span>
                                    </div>
                                    <span>-</span>
                                    <div className="relative">
                                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full"/>
                                        <span>{endTime}</span>
                                    </div>
                                </div>
                            </DetailRow>
                        )}
                        
                        {(isAllDay && startDate !== endDate) && (
                            <DetailRow icon="date_range">
                                <div className="w-full relative">
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full"/>
                                    <span>{new Date(endDate + 'T12:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </DetailRow>
                        )}

                        <DetailRow icon="notes">
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-transparent text-on-surface focus:outline-none" placeholder="Aggiungi descrizione..." />
                        </DetailRow>
                    </div>

                    {location && (
                        <div className="pt-2">
                            <Suspense fallback={<div className="h-40 bg-surface-variant rounded-xl animate-pulse" />}>
                                <MapView location={location} />
                            </Suspense>
                        </div>
                    )}
                </form>
            </main>

            <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-surface-variant mt-auto">
                <button
                    type="submit"
                    form="event-form"
                    className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow active:scale-[0.98]"
                >
                    {event ? 'Salva Modifiche' : 'Crea Evento'}
                </button>
            </footer>
        </div>
    );
};

export default EventForm;