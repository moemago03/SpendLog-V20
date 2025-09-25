


import React, { useMemo, useRef, useEffect } from 'react';
import { Trip } from '../../types';
import { getDaysArray, dateToISOString } from '../../utils/dateUtils';
import { WeatherInfo } from '../../utils/weatherUtils';
import { findStageForDate } from '../../utils/tripUtils';
import { STAGE_COLORS } from '../../constants';

interface DayStripProps {
    trip: Trip;
    selectedDate: string;
    onSelectDate: (date: string) => void;
    weatherData: Map<string, WeatherInfo> | null;
}

const DayStrip: React.FC<DayStripProps> = ({ trip, selectedDate, onSelectDate, weatherData }) => {
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
                const weather = weatherData?.get(iso);

                const stageForDay = findStageForDate(trip, iso);
                const stageColor = stageForDay ? STAGE_COLORS[trip.stages.findIndex(s => s.id === stageForDay.id) % STAGE_COLORS.length] : 'transparent';

                return (
                    <button
                        key={iso}
                        ref={isSelected ? selectedItemRef : null}
                        onClick={() => onSelectDate(iso)}
                        className={`relative flex-shrink-0 flex flex-col items-center justify-between w-16 h-24 rounded-2xl transition-all duration-300 transform active:scale-95 p-2 shadow-sm overflow-hidden ${
                            isSelected 
                                ? 'bg-primary text-on-primary' 
                                : 'bg-surface text-on-surface-variant'
                        }`}
                        style={{ marginLeft: index === 0 ? '1rem' : '', marginRight: index === tripDays.length - 1 ? '1rem' : '' }}
                    >
                        <div className="relative z-10 flex flex-col items-center justify-between h-full w-full">
                            <span className={`text-xs font-semibold ${isSelected ? 'text-on-primary/80' : 'text-on-surface-variant/70'}`}>{dayOfWeek}</span>
                            <span className={`text-2xl font-bold ${isSelected ? 'text-on-primary' : 'text-on-surface'}`}>{dayOfMonth}</span>
                            <div className={`flex items-center gap-1 text-xs h-5 ${isSelected ? 'text-on-primary/90' : 'text-on-surface-variant/90'}`}>
                                {weather ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm">{weather.icon}</span>
                                        <span className="font-semibold">{weather.temp}°</span>
                                    </>
                                ) : (
                                    <div className="w-8 h-4 bg-gray-400/20 rounded-full animate-pulse"></div>
                                )}
                            </div>
                        </div>
                        <div 
                            className="absolute bottom-0 left-0 right-0 h-1"
                            style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : stageColor }}
                        ></div>
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