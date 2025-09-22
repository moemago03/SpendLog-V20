
// components/itinerary/ItineraryView.tsx

import React, { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { Trip, Event, Expense } from '../../types';
import DayDetailView from './DayDetailView';
import { useItinerary } from '../../context/ItineraryContext';
import { getMonthGridDays, dateToISOString, isSameDay, getWeekRange, getDaysArray, getTripDurationDays, getMonthRange } from '../../utils/dateUtils';
import ItineraryMapView, { MapFilterState } from './ItineraryMapView';
import { useData } from '../../context/DataContext';
import { getContrastColor } from '../../utils/colorUtils';
import ExpenseListSkeleton from '../ExpenseListSkeleton';
import DayStrip from './DayStrip';

const EventForm = lazy(() => import('./EventForm'));
const Checklist = lazy(() => import('../Checklist'));

// --- Internal Month View Component (Refreshed Style) ---
const MonthView: React.FC<{
    displayDate: Date;
    trip: Trip;
    categories: any[]; // Using any to avoid type issues with imported Category
    onOpenDayDetail: (date: Date) => void;
}> = ({ displayDate, trip, categories, onOpenDayDetail }) => {
    const { getEventsByTrip } = useItinerary();
    const tripStartDate = useMemo(() => new Date(trip.startDate.split('T')[0] + 'T00:00:00Z'), [trip.startDate]);
    const tripEndDate = useMemo(() => new Date(trip.endDate.split('T')[0] + 'T23:59:59Z'), [trip.endDate]);
    
    const monthGridDays = useMemo(() => getMonthGridDays(displayDate.getFullYear(), displayDate.getMonth()), [displayDate]);
    const weeks = useMemo(() => {
        const res = [];
        for (let i = 0; i < monthGridDays.length; i += 7) {
            res.push(monthGridDays.slice(i, i + 7));
        }
        return res;
    }, [monthGridDays]);

    const eventsToRender = useMemo(() => {
        const monthStart = monthGridDays[0];
        const monthEnd = monthGridDays[monthGridDays.length - 1];
        const allEvents = getEventsByTrip(trip.id);

        const visibleEvents = allEvents.filter(event => {
            const eventStart = new Date(event.eventDate + 'T00:00:00Z');
            const eventEnd = event.endDate ? new Date(event.endDate + 'T00:00:00Z') : eventStart;
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
                const eventEnd = event.endDate ? new Date(event.endDate + 'T00:00:00Z') : eventStart;
                return eventStart <= week[6] && eventEnd >= week[0];
            });

            eventsInWeek.forEach(event => {
                const eventStart = new Date(event.eventDate + 'T00:00:00Z');
                const eventEnd = event.endDate ? new Date(event.endDate + 'T00:00:00Z') : eventStart;
                const startDay = eventStart < week[0] ? week[0] : eventStart;
                const endDay = eventEnd > week[6] ? week[6] : eventEnd;
                const startCol = (startDay.getDay() + 6) % 7;
                const endCol = (endDay.getDay() + 6) % 7;
                const span = endCol - startCol + 1;

                for (let level = 0; level < lanes.length; level++) {
                    let isFree = true;
                    for (let col = startCol; col < startCol + span; col++) {
                        if (lanes[level][col]) { isFree = false; break; }
                    }
                    if (isFree) {
                        for (let col = startCol; col < startCol + span; col++) { lanes[level][col] = event; }
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
                    const isCurrentMonth = date.getMonth() === displayDate.getMonth();
                    const isToday = isSameDay(new Date(), date);
                    const isInTrip = date >= tripStartDate && date <= tripEndDate;

                    let cellClasses = 'bg-surface hover:bg-surface-variant/70';
                    if (!isCurrentMonth) cellClasses = 'bg-surface-variant/30';
                    else if (isInTrip) cellClasses = 'bg-primary-container/20 hover:bg-primary-container/40';
                    if (!isInTrip) cellClasses += ' cursor-not-allowed';

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
                        const eventEnd = new Date((event.endDate || event.eventDate) + 'T00:00:00Z');
                        if(!isSameDay(eventEnd, week[startCol + span - 1])) {
                            if(roundedClass === 'rounded-r') roundedClass = '';
                            else roundedClass = 'rounded-l';
                        }
                        
                        const category = categories.find(c => c.name === event.type);
                        const bgColor = category?.color || '#757780';
                        const textColor = getContrastColor(bgColor);

                        return (
                            <div
                                key={`${event.eventId}-${weekIndex}`}
                                onClick={(e) => { e.stopPropagation(); onOpenDayDetail(new Date(event.eventDate + 'T12:00:00Z')); }}
                                className={`absolute text-[11px] font-semibold p-1 overflow-hidden cursor-pointer ${roundedClass}`}
                                style={{
                                    top: `calc(${parseInt(weekIndex) * (100/weeks.length)}% + ${30 + level * 22}px)`,
                                    left: `calc(${startCol * (100/7)}% + 3px)`,
                                    width: `calc(${span * (100/7)}% - 6px)`,
                                    height: '20px',
                                    backgroundColor: bgColor,
                                    color: textColor,
                                }}
                            >
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
    if (today >= tripStart && today <= tripEnd) {
        return dateToISOString(today);
    }
    return trip.startDate.split('T')[0];
};

type ItineraryAgendaViewMode = 'day' | 'month' | 'map';
type ItinerarySubView = 'agenda' | 'checklist';

// --- Main Itinerary View Component ---
const ItineraryView: React.FC<{ trip: Trip, onAddExpense: (prefill: Partial<Expense>) => void; }> = ({ trip, onAddExpense }) => {
    const { data } = useData();
    const [activeSubView, setActiveSubView] = useState<ItinerarySubView>('agenda');

    const tripStartDate = useMemo(() => new Date(trip.startDate.split('T')[0] + 'T00:00:00Z'), [trip.startDate]);
    const tripEndDate = useMemo(() => new Date(trip.endDate.split('T')[0] + 'T23:59:59Z'), [trip.endDate]);

    const isTripActive = useMemo(() => {
        const today = new Date();
        return today >= tripStartDate && today <= tripEndDate;
    }, [tripStartDate, tripEndDate]);

    const todayISO = useMemo(() => dateToISOString(new Date()), []);

    const initialAgendaDate = useMemo(() => {
        if (isTripActive) {
            return todayISO;
        }
        return trip.startDate.split('T')[0];
    }, [isTripActive, todayISO, trip.startDate]);

    const [selectedDateISO, setSelectedDateISO] = useState(initialAgendaDate);
    const [viewMode, setViewMode] = useState<ItineraryAgendaViewMode>('day');
    
    const [displayDateForMonth, setDisplayDateForMonth] = useState(() => new Date(selectedDateISO + 'T12:00:00Z'));
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    
    const [mapFilter, setMapFilter] = useState<MapFilterState>(() => ({
        mode: 'week',
        anchorDate: getInitialMapDate(trip),
        dateRange: {
            start: trip.startDate.split('T')[0],
            end: trip.endDate.split('T')[0],
        }
    }));
    
    const handleNavigation = (delta: number) => {
        setDisplayDateForMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta, 1);
            return newDate;
        });
    };

    const handleDateSelect = useCallback((isoDate: string) => {
        setSelectedDateISO(isoDate);
        if (viewMode !== 'day') {
             setViewMode('day');
        }
    }, [viewMode]);
    
    const handleOpenAddEventForm = () => setIsAddingEvent(true);
    const handleCloseAddEventForm = () => setIsAddingEvent(false);

    const tripDuration = useMemo(() => getTripDurationDays(trip.startDate, trip.endDate), [trip.startDate, trip.endDate]);
    const formattedStartDate = new Date(trip.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    const formattedEndDate = new Date(trip.endDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return (
        <div className="pb-24">
            <header className="pt-8 pb-4 px-4 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-on-background">{trip.name}</h1>
                <p className="text-on-surface-variant">{formattedStartDate} - {formattedEndDate} ({tripDuration} giorni)</p>
                <div className="mt-6 flex border-b border-surface-variant">
                    <button
                        onClick={() => setActiveSubView('agenda')}
                        className={`flex-1 py-3 text-center font-semibold transition-colors border-b-2 ${
                            activeSubView === 'agenda'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        Agenda
                    </button>
                    <button
                        onClick={() => setActiveSubView('checklist')}
                        className={`flex-1 py-3 text-center font-semibold transition-colors border-b-2 ${
                            activeSubView === 'checklist'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                    >
                        Checklist
                    </button>
                </div>
            </header>

            <div className={activeSubView === 'agenda' ? '' : 'hidden'}>
                <DayStrip
                    trip={trip}
                    selectedDate={selectedDateISO}
                    onSelectDate={handleDateSelect}
                />
                <div className="px-4 mt-6 max-w-7xl mx-auto flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-on-surface">
                        {new Date(selectedDateISO + 'T12:00:00Z').toLocaleDateString('it-IT', { weekday: 'long' })}, {new Date(selectedDateISO + 'T12:00:00Z').getDate()}
                    </h2>
                    <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-full">
                         <button onClick={() => setViewMode('day')} className={`p-2 rounded-full transition-colors ${viewMode === 'day' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`} aria-label="Vista Giorno">
                            <span className="material-symbols-outlined">calendar_view_day</span>
                        </button>
                         <button onClick={() => setViewMode('month')} className={`p-2 rounded-full transition-colors ${viewMode === 'month' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`} aria-label="Vista Mese">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </button>
                         <button onClick={() => setViewMode('map')} className={`p-2 rounded-full transition-colors ${viewMode === 'map' ? 'bg-surface text-primary shadow-sm' : 'text-on-surface-variant'}`} aria-label="Vista Mappa">
                            <span className="material-symbols-outlined">map</span>
                        </button>
                    </div>
                </div>
                
                <main className="px-2 max-w-7xl mx-auto mt-4">
                    {viewMode === 'day' && (
                        <Suspense fallback={<div className="mt-4 h-[70vh] bg-surface-variant rounded-2xl animate-pulse" />}>
                            <DayDetailView 
                                key={selectedDateISO}
                                tripId={trip.id}
                                selectedDate={selectedDateISO}
                                onAddExpense={onAddExpense}
                            />
                        </Suspense>
                    )}
                    {viewMode === 'month' && (
                        <MonthView 
                            displayDate={displayDateForMonth} 
                            trip={trip} 
                            categories={data.categories} 
                            onOpenDayDetail={(d) => setSelectedDateISO(dateToISOString(d))} 
                        />
                    )}
                    {viewMode === 'map' && (
                        <Suspense fallback={<div className="mt-4 h-[70vh] bg-surface-variant rounded-2xl animate-pulse" />}>
                            <ItineraryMapView 
                                trip={trip} 
                                onOpenDayDetail={(d) => setSelectedDateISO(dateToISOString(d))}
                                filter={mapFilter}
                                onFilterChange={setMapFilter}
                            />
                        </Suspense>
                    )}
                </main>
                 <button
                    onClick={handleOpenAddEventForm}
                    className="fixed bottom-24 right-6 h-16 w-16 bg-primary text-on-primary rounded-3xl shadow-lg flex items-center justify-center transition-transform active:scale-90 z-30"
                    aria-label="Aggiungi nuovo evento"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
                {isAddingEvent && (
                    <Suspense fallback={<div />}>
                        <EventForm
                            selectedDate={selectedDateISO}
                            tripId={trip.id}
                            onClose={handleCloseAddEventForm}
                        />
                    </Suspense>
                )}
            </div>

            <div className={activeSubView === 'checklist' ? 'block' : 'hidden'}>
                <main className="px-4 max-w-4xl mx-auto mt-4">
                    <Suspense fallback={<div className="p-4"><ExpenseListSkeleton /></div>}>
                        <Checklist trip={trip} />
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default ItineraryView;
