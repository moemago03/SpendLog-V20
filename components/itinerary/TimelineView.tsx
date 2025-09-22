// components/itinerary/TimelineView.tsx

import React, { useMemo } from 'react';
import { Trip, Event } from '../../types';
import { useItinerary } from '../../context/ItineraryContext';
import { getDaysArray, dateToISOString } from '../../utils/dateUtils';
import { useData } from '../../context/DataContext';
import { getContrastColor } from '../../utils/colorUtils';

interface TimelineViewProps {
    trip: Trip;
    onOpenDayDetail: (date: Date) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({ trip, onOpenDayDetail }) => {
    const { getEventsByTrip } = useItinerary();
    const { data } = useData();

    const tripDays = useMemo(() => getDaysArray(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);

    const { eventPlacements, totalLanes } = useMemo(() => {
        const events = getEventsByTrip(trip.id).sort((a, b) => {
            const aDuration = new Date(a.endDate || a.eventDate).getTime() - new Date(a.eventDate).getTime();
            const bDuration = new Date(b.endDate || b.eventDate).getTime() - new Date(b.eventDate).getTime();
            if (bDuration !== aDuration) return bDuration - aDuration;
            return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
        });

        const dayIndexMap = new Map(tripDays.map(({ iso }, index) => [iso, index]));
        const lanes: (number | undefined)[][] = [[]]; // Each lane stores the end day index of the event in that slot
        const placements: { event: Event, lane: number, startDayIndex: number, duration: number }[] = [];

        events.forEach(event => {
            const startDayIndex = dayIndexMap.get(event.eventDate);
            // FIX: Use a `typeof` check as a stronger type guard for TypeScript's inference engine.
            if (typeof startDayIndex !== 'number') return;
            
            const endDate = event.endDate ? new Date(event.endDate + 'T12:00:00Z') : new Date(event.eventDate + 'T12:00:00Z');
            const startDate = new Date(event.eventDate + 'T12:00:00Z');
            const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            let placed = false;
            for (let i = 0; i < lanes.length; i++) {
                let hasSpace = true;
                for (let j = startDayIndex; j < startDayIndex + duration; j++) {
                    if (lanes[i][j] !== undefined) {
                        hasSpace = false;
                        break;
                    }
                }

                if (hasSpace) {
                    for (let j = startDayIndex; j < startDayIndex + duration; j++) {
                        lanes[i][j] = startDayIndex + duration -1;
                    }
                    placements.push({ event, lane: i, startDayIndex, duration });
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                const newLaneIndex = lanes.length;
                lanes.push([]);
                for (let j = startDayIndex; j < startDayIndex + duration; j++) {
                    lanes[newLaneIndex][j] = startDayIndex + duration -1;
                }
                placements.push({ event, lane: newLaneIndex, startDayIndex, duration });
            }
        });

        return { eventPlacements: placements, totalLanes: lanes.length };
    }, [trip.id, getEventsByTrip, tripDays]);


    return (
        <div className="mt-4 bg-surface rounded-2xl p-4 shadow-sm">
            <div className="overflow-x-auto">
                <div 
                    className="grid gap-x-px gap-y-2"
                    style={{ 
                        gridTemplateColumns: `repeat(${tripDays.length}, minmax(140px, 1fr))`,
                        gridTemplateRows: `auto repeat(${totalLanes}, 48px)`
                    }}
                >
                    {/* Day Headers */}
                    {tripDays.map(({ date }, index) => (
                        <div 
                            key={index}
                            className="text-center p-2 border-b-2 border-surface-variant sticky top-0 bg-surface z-10"
                            style={{ gridColumn: index + 1, gridRow: 1 }}
                        >
                            <p className="text-xs font-semibold text-on-surface-variant">{date.toLocaleDateString('it-IT', { weekday: 'short' })}</p>
                            <p className="font-bold text-lg text-on-surface">{date.getDate()}</p>
                            <p className="text-xs text-on-surface-variant">{date.toLocaleDateString('it-IT', { month: 'short' })}</p>
                        </div>
                    ))}

                    {/* Event Placements */}
                    {eventPlacements.map(({ event, lane, startDayIndex, duration }) => {
                        const category = data.categories.find(c => c.name === event.type);
                        const bgColor = category?.color || '#757780';
                        const textColor = getContrastColor(bgColor);
                        const icon = category?.icon || '•';

                        return (
                            <div
                                key={event.eventId}
                                onClick={() => onOpenDayDetail(new Date(event.eventDate + 'T12:00:00Z'))}
                                className="h-full flex items-center p-2 rounded-lg cursor-pointer overflow-hidden"
                                style={{
                                    gridColumn: `${startDayIndex + 1} / span ${duration}`,
                                    gridRow: lane + 2,
                                    backgroundColor: bgColor,
                                    color: textColor,
                                }}
                            >
                                <span className="text-lg mr-2">{icon}</span>
                                <p className="text-sm font-semibold truncate">{event.title}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default TimelineView;