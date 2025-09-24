

// components/itinerary/ItineraryView.tsx

import React, { useState, useMemo, lazy, Suspense, useCallback, useEffect } from 'react';
import { Trip, Event, Expense, ChecklistItem } from '../../types';
import DayDetailView from './DayDetailView';
import { useItinerary } from '../../context/ItineraryContext';
import { getMonthGridDays, dateToISOString, isSameDay, getDaysArray } from '../../utils/dateUtils';
import ItineraryMapView, { MapFilterState } from './ItineraryMapView';
import { useData } from '../../context/DataContext';
import { getContrastColor } from '../../utils/colorUtils';
import ExpenseListSkeleton from '../ExpenseListSkeleton';
import DayStrip from './DayStrip';
import { WeatherInfo, getWeatherIconFromWmoCode } from '../../utils/weatherUtils';
import WeatherDebugWidget from './WeatherDebugWidget'; // Import the new debug widget
import { useLocation } from '../../context/LocationContext';

const EventForm = lazy(() => import('./EventForm'));
const Checklist = lazy(() => import('../Checklist'));
const AIItineraryGenerator = lazy(() => import('./AIItineraryGenerator'));
const DocumentHub = lazy(() => import('./DocumentHub'));

const MonthView: React.FC<{
    displayDate: Date;
    trip: Trip;
    categories: any[];
    onOpenDayDetail: (date: Date) => void;
    dateFilterRange: { start: Date; end: Date } | null;
}> = ({ displayDate, trip, categories, onOpenDayDetail, dateFilterRange }) => {
    const { getEventsByTrip } = useItinerary();
    const tripStartDate = useMemo(() => new Date(trip.startDate.split('T')[0] + 'T00:00:00Z'), [trip.startDate]);
    const tripEndDate = useMemo(() => new Date(trip.endDate.split('T')[0] + 'T23:59:59Z'), [trip.endDate]);
    
    const eventDates = useMemo(() => {
        const dates = new Set<string>();
        getEventsByTrip(trip.id).forEach(event => {
            const days = getDaysArray(event.eventDate, event.endDate || event.eventDate);
            days.forEach(d => dates.add(d.iso));
        });
        return dates;
    }, [getEventsByTrip, trip.id]);

    const monthGridDays = useMemo(() => getMonthGridDays(displayDate.getFullYear(), displayDate.getMonth()), [displayDate]);
    const weeks = useMemo(() => {
        const res = [];
        for (let i = 0; i < monthGridDays.length; i += 7) res.push(monthGridDays.slice(i, i + 7));
        return res;
    }, [monthGridDays]);

    const eventsToRender = useMemo(() => {
        const monthStart = monthGridDays[0];
        const monthEnd = monthGridDays[monthGridDays.length - 1];
        const visibleEvents = getEventsByTrip(trip.id).filter(event => {
            const eventStart = new Date(event.eventDate + 'T00:00:00Z');
            const eventEnd = event.endDate ? new Date(event.endDate + 'T23:59:59Z') : new Date(event.eventDate + 'T23:59:59Z');
            return eventStart <= monthEnd && eventEnd >= monthStart;
        }).sort((a, b) => {
            const startDiff = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
            if (startDiff !== 0) return startDiff;
            const aDuration = new Date(a.endDate || a.eventDate).getTime() - new Date(a.eventDate).getTime();
            const bDuration = new Date(b.endDate || b.eventDate).getTime() - new Date(b.eventDate).getTime();
            return bDuration - aDuration;
        });

        const layout: { [weekIndex: number]: { event: Event, startCol: number, span: number, level: number }[] } = {};
        weeks.forEach((week, weekIndex) => {
            layout[weekIndex] = [];
            const lanes: (Event | null)[][] = [[], [], []];
            const eventsInWeek = visibleEvents.filter(event => {
                const eventStart = new Date(event.eventDate + 'T00:00:00Z');
                const eventEnd = event.endDate ? new Date(event.endDate + 'T23:59:59Z') : new Date(event.eventDate + 'T23:59:59Z');
                return eventStart <= week[6] && eventEnd >= week[0];
            });

            eventsInWeek.forEach(event => {
                const eventStart = new Date(event.eventDate + 'T00:00:00Z');
                const eventEnd = event.endDate ? new Date(event.endDate + 'T23:59:59Z') : new Date(event.eventDate + 'T23:59:59Z');
                const startDay = eventStart < week[0] ? week[0] : eventStart;
                const endDay = eventEnd > week[6] ? week[6] : eventEnd;
                const startCol = (startDay.getDay() + 6) % 7;
                const endCol = (endDay.getDay() + 6) % 7;
                const span = endCol - startCol + 1;

                for (let level = 0; level < lanes.length; level++) {
                    let isFree = true;
                    for (let col = startCol; col < startCol + span; col++) if (lanes[level][col]) { isFree = false; break; }
                    if (isFree) {
                        for (let col = startCol; col < startCol + span; col++) lanes[level][col] = event;
                        layout[weekIndex].push({ event, startCol, span, level });
                        return;
                    }
                }
            });
        });
        return layout;
    }, [monthGridDays, weeks, getEventsByTrip, trip.id]);

    const weekdays = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
    
    return (
        <div className="mt-4 p-2 bg-surface rounded-3xl">
            <div className="grid grid-cols-7 text-center text-xs font-medium uppercase text-on-surface-variant/70">
                {weekdays.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="relative grid grid-cols-7 border-t border-l border-outline/20">
                {monthGridDays.map((date, index) => {
                    let isVisible;
                    if (dateFilterRange) {
                        const normalizedDate = new Date(date);
                        normalizedDate.setHours(12, 0, 0, 0);
                        isVisible = normalizedDate >= dateFilterRange.start && normalizedDate <= dateFilterRange.end;
                    } else {
                        isVisible = date.getMonth() === displayDate.getMonth() || eventDates.has(dateToISOString(date));
                    }

                    if (!isVisible) return <div key={index} className="relative min-h-24 md:min-h-32 border-b border-r border-outline/20 bg-surface-variant/10" />;
                    
                    const isToday = isSameDay(new Date(), date);
                    const isInTrip = date >= tripStartDate && date <= tripEndDate;
                    const isCurrentMonth = date.getMonth() === displayDate.getMonth();
                    let cellClasses = `bg-surface hover:bg-surface-variant/70 ${!isInTrip ? 'cursor-not-allowed' : ''}`;
                    if (!isCurrentMonth) cellClasses = 'bg-surface-variant/30';
                    else if (isInTrip) cellClasses = 'bg-primary-container/20 hover:bg-primary-container/40';

                    return (
                        <div key={index} onClick={() => isInTrip && onOpenDayDetail(date)} className={`relative min-h-24 md:min-h-32 p-1.5 flex flex-col transition-colors overflow-hidden border-b border-r border-outline/20 ${cellClasses}`}>
                            <span className={`flex items-center justify-center text-xs font-semibold h-6 w-6 rounded-full ${isToday ? 'bg-primary text-on-primary' : ''} ${!isCurrentMonth ? 'text-on-surface-variant/50' : ''}`}>
                                {date.getDate()}
                            </span>
                        </div>
                    );
                })}
                 {Object.entries(eventsToRender).map(([weekIndex, weekEvents]) => 
                    (weekEvents as { event: Event, startCol: number, span: number, level: number }[]).map(({ event, startCol, span, level }) => {
                        const eventStart = new Date(event.eventDate + 'T00:00:00Z');
                        const week = weeks[parseInt(weekIndex)];
                        if (!week) return null;
                        const isStartOfEvent = isSameDay(eventStart, week[startCol]);
                        const showTitle = isStartOfEvent || startCol === 0;
                        let roundedClass = 'rounded';
                        if(!isStartOfEvent) roundedClass = 'rounded-r';
                        const eventEnd = new Date((event.endDate || event.eventDate) + 'T23:59:59Z');
                        if(!isSameDay(eventEnd, week[startCol + span - 1])) {
                            if(roundedClass === 'rounded-r') roundedClass = '';
                            else roundedClass = 'rounded-l';
                        }
                        
                        const category = categories.find(c => c.name === event.type);
                        const bgColor = category?.color || '#757780';
                        return (
                            <div key={`${event.eventId}-${weekIndex}`} onClick={(e) => { e.stopPropagation(); onOpenDayDetail(new Date(event.eventDate + 'T12:00:00Z')); }}
                                className={`absolute text-[11px] font-semibold p-1 overflow-hidden cursor-pointer ${roundedClass}`}
                                style={{ top: `calc(${parseInt(weekIndex) * (100/weeks.length)}% + ${30 + level * 22}px)`, left: `calc(${startCol * (100/7)}% + 3px)`, width: `calc(${span * (100/7)}% - 6px)`, height: '20px', backgroundColor: bgColor, color: getContrastColor(bgColor) }}>
                                <span className="truncate">{showTitle && event.title}</span>
                            </div>
                        );
                    })
                 )}
            </div>
        </div>
    );
};

const getInitialMapDate = (trip: Trip) => {
    const today = new Date();
    const tripStart = new Date(trip.startDate.split('T')[0] + 'T12:00:00Z');
    const tripEnd = new Date(trip.endDate.split('T')[0] + 'T12:00:00Z');
    return (today >= tripStart && today <= tripEnd) ? dateToISOString(today) : trip.startDate.split('T')[0];
};

type ItineraryAgendaViewMode = 'day' | 'month' | 'map';
type ItinerarySubView = 'agenda' | 'checklist' | 'documents';
type CalendarQuickFilter = '3days' | '7days' | '10days' | 'all';

// Helper to geocode a location string to lat/lon using Nominatim
const geocodeLocation = async (location: string): Promise<{ lat: number; lon: number } | null> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=it`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error(`Geocoding failed for ${location}:`, error);
        return null;
    }
};


const ItineraryView: React.FC<{ trip: Trip, onAddExpense: (prefill: Partial<Expense> & { checklistItemId?: string }) => void; }> = ({ trip, onAddExpense }) => {
    const { data } = useData();
    const { location: userLocation } = useLocation();
    const [activeSubView, setActiveSubView] = useState<ItinerarySubView>('agenda');
    const [weatherData, setWeatherData] = useState<Map<string, WeatherInfo> | null>(null);

    const tripStartDate = useMemo(() => new Date(trip.startDate.split('T')[0] + 'T00:00:00Z'), [trip.startDate]);
    const tripEndDate = useMemo(() => new Date(trip.endDate.split('T')[0] + 'T23:59:59Z'), [trip.endDate]);
    const isTripActive = useMemo(() => { const today = new Date(); return today >= tripStartDate && today <= tripEndDate; }, [tripStartDate, tripEndDate]);
    const todayISO = useMemo(() => dateToISOString(new Date()), []);
    const initialAgendaDate = useMemo(() => isTripActive ? todayISO : trip.startDate.split('T')[0], [isTripActive, todayISO, trip.startDate]);

    const [selectedDateISO, setSelectedDateISO] = useState(initialAgendaDate);
    const [viewMode, setViewMode] = useState<ItineraryAgendaViewMode>('day');
    const [displayDateForMonth, setDisplayDateForMonth] = useState(() => new Date(selectedDateISO + 'T12:00:00Z'));
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    
    const [mapFilter, setMapFilter] = useState<MapFilterState>(() => ({ mode: 'week', anchorDate: getInitialMapDate(trip), dateRange: { start: trip.startDate.split('T')[0], end: trip.endDate.split('T')[0] }}));
    const [calendarQuickFilter, setCalendarQuickFilter] = useState<CalendarQuickFilter>('all');
    const [calendarDateFilter, setCalendarDateFilter] = useState<{ start: Date; end: Date } | null>(null);

    const { isPrevMonthNavDisabled, isNextMonthNavDisabled } = useMemo(() => {
        const displayMonth = displayDateForMonth.getMonth(), displayYear = displayDateForMonth.getFullYear();
        const tripStartMonth = tripStartDate.getMonth(), tripStartYear = tripStartDate.getFullYear();
        const tripEndMonth = tripEndDate.getMonth(), tripEndYear = tripEndDate.getFullYear();
        return { isPrevMonthNavDisabled: (displayYear < tripStartYear) || (displayYear === tripStartYear && displayMonth <= tripStartMonth), isNextMonthNavDisabled: (displayYear > tripEndYear) || (displayYear === tripEndYear && displayMonth >= tripEndMonth) };
    }, [displayDateForMonth, tripStartDate, tripEndDate]);
    
    useEffect(() => {
        const fetchWeatherData = async () => {
            const locationForWeather = userLocation?.city || trip.countries?.[0];

            if (!locationForWeather) {
                setWeatherData(new Map());
                return;
            }

            const coords = await geocodeLocation(locationForWeather);

            if (!coords) {
                console.error(`Could not geocode location: ${locationForWeather}`);
                setWeatherData(new Map());
                return;
            }
            
            try {
                const { lat, lon } = coords;
                
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize

                const tripStart = new Date(trip.startDate.split('T')[0] + 'T00:00:00Z');
                const tripEnd = new Date(trip.endDate.split('T')[0] + 'T23:59:59Z');

                // If trip is over, don't fetch weather
                if (today > tripEnd) {
                    setWeatherData(new Map());
                    return;
                }

                // API start date is today or trip start date, whichever is later
                const apiStartDate = today > tripStart ? today : tripStart;

                // API end date limit is 9 days from API start date (inclusive)
                const apiEndDateLimit = new Date(apiStartDate);
                apiEndDateLimit.setDate(apiEndDateLimit.getDate() + 8);

                // API end date is the earlier of the trip end date and our 9-day limit
                const apiEndDate = apiEndDateLimit < tripEnd ? apiEndDateLimit : tripEnd;
                
                const startDateParam = dateToISOString(apiStartDate);
                const endDateParam = dateToISOString(apiEndDate);

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&start_date=${startDateParam}&end_date=${endDateParam}&timezone=auto`;
                const weatherResponse = await fetch(weatherUrl);

                if (!weatherResponse.ok) throw new Error(`Weather API request failed with status ${weatherResponse.status}`);
                
                const weatherApiData = await weatherResponse.json();
                if (!weatherApiData?.daily?.time) {
                    setWeatherData(new Map());
                    return;
                }

                const newWeatherData = new Map<string, WeatherInfo>();
                const times = weatherApiData.daily.time;
                const maxTemps = weatherApiData.daily.temperature_2m_max;
                const weatherCodes = weatherApiData.daily.weathercode;

                for (let i = 0; i < times.length; i++) {
                    const date = times[i];
                    const temp = maxTemps[i];
                    const code = weatherCodes[i];
                    if (temp !== null && code !== null) {
                        newWeatherData.set(date, {
                            icon: getWeatherIconFromWmoCode(code),
                            temp: Math.round(temp)
                        });
                    }
                }
                setWeatherData(newWeatherData);

            } catch (error) {
                console.error("Failed to fetch weather data:", error);
                setWeatherData(new Map());
            }
        };

        fetchWeatherData();
    }, [trip.id, trip.countries, trip.startDate, trip.endDate, userLocation]);

    const handleNavigation = (delta: number) => {
        setCalendarQuickFilter('all');
        setCalendarDateFilter(null);
        setDisplayDateForMonth(prev => { const newDate = new Date(prev); newDate.setMonth(newDate.getMonth() + delta, 1); return newDate; });
    };
    
    const handleCalendarFilterChange = useCallback((filter: CalendarQuickFilter) => {
        setCalendarQuickFilter(filter);
        if (filter === 'all') setCalendarDateFilter(null);
        else {
            const startDate = new Date(); startDate.setHours(0, 0, 0, 0);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + (filter === '3days' ? 2 : filter === '7days' ? 6 : 9));
            endDate.setHours(23, 59, 59, 999);
            setCalendarDateFilter({ start: startDate, end: endDate });
            setDisplayDateForMonth(new Date());
        }
    }, []);

    const handleDateSelect = useCallback((isoDate: string) => { setSelectedDateISO(isoDate); if (viewMode !== 'day') setViewMode('day'); }, [viewMode]);
    const CalendarFilterButton: React.FC<{filterType: CalendarQuickFilter, label: string}> = ({ filterType, label }) => (
        <button onClick={() => handleCalendarFilterChange(filterType)} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${calendarQuickFilter === filterType ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>{label}</button>
    );

    const handleCreateExpenseFromChecklistItem = (item: ChecklistItem) => {
        const prefill: Partial<Expense> & { checklistItemId?: string } = {
            description: item.text,
            category: 'Varie',
            checklistItemId: item.id,
        };
        if (item.isGroupItem && item.assignedToMemberId) {
            prefill.paidById = item.assignedToMemberId;
            prefill.splitBetweenMemberIds = [item.assignedToMemberId];
        }
        onAddExpense(prefill);
    };
    
    return (
        <div className="pb-24">
            <header className="pt-8 px-4 max-w-7xl mx-auto">
                <div className="flex border-b border-surface-variant">
                    <button onClick={() => setActiveSubView('agenda')} className={`flex-1 py-3 text-center font-semibold transition-colors border-b-2 ${activeSubView === 'agenda' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Agenda</button>
                    <button onClick={() => setActiveSubView('checklist')} className={`flex-1 py-3 text-center font-semibold transition-colors border-b-2 ${activeSubView === 'checklist' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Checklist</button>
                    <button onClick={() => setActiveSubView('documents')} className={`flex-1 py-3 text-center font-semibold transition-colors border-b-2 ${activeSubView === 'documents' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Documenti</button>
                </div>
            </header>

            <div className={activeSubView === 'agenda' ? '' : 'hidden'}>
                <DayStrip trip={trip} selectedDate={selectedDateISO} onSelectDate={handleDateSelect} weatherData={weatherData} />
                 <div className="px-4 mt-4 max-w-7xl mx-auto">
                    <WeatherDebugWidget trip={trip} />
                </div>
                <div className="px-4 mt-6 max-w-7xl mx-auto flex justify-end items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsAIGeneratorOpen(true)} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant" aria-label="Genera itinerario con AI"><span className="material-symbols-outlined">auto_awesome</span></button>
                        <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-full">
                             <button onClick={() => setViewMode('day')} className={`p-2 rounded-full ${viewMode === 'day' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`} aria-label="Vista Giorno"><span className="material-symbols-outlined">calendar_view_day</span></button>
                             <button onClick={() => setViewMode('month')} className={`p-2 rounded-full ${viewMode === 'month' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`} aria-label="Vista Mese"><span className="material-symbols-outlined">calendar_month</span></button>
                             <button onClick={() => setViewMode('map')} className={`p-2 rounded-full ${viewMode === 'map' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`} aria-label="Vista Mappa"><span className="material-symbols-outlined">map</span></button>
                        </div>
                    </div>
                </div>
                
                <main className="px-2 max-w-7xl mx-auto mt-4">
                    {viewMode === 'day' && <Suspense fallback={<div className="mt-4 h-[70vh] bg-surface-variant rounded-2xl animate-pulse" />}><DayDetailView key={selectedDateISO} tripId={trip.id} selectedDate={selectedDateISO} onAddExpense={onAddExpense} /></Suspense>}
                    {viewMode === 'month' && (
                        <div className="animate-fade-in">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleNavigation(-1)} disabled={isPrevMonthNavDisabled} className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30"><span className="material-symbols-outlined">chevron_left</span></button>
                                    <h3 className="text-lg font-bold text-center w-40 capitalize">{displayDateForMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}</h3>
                                    <button onClick={() => handleNavigation(1)} disabled={isNextMonthNavDisabled} className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30"><span className="material-symbols-outlined">chevron_right</span></button>
                                </div>
                                <div className="flex items-center gap-2 p-1 bg-surface-variant rounded-full mt-3 sm:mt-0">
                                    <CalendarFilterButton filterType="3days" label="3d" />
                                    <CalendarFilterButton filterType="7days" label="7d" />
                                    <CalendarFilterButton filterType="10days" label="10d" />
                                    <CalendarFilterButton filterType="all" label="Tutto" />
                                </div>
                            </div>
                            <MonthView displayDate={displayDateForMonth} trip={trip} categories={data.categories} onOpenDayDetail={(d) => handleDateSelect(dateToISOString(d))} dateFilterRange={calendarDateFilter} />
                        </div>
                    )}
                    {viewMode === 'map' && <Suspense fallback={<div className="mt-4 h-[70vh] bg-surface-variant rounded-2xl animate-pulse" />}><ItineraryMapView trip={trip} onOpenDayDetail={(d) => handleDateSelect(dateToISOString(d))} filter={mapFilter} onFilterChange={setMapFilter} /></Suspense>}
                </main>
                 <button onClick={() => setIsAddingEvent(true)} className="fixed bottom-24 right-6 h-16 w-16 bg-primary text-on-primary rounded-3xl shadow-lg flex items-center justify-center transition-transform active:scale-90 z-30" aria-label="Aggiungi evento"><span className="material-symbols-outlined text-3xl">add</span></button>
                {isAddingEvent && <Suspense fallback={<div />}><EventForm selectedDate={selectedDateISO} tripId={trip.id} onClose={() => setIsAddingEvent(false)} /></Suspense>}
                {isAIGeneratorOpen && <Suspense fallback={<div />}><AIItineraryGenerator tripId={trip.id} selectedDate={selectedDateISO} onClose={() => setIsAIGeneratorOpen(false)} /></Suspense>}
            </div>

            <div className={activeSubView === 'checklist' ? 'block' : 'hidden'}>
                <main className="px-4 max-w-4xl mx-auto mt-4">
                    <Suspense fallback={<div className="p-4"><ExpenseListSkeleton /></div>}>
                        <Checklist trip={trip} onCreateExpense={handleCreateExpenseFromChecklistItem} />
                    </Suspense>
                </main>
            </div>

            <div className={activeSubView === 'documents' ? 'block' : 'hidden'}>
                <main className="px-4 max-w-4xl mx-auto mt-4">
                    <Suspense fallback={<div className="p-4"><ExpenseListSkeleton /></div>}>
                        <DocumentHub trip={trip} />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default ItineraryView;