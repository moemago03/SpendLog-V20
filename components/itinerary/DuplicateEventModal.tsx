import React, { useMemo } from 'react';
import { Trip, Event } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { useNotification } from '../../context/NotificationContext';
import { getDaysArray } from '../../utils/dateUtils';

interface DuplicateEventModalProps {
    trip: Trip;
    eventToDuplicate: Event;
    onClose: () => void;
}

const DuplicateEventModal: React.FC<DuplicateEventModalProps> = ({ trip, eventToDuplicate, onClose }) => {
    const { addEvent } = useItinerary();
    const { addNotification } = useNotification();

    const tripDays = useMemo(() => {
        return getDaysArray(trip.startDate, trip.endDate);
    }, [trip.startDate, trip.endDate]);

    const handleSelectDate = (date: string) => { // date is YYYY-MM-DD
        const { eventId, ...restOfEvent } = eventToDuplicate;
        
        const newEventData = {
            ...restOfEvent,
            eventDate: date,
            // When duplicating, force it to be a single-day event on the new date
            endDate: undefined, 
        };

        addEvent(newEventData);
        addNotification(`"${eventToDuplicate.title}" duplicato con successo!`, 'success');
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-modal-title"
        >
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 id="duplicate-modal-title" className="text-xl font-bold ml-4">Duplica Evento</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-2">
                <h2 className="text-center font-semibold text-on-surface p-4">Seleziona un giorno</h2>
                <ul className="space-y-1">
                    {tripDays.map(dateObj => (
                        <li key={dateObj.iso}>
                            <button
                                onClick={() => handleSelectDate(dateObj.iso)}
                                className="w-full p-4 rounded-2xl hover:bg-surface-variant text-left flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-on-surface">
                                        {dateObj.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    <p className="text-sm text-on-surface-variant">
                                        {dateObj.date.toLocaleDateString('it-IT', { weekday: 'long' })}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
};

export default DuplicateEventModal;