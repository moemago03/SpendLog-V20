import React, { useState, useMemo } from 'react';
import { ChecklistItem, Trip } from '../../types';
import { useData } from '../../context/DataContext';
import { useItinerary } from '../../context/ItineraryContext';
import { useNotification } from '../../context/NotificationContext';
import MemberAvatar from '../common/MemberAvatar';

interface ChecklistItemDetailModalProps {
    item: ChecklistItem;
    trip: Trip;
    onClose: () => void;
}

const ChecklistItemDetailModal: React.FC<ChecklistItemDetailModalProps> = ({ item, trip, onClose }) => {
    const { updateChecklistItem, deleteChecklistItem } = useData();
    const { getEventsByTrip } = useItinerary();
    const { addNotification } = useNotification();

    const [text, setText] = useState(item.text);
    const [reminderEventId, setReminderEventId] = useState<string | undefined>(item.reminderEventId);
    const [assignedToMemberId, setAssignedToMemberId] = useState<string | undefined>(item.assignedToMemberId);
    
    const upcomingEvents = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return getEventsByTrip(trip.id)
            .filter(event => new Date(event.eventDate) >= now)
            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    }, [getEventsByTrip, trip.id]);

    const handleSave = () => {
        if (!text.trim()) {
            addNotification("Il testo non può essere vuoto.", 'error');
            return;
        }
        updateChecklistItem(trip.id, {
            ...item,
            text: text.trim(),
            reminderEventId: reminderEventId || undefined,
            assignedToMemberId: assignedToMemberId || undefined,
        });
        addNotification("Elemento aggiornato.", 'success');
        onClose();
    };
    
    const handleDelete = () => {
        if (window.confirm("Sei sicuro di voler eliminare questo elemento?")) {
            deleteChecklistItem(trip.id, item.id);
            addNotification("Elemento eliminato.", 'info');
            onClose();
        }
    };
    
    const selectedEvent = useMemo(() => {
        return upcomingEvents.find(e => e.eventId === reminderEventId);
    }, [upcomingEvents, reminderEventId]);
    
    return (
         <div className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center justify-between p-4 flex-shrink-0">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <button onClick={handleDelete} className="p-2 rounded-full text-error hover:bg-error-container/30">
                    <span className="material-symbols-outlined">delete</span>
                </button>
            </header>
            
            <main className="flex-1 overflow-y-auto px-6 pb-24">
                <div className="max-w-2xl mx-auto space-y-8">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-transparent text-on-surface text-3xl font-bold focus:outline-none placeholder:text-on-surface-variant/50"
                    />

                    {item.isGroupItem && (
                        <div>
                            <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">assignment_ind</span>
                                Assegna a
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setAssignedToMemberId(undefined)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-2xl w-20 h-20 transition-colors ${!assignedToMemberId ? 'bg-primary-container text-on-primary-container ring-2 ring-primary' : 'bg-surface-variant text-on-surface-variant'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-on-surface/10 flex items-center justify-center mb-1">
                                        <span className="material-symbols-outlined">person_off</span>
                                    </div>
                                    <span className="text-xs font-semibold">Nessuno</span>
                                </button>
                                {trip.members?.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setAssignedToMemberId(member.id)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-2xl w-20 h-20 transition-colors ${assignedToMemberId === member.id ? 'bg-primary-container text-on-primary-container ring-2 ring-primary' : 'bg-surface-variant text-on-surface-variant'}`}
                                    >
                                        <MemberAvatar member={member} className="mb-1" />
                                        <span className="text-xs font-semibold truncate w-full">{member.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
                             <span className="material-symbols-outlined text-primary">alarm</span>
                             Promemoria Intelligente
                        </h2>
                        <p className="text-sm text-on-surface-variant mb-4">
                            Collega questo elemento a un evento. Riceverai una notifica 24 ore prima.
                        </p>
                        <div className="relative">
                            <select
                                value={reminderEventId || ''}
                                onChange={e => setReminderEventId(e.target.value || undefined)}
                                className="w-full bg-surface-variant text-on-surface text-base p-4 rounded-2xl border-2 border-transparent focus:border-primary focus:outline-none appearance-none"
                            >
                                <option value="">Nessun promemoria</option>
                                {upcomingEvents.map(event => (
                                    <option key={event.eventId} value={event.eventId}>
                                        {new Date(event.eventDate + "T12:00:00").toLocaleDateString('it-IT', {day: 'numeric', month: 'short'})} - {event.title}
                                    </option>
                                ))}
                            </select>
                             <span className="material-symbols-outlined text-on-surface-variant absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">unfold_more</span>
                        </div>
                        {selectedEvent && (
                            <p className="text-xs text-on-surface-variant mt-2 px-2">
                                Promemoria impostato per l'evento del {new Date(selectedEvent.eventDate + "T12:00:00").toLocaleDateString('it-IT', {weekday: 'long', day: 'numeric', month: 'long'})}.
                            </p>
                        )}
                    </div>
                </div>
            </main>

            <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-surface-variant mt-auto">
                <button onClick={handleSave} className="w-full max-w-2xl mx-auto bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                    Salva Modifiche
                </button>
            </footer>
        </div>
    );
};

export default ChecklistItemDetailModal;