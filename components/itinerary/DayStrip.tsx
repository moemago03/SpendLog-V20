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

            // Calculate the desired scroll position to center the item
            const scrollPosition = item.offsetLeft - (containerRect.width / 2) + (itemRect.width / 2);
            
            container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
    }, [selectedDate]);

    return (
        <div 
            ref={scrollContainerRef}
            className="flex space-x-3 overflow-x-auto p-4 no-scrollbar"
        >
            {tripDays.map(({ iso, date }) => {
                const isSelected = selectedDate === iso;
                const dayOfWeek = date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
                const month = date.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();

                return (
                    <button
                        key={iso}
                        ref={isSelected ? selectedItemRef : null}
                        onClick={() => onSelectDate(iso)}
                        className={`flex-shrink-0 flex flex-col items-center justify-between w-[68px] h-[92px] rounded-3xl transition-all duration-300 transform active:scale-95 p-2 shadow-sm ${
                            isSelected 
                                ? 'bg-[#3C3866] text-white' 
                                : 'bg-white dark:bg-surface-variant/50 text-gray-500 dark:text-on-surface-variant/80 border border-gray-200 dark:border-surface-variant'
                        }`}
                    >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-white/80' : 'text-gray-400 dark:text-on-surface-variant/60'}`}>{month}</span>
                        <span className="text-2xl font-bold">{date.getDate()}</span>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-white/80' : 'text-gray-400 dark:text-on-surface-variant/60'}`}>{dayOfWeek}</span>
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
