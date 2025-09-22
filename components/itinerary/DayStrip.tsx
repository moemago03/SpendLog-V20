import React, { useMemo, useRef, useEffect } from 'react';
import { Trip } from '../../types';
import { getDaysArray } from '../../utils/dateUtils';

interface DayStripProps {
    trip: Trip;
    selectedDate: string;
    onSelectDate: (date: string) => void;
}

const DayStrip: React.FC<DayStripProps> = ({ trip, selectedDate, onSelectDate }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const selectedItemRef = useRef<HTMLButtonElement>(null);

    const tripDays = useMemo(() => {
        return getDaysArray(trip.startDate, trip.endDate);
    }, [trip.startDate, trip.endDate]);

    useEffect(() => {
        if (selectedItemRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const item = selectedItemRef.current;
            const containerRect = container.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();

            const scrollPosition = item.offsetLeft - (containerRect.width / 2) + (itemRect.width / 2);
            container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
    }, [selectedDate]);

    return (
        <div 
            ref={scrollContainerRef}
            className="flex space-x-3 overflow-x-auto p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10"
            // FIX: Replaced '-ms-overflow-style' with camelCased 'msOverflowStyle' which is the correct format for React style objects.
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
            {tripDays.map(({ iso, date }) => {
                const isSelected = selectedDate === iso;
                return (
                    <button
                        key={iso}
                        ref={isSelected ? selectedItemRef : null}
                        onClick={() => onSelectDate(iso)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-300 transform active:scale-95 ${
                            isSelected ? 'bg-trip-primary text-trip-on-primary shadow-lg' : 'bg-surface-variant text-on-surface-variant'
                        }`}
                    >
                        <span className="text-xs uppercase font-semibold">{date.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                        <span className="text-2xl font-bold">{date.getDate()}</span>
                        <span className="text-xs">{date.toLocaleDateString('it-IT', { month: 'short' })}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default DayStrip;
