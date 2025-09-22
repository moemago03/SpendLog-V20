import React, { useMemo, lazy, Suspense } from 'react';
import { Trip, Event } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { getWeekRange, getMonthRange } from '../../utils/dateUtils';

const MultiPointMapView = lazy(() => import('../MultiPointMapView'));

export type FilterMode = 'day' | '3days' | 'week' | 'month' | 'range';

export interface MapFilterState {
    mode: FilterMode;
    anchorDate: string;
    dateRange: {
        start: string;
        end: string;
    };
}

interface ItineraryMapViewProps {
    trip: Trip;
    onOpenDayDetail: (date: Date) => void;
    filter: MapFilterState;
    onFilterChange: (newFilter: MapFilterState) => void;
}

const ItineraryMapView: React.FC<ItineraryMapViewProps> = ({ trip, onOpenDayDetail, filter, onFilterChange }) => {
    const { mode, anchorDate, dateRange } = filter;
    
    const { getEventsByTrip } = useItinerary();

    const eventsWithLocation = useMemo(() => {
        let startDate: Date;
        let endDate: Date;

        const anchor = new Date(anchorDate + 'T12:00:00Z');

        switch (mode) {
            case 'day':
                startDate = new Date(anchor);
                endDate = new Date(anchor);
                break;
            case '3days':
                startDate = new Date(anchor);
                endDate = new Date(anchor);
                endDate.setDate(endDate.getDate() + 2);
                break;
            case 'week':
                const week = getWeekRange(anchor);
                startDate = week.start;
                endDate = week.end;
                break;
            case 'month':
                const month = getMonthRange(anchor);
                startDate = month.start;
                endDate = month.end;
                break;
            case 'range':
                startDate = new Date(dateRange.start + 'T00:00:00Z');
                endDate = new Date(dateRange.end + 'T23:59:59Z');
                break;
            default:
                startDate = new Date();
                endDate = new Date();
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return getEventsByTrip(trip.id)
            .filter(event => {
                if (!event.location || event.location.trim() === '') return false;
                
                const eventStart = new Date(event.eventDate + 'T00:00:00Z');
                const eventEnd = event.endDate ? new Date(event.endDate + 'T23:59:59Z') : new Date(event.eventDate + 'T23:59:59Z');

                // Check for overlap: event starts before filter ends AND event ends after filter starts
                return eventStart <= endDate && eventEnd >= startDate;
            })
            .sort((a, b) => {
                const dateDiff = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
                if (dateDiff !== 0) return dateDiff;
                return (a.startTime || '99:99').localeCompare(b.startTime || '99:99');
            });
    }, [mode, anchorDate, dateRange, trip.id, getEventsByTrip]);
    
    const locations = useMemo(() => eventsWithLocation.map(e => e.location!), [eventsWithLocation]);

    const multiStopNavUrl = useMemo(() => {
        // Limit to 10 waypoints for URL length and API limits
        const relevantEvents = eventsWithLocation.slice(0, 10);
        if (relevantEvents.length < 1) return '';
        
        const destination = encodeURIComponent(relevantEvents[relevantEvents.length - 1].location!);
        const waypoints = relevantEvents.slice(0, -1).map(e => encodeURIComponent(e.location!)).join('|');
        
        if (waypoints) {
            return `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}`;
        }
        return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }, [eventsWithLocation]);

    const EventListItem: React.FC<{ event: Event }> = ({ event }) => {
        const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.location!)}`;
        return (
            <li className="p-3 rounded-2xl bg-surface-variant flex items-start gap-3">
                <div className="flex-shrink-0 text-center w-12 pt-1">
                    {event.startTime ? (
                         <>
                            <p className="font-bold text-sm text-on-surface">{event.startTime}</p>
                            {event.endTime && <p className="text-xs text-on-surface-variant">{event.endTime}</p>}
                         </>
                    ) : (
                        <span className="material-symbols-outlined text-lg text-on-surface-variant">bookmark</span>
                    )}
                </div>
                <div className="flex-grow min-w-0">
                    <p className="font-semibold truncate text-on-surface">{event.title}</p>
                    <p className="text-xs truncate text-on-surface-variant">{event.location}</p>
                </div>
                 <div className="flex items-center flex-shrink-0 -mr-2">
                    <a 
                        href={navigateUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-2 rounded-full text-on-surface-variant hover:bg-primary-container/50"
                        aria-label="Naviga verso questo luogo"
                    >
                        <span className="material-symbols-outlined text-base">navigation</span>
                    </a>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenDayDetail(new Date(event.eventDate + 'T12:00:00Z'));
                        }}
                        className="p-2 rounded-full text-on-surface-variant"
                        aria-label="Vedi dettagli giorno"
                    >
                        <span className="material-symbols-outlined text-base">fullscreen</span>
                    </button>
                </div>
            </li>
        );
    };

    const inputClasses = "w-full bg-surface-variant text-on-surface p-3 rounded-xl border-2 border-transparent focus:border-primary focus:outline-none";
    const selectClasses = `${inputClasses} appearance-none pr-8`;

    return (
        <div className="mt-4">
            <div className="p-4 bg-surface rounded-2xl shadow-sm mb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                        <select value={mode} onChange={e => onFilterChange({ ...filter, mode: e.target.value as FilterMode })} className={selectClasses}>
                            <option value="day">Giorno specifico</option>
                            <option value="3days">3 giorni da...</option>
                            <option value="week">Settimana di...</option>
                            <option value="month">Mese di...</option>
                            <option value="range">Intervallo personalizzato</option>
                        </select>
                         <span className="material-symbols-outlined text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>
                    {mode !== 'range' && (
                        <input
                            type="date"
                            value={anchorDate}
                            onChange={(e) => onFilterChange({ ...filter, anchorDate: e.target.value })}
                            className={inputClasses}
                            min={trip.startDate.split('T')[0]}
                            max={trip.endDate.split('T')[0]}
                        />
                    )}
                </div>
                {mode === 'range' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                        <div>
                             <label className="text-xs font-medium text-on-surface-variant ml-2">Da</label>
                             <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => onFilterChange({ ...filter, dateRange: { ...filter.dateRange, start: e.target.value } })}
                                className={`${inputClasses} mt-1`}
                                min={trip.startDate.split('T')[0]}
                                max={trip.endDate.split('T')[0]}
                            />
                        </div>
                        <div>
                             <label className="text-xs font-medium text-on-surface-variant ml-2">A</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => onFilterChange({ ...filter, dateRange: { ...filter.dateRange, end: e.target.value } })}
                                className={`${inputClasses} mt-1`}
                                min={trip.startDate.split('T')[0]}
                                max={trip.endDate.split('T')[0]}
                            />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div className="h-80 lg:h-auto lg:min-h-[400px] rounded-2xl bg-surface-variant flex items-center justify-center">
                        <Suspense fallback={<div className="w-full h-full bg-surface rounded-2xl animate-pulse" />}>
                            <MultiPointMapView locations={locations} />
                        </Suspense>
                    </div>
                     {multiStopNavUrl && (
                        <a
                            href={multiStopNavUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-semibold rounded-2xl hover:opacity-90 transition-opacity shadow-lg"
                        >
                            <span className="material-symbols-outlined">route</span>
                            Naviga Percorso
                        </a>
                    )}
                </div>
                <div className="max-h-96 lg:max-h-[calc(400px+3.5rem)] overflow-y-auto">
                    {eventsWithLocation.length > 0 ? (
                        <ul className="space-y-2">
                            {eventsWithLocation.map(event => (
                                <EventListItem key={event.eventId} event={event} />
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-8 bg-surface-variant rounded-2xl h-full flex flex-col justify-center items-center">
                             <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-2">location_off</span>
                            <p className="font-semibold text-on-surface-variant">Nessun luogo da mostrare</p>
                            <p className="text-sm text-on-surface-variant/80">Nessun evento con una posizione per questo periodo.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItineraryMapView;