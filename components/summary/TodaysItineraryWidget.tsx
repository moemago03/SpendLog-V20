import React, { useMemo } from 'react';
import { useItinerary } from '../../context/ItineraryContext';
import { Category } from '../../types';
import { dateToISOString } from '../../utils/dateUtils';

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
            .filter(e => e.eventDate === todayISO)
            .sort((a, b) => {
                if (!a.startTime) return -1; // all-day events first
                if (!b.startTime) return 1;
                return a.startTime.localeCompare(b.startTime);
            });
    }, [getEventsByTrip, tripId, todayISO]);

    const getCategoryIcon = (categoryName: string) => {
        const category = allCategories.find(c => c.name === categoryName);
        return category?.icon || '📅';
    };

    const renderContent = () => {
        if (todaysEvents.length === 0) {
            return (
                <div className="text-center py-4">
                    <p className="text-sm font-medium text-on-surface-variant">Nessuna attività pianificata.</p>
                    <p className="text-xs text-on-surface-variant/80">Tocca per aggiungere qualcosa!</p>
                </div>
            );
        }

        const eventsToShow = todaysEvents.slice(0, 3);
        const remainingCount = todaysEvents.length - eventsToShow.length;

        return (
            <ul className="space-y-2">
                {eventsToShow.map(event => (
                    <li key={event.eventId} className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-on-surface-variant w-14 text-right">
                            {event.startTime ? event.startTime : 'Tutto il giorno'}
                        </span>
                        <span className="text-base">{getCategoryIcon(event.type)}</span>
                        <span className="font-medium text-on-surface truncate">{event.title}</span>
                    </li>
                ))}
                {remainingCount > 0 && (
                     <li className="text-center text-xs font-semibold text-primary pt-1">
                        ...e altri {remainingCount} eventi. Tocca per vedere il programma completo.
                    </li>
                )}
            </ul>
        );
    };

    return (
        <div 
            onClick={onNavigateToItinerary}
            className="bg-surface p-4 rounded-3xl shadow-sm cursor-pointer hover:bg-surface-variant/60 transition-colors"
            role="button"
            aria-label="Vai al programma di oggi"
        >
            <h2 className="text-xl font-semibold text-on-surface mb-3">Programma di Oggi</h2>
            {renderContent()}
        </div>
    );
};

export default TodaysItineraryWidget;
