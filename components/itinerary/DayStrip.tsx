
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
            className="flex space-x-3 overflow-x-auto p-4 -mx-4 no-scrollbar"
        >
            {tripDays.map(({ iso, date }, index) => {
                const isSelected = selectedDate === iso;
                const dayOfWeek = date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
                const dayOfMonth = date.getDate();

                return (
                    <button
                        key={iso}
                        ref={isSelected ? selectedItemRef : null}
                        onClick={() => onSelectDate(iso)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-300 transform active:scale-95 p-2 shadow-sm ${
                            isSelected 
                                ? 'bg-primary text-on-primary' 
                                : 'bg-surface text-on-surface-variant'
                        }`}
                        style={{ marginLeft: index === 0 ? '1rem' : '', marginRight: index === tripDays.length - 1 ? '1rem' : '' }}
                    >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-on-primary/80' : 'text-on-surface-variant/70'}`}>{dayOfWeek}</span>
                        <span className={`text-2xl font-bold mt-1 ${isSelected ? 'text-on-primary' : 'text-on-surface'}`}>{dayOfMonth}</span>
                    </button>
                );
            })}
            <style>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default DayStrip;
