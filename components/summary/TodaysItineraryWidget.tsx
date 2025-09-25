

import React, { useMemo } from 'react';
import { useItinerary } from '../../context/ItineraryContext';
import { Category } from '../../types';
import { dateToISOString } from '../../utils/dateUtils';
import { getContrastColor } from '../../utils/colorUtils';

interface TodaysItineraryWidgetProps {
    tripId: string;
    allCategories: Category[];
    onNavigateToItinerary: () => void;
}

const TodaysItineraryWidget: React.FC<TodaysItineraryWidgetProps> = ({ tripId, allCategories, onNavigateToItinerary }) => {
    const { getEventsByTrip } = useItinerary();
    const todayISO = useMemo(() => dateToISOString(new Date()), []);

    const todaysEvents = useMemo(() => {
        return getEventsByTrip(tripId)
            .filter(event => event.eventDate === todayISO)
            .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
    }, [getEventsByTrip, tripId, todayISO]);

    if (todaysEvents.length === 0) {
        return null;
    }
    
    return (
        <div className="bg-surface p-4 rounded-3xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-on-surface">Programma di Oggi</h2>
                <button onClick={onNavigateToItinerary} className="text-sm font-semibold text-primary">Vedi tutto</button>
            </div>
            <div className="space-y-3">
                {todaysEvents.slice(0, 3).map(event => {
                    const category = allCategories.find(c => c.name === event.type);
                    const bgColor = category?.color || '#757780';
                    const textColor = getContrastColor(bgColor);

                    return (
                        <div key={event.eventId} className="flex items-center gap-3">
                            <div className="flex-shrink-0 text-center w-14">
                                {event.startTime && <p className="font-bold text-sm text-on-surface">{event.startTime}</p>}
                            </div>
                            <div className="flex-grow p-3 rounded-2xl" style={{ backgroundColor: bgColor }}>
                                <p className="font-semibold text-sm truncate" style={{ color: textColor }}>{event.title}</p>
                                {event.location && <p className="text-xs truncate" style={{ color: textColor, opacity: 0.8 }}>{event.location}</p>}
                            </div>
                        </div>
                    );
                })}
                 {todaysEvents.length > 3 && (
                    <p className="text-center text-xs text-on-surface-variant pt-2">...e altri {todaysEvents.length - 3} eventi</p>
                )}
            </div>
        </div>
    );
};

export default TodaysItineraryWidget;