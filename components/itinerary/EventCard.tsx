import React, { useState, lazy, Suspense, useMemo } from 'react';
import { Event, Expense, Document as DocType } from '../../types';
import { useData } from '../../context/DataContext';
import { getContrastColor } from '../../utils/colorUtils';

const TravelTimeEstimator = lazy(() => import('./TravelTimeEstimator'));
const DocumentViewerModal = lazy(() => import('../common/DocumentViewerModal'));

interface EventCardProps {
    event: Event;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onAddExpense: (prefill: Partial<Expense>) => void;
    isFirst: boolean;
    isLast: boolean;
    nextEvent?: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete, onDuplicate, onAddExpense, isFirst, isLast, nextEvent }) => {
    const { data } = useData();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewingDocument, setViewingDocument] = useState<DocType | null>(null);
    const category = data.categories.find(c => c.name === event.type);
    const bgColor = category?.color || '#757780';

    const documents = useMemo(() => {
        const trip = data.trips.find(t => t.id === event.tripId);
        return (trip?.documents || []).filter(d => d.eventId === event.eventId);
    }, [data.trips, event.tripId, event.eventId]);

    const handleAddExpenseClick = () => {
        onAddExpense({
            description: event.title,
            category: event.type,
            date: event.eventDate,
            location: event.location,
            eventId: event.eventId,
        });
    };

    return (
        <>
            <div className="flex items-start">
                <div className="flex flex-col items-center self-stretch w-20 flex-shrink-0">
                    <div className="text-center">
                        {event.startTime && <p className="font-bold text-sm text-on-surface">{event.startTime}</p>}
                        {event.endTime && <p className="text-xs text-on-surface-variant -mt-1">{event.endTime}</p>}
                    </div>
                    <div className="relative flex-grow w-full flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-2 ring-4 ring-surface z-10`} style={{ backgroundColor: bgColor }}></div>
                        {!isLast && <div className="absolute top-2 bottom-0 w-px bg-on-surface-variant/30"></div>}
                    </div>
                </div>
                <div className="flex-grow min-w-0 pb-6">
                    <div className="relative -mt-1 bg-surface-variant rounded-2xl p-4 shadow-sm animate-slide-in-up">
                        <div className="flex justify-between items-start">
                            <div className="min-w-0">
                                <h3 className="font-semibold text-on-surface truncate">{event.title}</h3>
                                {event.location && <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-xs">location_on</span>{event.location}</p>}
                            </div>
                            <div className="relative flex-shrink-0">
                                <button onClick={() => setIsMenuOpen(true)} className="p-2 -m-2 rounded-full text-on-surface-variant hover:bg-on-surface/10"><span className="material-symbols-outlined text-base">more_vert</span></button>
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                                        <div className="absolute top-full right-0 mt-1 w-48 bg-inverse-surface rounded-xl shadow-lg z-20 py-1 animate-fade-in" style={{ animationDuration: '150ms' }}>
                                            <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-inverse-on-surface hover:bg-on-surface/10"><span className="material-symbols-outlined text-base">edit</span>Modifica</button>
                                            <button onClick={() => { onDuplicate(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-inverse-on-surface hover:bg-on-surface/10"><span className="material-symbols-outlined text-base">content_copy</span>Duplica</button>
                                            <button onClick={() => { handleAddExpenseClick(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-inverse-on-surface hover:bg-on-surface/10"><span className="material-symbols-outlined text-base">add_shopping_cart</span>Aggiungi Spesa</button>
                                            <div className="my-1 h-px bg-outline/20"></div>
                                            <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20"><span className="material-symbols-outlined text-base">delete</span>Elimina</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        {event.description && <p className="text-sm text-on-surface-variant mt-2">{event.description}</p>}
                        {documents.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-outline/20 flex flex-wrap gap-2">
                                {documents.map(doc => (
                                    <button key={doc.id} onClick={() => setViewingDocument(doc)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-secondary-container text-on-secondary-container rounded-full hover:opacity-80 transition-opacity">
                                        <span className="material-symbols-outlined text-sm">attachment</span>
                                        {doc.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {!isLast && nextEvent && event.location && nextEvent.location && (
                        <div className="h-16 w-full flex justify-center items-center">
                            <div className="h-full w-20 flex justify-center flex-shrink-0">
                                <Suspense fallback={<div className="w-6 h-6 border-2 border-t-primary border-surface-variant rounded-full animate-spin"></div>}>
                                    <TravelTimeEstimator origin={event.location} destination={nextEvent.location} />
                                </Suspense>
                            </div>
                            <div className="flex-grow"></div>
                        </div>
                    )}
                </div>
            </div>
            {viewingDocument && (
                <Suspense fallback={<div/>}>
                    <DocumentViewerModal document={viewingDocument} onClose={() => setViewingDocument(null)} />
                </Suspense>
            )}
        </>
    );
};

export default EventCard;
