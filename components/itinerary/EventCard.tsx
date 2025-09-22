import React from 'react';
import { Event } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';

interface EventCardProps {
    event: Event;
    onEdit: () => void;
}

const EVENT_TYPE_DETAILS = {
    attraction: { icon: 'local_see', color: 'border-blue-500' },
    booking: { icon: 'flight', color: 'border-purple-500' },
    restaurant: { icon: 'restaurant', color: 'border-orange-500' },
    note: { icon: 'edit_note', color: 'border-gray-500' },
};

const EventCard: React.FC<EventCardProps> = ({ event, onEdit }) => {
    const { updateEvent } = useItinerary();
    const details = EVENT_TYPE_DETAILS[event.type];
    
    const handleStatusToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = event.status === 'planned' ? 'completed' : 'planned';
        updateEvent(event.eventId, { status: newStatus });
    };

    return (
        <div 
            onClick={onEdit}
            className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-colors duration-200 border-l-4 ${details.color} ${
                event.status === 'completed' ? 'bg-surface-variant/50' : 'bg-surface-variant'
            }`}
        >
            <div className="flex flex-col items-center flex-shrink-0 pt-1">
                 <span className={`material-symbols-outlined ${ event.status === 'completed' ? 'text-on-surface-variant/60' : 'text-primary' }`}>
                    {details.icon}
                </span>
            </div>
            <div className="flex-grow">
                <h3 className={`font-semibold text-on-surface ${event.status === 'completed' ? 'line-through text-on-surface-variant' : ''}`}>
                    {event.title}
                </h3>
                {event.description && (
                    <p className={`text-sm mt-1 ${event.status === 'completed' ? 'text-on-surface-variant/60' : 'text-on-surface-variant'}`}>
                        {event.description}
                    </p>
                )}
            </div>
            <button
                onClick={handleStatusToggle}
                className={`flex-shrink-0 w-7 h-7 mt-1 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    event.status === 'completed' 
                        ? 'bg-primary border-primary text-on-primary' 
                        : 'border-outline hover:bg-primary-container'
                }`}
                aria-label={event.status === 'completed' ? 'Marca come da fare' : 'Marca come completato'}
            >
                {event.status === 'completed' && <span className="material-symbols-outlined text-base">check</span>}
            </button>
        </div>
    );
};

export default EventCard;