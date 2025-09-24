import React, { useState, useMemo } from 'react';
import { Event, Trip, Document as DocType, TripMember } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import MemberAvatar from '../common/MemberAvatar';

interface EventFormProps {
    event?: Event;
    tripId: string;
    selectedDate: string;
    onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, tripId, selectedDate, onClose }) => {
    const { addEvent, updateEvent } = useItinerary();
    const { addNotification } = useNotification();
    const { data, addDocument, deleteDocument } = useData();

    const trip = data.trips.find(t => t.id === tripId);
    const existingDocuments = useMemo(() => {
        if (!event || !trip?.documents) return [];
        return trip.documents.filter(doc => doc.eventId === event.eventId);
    }, [trip?.documents, event]);

    const [title, setTitle] = useState(event?.title || '');
    const [type, setType] = useState(event?.type || data.categories.find(c => c.isItineraryCategory)?.name || 'Attività');
    const [eventDate, setEventDate] = useState(event?.eventDate || selectedDate);
    const [endDate, setEndDate] = useState(event?.endDate || '');
    const [startTime, setStartTime] = useState(event?.startTime || '');
    const [endTime, setEndTime] = useState(event?.endTime || '');
    const [description, setDescription] = useState(event?.description || '');
    const [location, setLocation] = useState(event?.location || '');
    const [costAmount, setCostAmount] = useState(event?.estimatedCost?.amount.toString() || '');
    const [costCurrency, setCostCurrency] = useState(event?.estimatedCost?.currency || trip?.mainCurrency || 'EUR');
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [participantIds, setParticipantIds] = useState<string[]>(event?.participantIds || trip?.members?.map(m => m.id) || []);

    const itineraryCategories = data.categories.filter(c => c.isItineraryCategory);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFilesToUpload(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const removeFileToUpload = (index: number) => {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleToggleParticipant = (memberId: string) => {
        setParticipantIds(prev =>
            prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            addNotification("Il titolo dell'evento è obbligatorio.", 'error');
            return;
        }

        const eventData = {
            tripId, title, type, eventDate,
            endDate: endDate || undefined,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
            description, location,
            status: event?.status || 'planned',
            estimatedCost: costAmount ? { amount: parseFloat(costAmount), currency: costCurrency } : undefined,
            participantIds,
        };

        let targetEventId = event?.eventId;

        if (event) {
            // FIX: Pass eventId correctly
            updateEvent(tripId, event.eventId, eventData);
        } else {
            const newEvent: Event = { ...eventData, eventId: crypto.randomUUID() };
            targetEventId = newEvent.eventId;
            addEvent(tripId, newEvent);
        }
        
        if (targetEventId && filesToUpload.length > 0) {
            for (const file of filesToUpload) {
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    if (loadEvent.target?.result) {
                        const documentData: Omit<DocType, 'id'> = {
                            tripId,
                            eventId: targetEventId,
                            name: file.name,
                            type: file.type,
                            data: loadEvent.target.result as string,
                        };
                        addDocument(tripId, documentData);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
        
        onClose();
    };

    const inputClasses = "mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-3 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">
                    {event ? 'Modifica Evento' : 'Nuovo Evento'}
                </h1>
            </header>
             <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className={labelClasses}>Titolo Evento</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClasses}/>
                    </div>

                    <div>
                        <label htmlFor="type" className={labelClasses}>Categoria</label>
                        <select id="type" value={type} onChange={e => setType(e.target.value)} required className={`${inputClasses} appearance-none`}>
                            {itineraryCategories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="eventDate" className={labelClasses}>Data Inizio</label>
                            <input id="eventDate" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required className={inputClasses}/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className={labelClasses}>Data Fine (Opz.)</label>
                            <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={eventDate} className={inputClasses}/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startTime" className={labelClasses}>Ora Inizio (Opz.)</label>
                            <input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClasses}/>
                        </div>
                        <div>
                            <label htmlFor="endTime" className={labelClasses}>Ora Fine (Opz.)</label>
                            <input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClasses}/>
                        </div>
                    </div>
                    
                     <div>
                        <label htmlFor="location" className={labelClasses}>Luogo (Opz.)</label>
                        <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClasses}/>
                    </div>

                    <div>
                        <label htmlFor="description" className={labelClasses}>Descrizione (Opz.)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses}></textarea>
                    </div>

                    <div className="flex items-end gap-3">
                        <div className="flex-grow">
                            <label htmlFor="costAmount" className={labelClasses}>Costo Stimato (Opz.)</label>
                            <input id="costAmount" type="number" step="0.01" value={costAmount} onChange={e => setCostAmount(e.target.value)} className={inputClasses}/>
                        </div>
                        <div className="w-28">
                            <label htmlFor="costCurrency" className={labelClasses}>Valuta</label>
                            <select id="costCurrency" value={costCurrency} onChange={e => setCostCurrency(e.target.value)} required className={`${inputClasses} appearance-none`}>
                                {trip?.preferredCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className={labelClasses}>Partecipanti</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {trip?.members?.map(member => (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => handleToggleParticipant(member.id)}
                                    className={`flex items-center gap-2 p-2 rounded-full transition-colors ${participantIds.includes(member.id) ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}
                                >
                                    <MemberAvatar member={member} className="w-6 h-6 text-xs" />
                                    <span className="text-sm font-medium">{member.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                     <div>
                        <label className={labelClasses}>Allega Documenti</label>
                        <div className="mt-2 space-y-2">
                            {existingDocuments.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-surface-variant/50 rounded-lg">
                                    <span className="material-symbols-outlined text-on-surface-variant mr-2">description</span>
                                    <p className="text-sm font-medium text-on-surface-variant flex-grow truncate">{doc.name}</p>
                                    <button type="button" onClick={() => deleteDocument(tripId, doc.id)} className="p-1 rounded-full text-on-surface-variant hover:bg-error-container/50 hover:text-on-error-container">
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            ))}
                            {filesToUpload.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-primary-container/30 rounded-lg">
                                    <span className="material-symbols-outlined text-primary mr-2">draft</span>
                                    <p className="text-sm font-medium text-on-primary-container flex-grow truncate">{file.name}</p>
                                    <button type="button" onClick={() => removeFileToUpload(index)} className="p-1 rounded-full text-on-primary-container hover:bg-error-container/50 hover:text-on-error-container">
                                        <span className="material-symbols-outlined text-base">close</span>
                                    </button>
                                </div>
                            ))}
                            <label htmlFor="file-upload" className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-outline/50 rounded-lg cursor-pointer hover:bg-surface-variant">
                                <span className="material-symbols-outlined text-primary">upload_file</span>
                                <span className="text-sm font-semibold text-primary">Aggiungi file</span>
                            </label>
                            <input id="file-upload" type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,application/pdf" />
                        </div>
                    </div>
                </form>
            </main>
            <footer className="p-4 border-t border-surface-variant mt-auto flex-shrink-0">
                <button type="submit" onClick={handleSubmit} className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                    {event ? 'Salva Modifiche' : 'Crea Evento'}
                </button>
            </footer>
        </div>
    );
};

export default EventForm;