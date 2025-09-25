import React, { useState, useMemo } from 'react';
import { Event, Expense, TripMember } from '../../types';
import { useData } from '../../context/DataContext';
import { getContrastColor } from '../../utils/colorUtils';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import MemberAvatar from '../common/MemberAvatar';
import TravelTimeEstimator from './TravelTimeEstimator';

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
    const { formatCurrency } = useCurrencyConverter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const trip = useMemo(() => data.trips.find(t => t.id === event.tripId), [data.trips, event.tripId]);
    
    const linkedExpense = useMemo(() => {
        if (!trip || !trip.expenses) return null;
        return trip.expenses.find(exp => exp.eventId === event.eventId);
    }, [trip, event.eventId]);

    const category = useMemo(() => {
        return data.categories.find(c => c.name === event.type);
    }, [data.categories, event.type]);

    const participants = useMemo(() => {
        if (!trip || !trip.members || !event.participantIds) return [];
        return trip.members.filter(m => event.participantIds?.includes(m.id));
    }, [trip, event.participantIds]);

    const bgColor = category?.color || '#757780';
    const textColor = getContrastColor(bgColor);

    const handleAddExpenseClick = () => {
        onAddExpense({
            description: event.title,
            category: event.type,
            date: event.eventDate,
            location: event.location,
            amount: event.estimatedCost?.amount,
            currency: event.estimatedCost?.currency,
            eventId: event.eventId,
        });
        setIsMenuOpen(false);
    };

    return (
        <>
            <div className="flex items-stretch">
                {/* Timeline Column */}
                <div className="flex flex-col items-center w-20 flex-shrink-0">
                    <div className="text-center">
                        {event.startTime && <p className="font-bold text-sm text-on-surface">{event.startTime}</p>}
                        {event.endTime && <p className="text-xs text-on-surface-variant">{event.endTime}</p>}
                    </div>

                    <div className="flex-grow flex flex-col items-center my-2">
                        <div className="w-px flex-grow border-l border-dashed border-on-surface-variant/50" style={{ visibility: isFirst ? 'hidden' : 'visible' }}></div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bgColor }}>
                            {category?.icon && <span className="text-xs" style={{ color: textColor }}>{category.icon}</span>}
                        </div>
                        <div className="w-px flex-grow border-l border-dashed border-on-surface-variant/50" style={{ visibility: isLast ? 'hidden' : 'visible' }}></div>
                    </div>
                </div>

                {/* Card Column */}
                <div className="flex-grow pb-8 min-w-0">
                    <div className="bg-surface p-4 rounded-2xl shadow-sm relative">
                        <div className="flex justify-between items-start">
                            <div className="min-w-0">
                                <h3 className="font-bold text-on-surface truncate">{event.title}</h3>
                                {event.location && <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1 truncate"><span className="material-symbols-outlined text-xs">location_on</span> {event.location}</p>}
                            </div>
                            <div className="relative flex-shrink-0 ml-2">
                                <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 -m-2 rounded-full text-on-surface-variant hover:bg-on-surface/10">
                                    <span className="material-symbols-outlined text-base">more_vert</span>
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute top-full right-0 mt-1 w-48 bg-inverse-surface rounded-xl shadow-lg z-10 py-1 animate-fade-in" style={{animationDuration: '150ms'}} onMouseLeave={() => setIsMenuOpen(false)}>
                                        <button onClick={handleAddExpenseClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-inverse-on-surface hover:bg-on-surface/10"><span className="material-symbols-outlined text-base">add_shopping_cart</span><span>Aggiungi Spesa</span></button>
                                        <button onClick={() => { onEdit(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-inverse-on-surface hover:bg-on-surface/10"><span className="material-symbols-outlined text-base">edit</span><span>Modifica</span></button>
                                        <button onClick={() => { onDuplicate(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-inverse-on-surface hover:bg-on-surface/10"><span className="material-symbols-outlined text-base">content_copy</span><span>Duplica</span></button>
                                        <div className="h-px bg-white/10 my-1"></div>
                                        <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20"><span className="material-symbols-outlined text-base">delete</span><span>Elimina</span></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {event.description && <p className="text-sm text-on-surface-variant mt-2">{event.description}</p>}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-outline/30">
                            {event.estimatedCost?.amount && event.estimatedCost.amount > 0 && (
                                <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium">
                                    <span className="material-symbols-outlined text-sm">payments</span>
                                    <span>{formatCurrency(event.estimatedCost.amount, event.estimatedCost.currency)}</span>
                                </div>
                            )}
                             {linkedExpense && (
                                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                                    <span className="material-symbols-outlined text-sm">receipt_long</span>
                                    <span>{formatCurrency(linkedExpense.amount, linkedExpense.currency)}</span>
                                </div>
                            )}
                            {participants.length > 0 && (
                                <div className="flex items-center -space-x-2">
                                    {participants.map(p => <MemberAvatar key={p.id} member={p} className="w-6 h-6 text-[10px]" />)}
                                </div>
                            )}
                             {event.location && (
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                                >
                                    <span className="material-symbols-outlined text-sm">navigation</span>
                                    <span>Naviga</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!isLast && nextEvent && event.location && nextEvent.location && (
                <div className="flex items-stretch h-16">
                    <div className="w-20 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <TravelTimeEstimator origin={event.location} destination={nextEvent.location} />
                    </div>
                </div>
            )}
        </>
    );
};

export default EventCard;
