
import React, { useMemo, useRef, useEffect } from 'react';
import { Trip } from '../../types';
import { getDaysArray } from '../../utils/dateUtils';

interface DayStripProps {
    trip: Trip;
    selectedDate: string;
    onSelectDate: (date: string) => void;
}

// --- NEW: Simulated Weather Function ---
const getSimulatedWeather = (dateStr: string) => {
    // Use a simple hash from the date to get consistent "random" weather for a given day
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    const temp = 20 + (Math.abs(hash) % 15); // Temp between 20°C and 34°C
    const condition = Math.abs(hash) % 4;
    
    let icon = 'sunny';
    if (condition === 1) icon = 'partly_cloudy_day';
    if (condition === 2) icon = 'cloudy';
    if (condition === 3) icon = 'rainy';

    return { icon, temp };
};

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
                const weather = getSimulatedWeather(iso);

                return (
                    <button
                        key={iso}
                        ref={isSelected ? selectedItemRef : null}
                        onClick={() => onSelectDate(iso)}
                        className={`flex-shrink-0 flex flex-col items-center justify-between w-16 h-24 rounded-2xl transition-all duration-300 transform active:scale-95 p-2 shadow-sm ${
                            isSelected 
                                ? 'bg-primary text-on-primary' 
                                : 'bg-surface text-on-surface-variant'
                        }`}
                        style={{ marginLeft: index === 0 ? '1rem' : '', marginRight: index === tripDays.length - 1 ? '1rem' : '' }}
                    >
                        <span className={`text-xs font-semibold ${isSelected ? 'text-on-primary/80' : 'text-on-surface-variant/70'}`}>{dayOfWeek}</span>
                        <span className={`text-2xl font-bold ${isSelected ? 'text-on-primary' : 'text-on-surface'}`}>{dayOfMonth}</span>
                        <div className={`flex items-center gap-1 text-xs ${isSelected ? 'text-on-primary/90' : 'text-on-surface-variant/90'}`}>
                            <span className="material-symbols-outlined text-sm">{weather.icon}</span>
                            <span className="font-semibold">{weather.temp}°</span>
                        </div>
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
