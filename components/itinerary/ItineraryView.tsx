
// components/itinerary/ItineraryView.tsx

import React, { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { Trip, Event, Expense, Category } from '../../types';
import DayDetailView from './DayDetailView';
import { useItinerary } from '../../context/ItineraryContext';
import { getMonthGridDays, dateToISOString, isSameDay, getWeekRange, getDaysArray, getTripDurationDays, getMonthRange } from '../../utils/dateUtils';
import ItineraryMapView, { MapFilterState } from './ItineraryMapView';
import { useData } from '../../context/DataContext';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import { getContrastColor } from '../../utils/colorUtils';
import ExpenseListSkeleton from '../ExpenseListSkeleton';
import DayStrip from './DayStrip';

const EventForm = lazy(() => import('./EventForm'));
const Checklist = lazy(() => import('../Checklist'));

// --- Internal Month View Component ---
const MonthView: React.FC<{
    displayDate: Date;
    trip: Trip;
    categories: Category[];
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
        <div className="mt-4">
            <div className="grid grid-cols-7 text-center text-xs font-medium uppercase text-on-surface-variant/70">
                {weekdays.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="relative grid grid-cols-7 border-t border-l border-outline/20">
                {monthGridDays.map((date, index) => {
                    const isCurrentMonth = date.getMonth() === displayDate.getMonth();
                    if (!isCurrentMonth) {
                        return <div key={index} className="border-b border-r border-outline/20" />;
                    }

                    const isToday = isSameDay(new Date(), date);
                    const isInTrip = date >= tripStartDate && date <= tripEndDate;

                    let cellClasses = 'bg-surface hover:bg-surface-variant/70';
                    if (!isCurrentMonth) cellClasses = 'bg-surface-variant/30';
                    else if (isInTrip) cellClasses = 'bg-primary-container/20 hover:bg-primary-container/40';
                    if (!isInTrip) cellClasses += ' cursor-not-allowed';

                    return (
                        <div key={index} onClick={() => isInTrip && onOpenDayDetail(date)} className={`relative min-h-32 p-1.5 flex flex-col transition-colors overflow-hidden border-b border-r border-outline/20 ${cellClasses}`}>
                            <span className={`flex items-center justify-center text-xs font-semibold h-6 w-6 rounded-full ${isToday ? 'bg-primary text-on-primary' : ''} ${!isCurrentMonth ? 'text-on-surface-variant/50' : ''}`}>
                                {date.getDate()}
                            </span>
                        </div>
                    );
                })}
                 {Object.entries(eventsToRender).map(([weekIndex, weekEvents]) => 
                    // FIX: Cast `weekEvents` to its correct type to resolve `.map` is not a function error.
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
                                    top: `calc(${parseInt(weekIndex) * (100/weeks.length)}% + ${30 + level * 24}px)`,
                                    left: `calc(${startCol * (100/7)}% + 3px)`,
                                    width: `calc(${span * (100/7)}% - 6px)`,
                                    height: '22px',
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

// --- Internal Week View Component ---
const WeekView: React.FC<{
    displayDate: Date;
    trip: Trip;
    categories: Category[];
    onOpenDayDetail: (date: Date) => void;
}> = ({ displayDate, trip, categories, onOpenDayDetail }) => {
    const { getEventsByTrip } = useItinerary();
    const { data } = useData();
    const { convert, formatCurrency } = useCurrencyConverter();
    const tripData = data.trips.find(t => t.id === trip.id);
    const expenses = tripData?.expenses || [];

    const tripStartDate = new Date(trip.startDate.split('T')[0] + 'T00:00:00Z');
    const tripEndDate = new Date(trip.endDate.split('T')[0] + 'T23:59:59Z');

    const weekDays = useMemo(() => {
        const { start } = getWeekRange(displayDate);
        return getDaysArray(dateToISOString(start), dateToISOString(new Date(start.setDate(start.getDate() + 6))));
    }, [displayDate]);

    const eventsByDay = useMemo(() => {
        const allEvents = getEventsByTrip(trip.id);
        const weekStart = weekDays[0].date;
        const weekEnd = weekDays[weekDays.length - 1].date;
        const eventsInWeek = allEvents.filter(e => new Date(e.eventDate + "T12:00:00Z") >= weekStart && new Date(e.eventDate + "T12:00:00Z") <= weekEnd);

        const grouped = new Map<string, { allDay: Event[], timed: Event[] }>();
        weekDays.forEach(({ iso }) => grouped.set(iso, { allDay: [], timed: [] }));

        eventsInWeek.forEach(event => {
            const group = grouped.get(event.eventDate);
            if (group) {
                if (event.startTime) {
                    group.timed.push(event);
                } else {
                    group.allDay.push(event);
                }
            }
        });
        
        grouped.forEach(value => value.timed.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
        return grouped;
    }, [weekDays, getEventsByTrip, trip.id]);

    return (
        <div className="mt-4 space-y-4">
            {weekDays.map(({ iso, date }) => {
                const dayEvents = eventsByDay.get(iso);
                const isToday = isSameDay(date, new Date());
                const isInTrip = date >= tripStartDate && date <= tripEndDate;

                const dayExpenses = expenses.filter(e => e.date.startsWith(iso));
                const dayTotal = dayExpenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);

                if (!isInTrip) return null;

                return (
                    <div key={iso} className="bg-surface p-4 rounded-2xl animate-fade-in">
                        <div onClick={() => onOpenDayDetail(date)} className="flex items-center gap-3 cursor-pointer">
                            <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl ${isToday ? 'bg-primary text-on-primary' : 'bg-surface-variant'}`}>
                                <span className="text-xs font-bold uppercase">{date.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                                <span className="text-xl font-bold">{date.getDate()}</span>
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-on-surface">{date.toLocaleDateString('it-IT', { weekday: 'long' })}</h3>
                                <p className="text-sm text-on-surface-variant">{date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            {dayTotal > 0 && <p className="text-sm font-semibold text-primary">{formatCurrency(dayTotal, trip.mainCurrency)}</p>}
                        </div>
                        <div className="mt-3 pl-2 space-y-2">
                            {dayEvents && dayEvents.allDay.length > 0 && (
                                <div className="space-y-2">
                                    {dayEvents.allDay.map(event => {
                                        const category = categories.find(c => c.name === event.type);
                                        const bgColor = category?.color || '#757780';
                                        const textColor = getContrastColor(bgColor);
                                        return (
                                            <div key={event.eventId} onClick={() => onOpenDayDetail(date)} className="p-2 rounded-lg text-sm font-semibold cursor-pointer" style={{ backgroundColor: bgColor, color: textColor }}>
                                                {event.title}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                             {dayEvents && dayEvents.timed.length > 0 && (
                                <div className="space-y-2 border-l-2 border-surface-variant pl-4">
                                    {dayEvents.timed.map(event => {
                                        const category = categories.find(c => c.name === event.type);
                                        const bgColor = category?.color || '#757780';
                                        const textColor = getContrastColor(bgColor);
                                        return (
                                            <div key={event.eventId} onClick={() => onOpenDayDetail(date)} className="flex items-center gap-3 cursor-pointer">
                                                <div className="text-xs font-mono text-on-surface-variant w-16 flex-shrink-0">
                                                    <p>{event.startTime}</p>
                                                    {event.endTime && <p className="opacity-70">{event.endTime}</p>}
                                                </div>
                                                <div className="flex-grow p-2 rounded-lg text-sm font-medium" style={{ backgroundColor: bgColor, color: textColor }}>
                                                    {event.title}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {dayEvents && dayEvents.allDay.length === 0 && dayEvents.timed.length === 0 && (
                                <p className="text-sm text-on-surface-variant pl-4 py-2">Nessun evento in programma.</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const getInitialMapDate = (trip: Trip) => {
    const today = new Date();
    const tripStart = new Date(trip.startDate.split('T')[0] + 'T12:00:00Z');
    const tripEnd = new Date(trip.endDate.split('T')[0] + 'T12:00:00Z');
    if (today >= tripStart && today <= tripEnd) {
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return trip.startDate.split('T')[0];
};

type ItineraryAgendaViewMode = 'day' | 'month' | 'week' | 'map';
type ItinerarySubView = 'agenda' | 'checklist';

// --- Main Itinerary View Component ---
const ItineraryView: React.FC<{ trip: Trip, onAddExpense: (prefill: Partial<Expense>) => void; }> = ({ trip, onAddExpense }) => {
    const { data } = useData();
    const { convert, formatCurrency } = useCurrencyConverter();
    const tripData = useMemo(() => data.trips.find(t => t.id === trip.id), [data.trips, trip.id]);
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

    const [agendaDateISO, setAgendaDateISO] = useState(initialAgendaDate);
    const [viewMode, setViewMode] = useState<ItineraryAgendaViewMode>('day');
    
    const [displayDate, setDisplayDate] = useState(() => new Date(agendaDateISO + 'T12:00:00Z'));
    const [selectedDateForDetail, setSelectedDateForDetail] = useState<string | null>(null);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    
    const [mapFilter, setMapFilter] = useState<MapFilterState>(() => ({
        mode: 'week',
        anchorDate: getInitialMapDate(trip),
        dateRange: {
            start: trip.startDate.split('T')[0],
            end: trip.endDate.split('T')[0],
        }
    }));

    const { isPrevDisabled, isNextDisabled, headerDateString } = useMemo(() => {
        let isPrev = false;
        let isNext = false;
        let headerStr = '';

        if (viewMode === 'month') {
            const displayYear = displayDate.getFullYear();
            const displayMonth = displayDate.getMonth();
            const tripStartYear = tripStartDate.getFullYear();
            const tripStartMonth = tripStartDate.getMonth();
            const tripEndYear = tripEndDate.getFullYear();
            const tripEndMonth = tripEndDate.getMonth();

            isPrev = displayYear < tripStartYear || (displayYear === tripStartYear && displayMonth <= tripStartMonth);
            isNext = displayYear > tripEndYear || (displayYear === tripEndYear && displayMonth >= tripEndMonth);
            
            headerStr = displayDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
        } else if (viewMode === 'week') {
            const { start, end } = getWeekRange(displayDate);
            isPrev = start <= tripStartDate;
            isNext = end >= tripEndDate;
            const startStr = start.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
            const endStr = end.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
            headerStr = `${startStr} - ${endStr}`;
        }
        return { isPrevDisabled: isPrev, isNextDisabled: isNext, headerDateString: headerStr };
    }, [displayDate, viewMode, tripStartDate, tripEndDate]);

    const totalSpentForPeriod = useMemo(() => {
        if (!tripData) return null;

        const expenses = tripData.expenses || [];
        if (expenses.length === 0) return 0;

        let start: Date;
        let end: Date;

        switch (viewMode) {
            case 'day':
                const day = new Date(agendaDateISO + 'T12:00:00Z');
                start = new Date(day.setHours(0, 0, 0, 0));
                end = new Date(day.setHours(23, 59, 59, 999));
                break;
            case 'week':
                const weekRange = getWeekRange(displayDate);
                start = weekRange.start;
                end = weekRange.end;
                break;
            case 'month':
                const monthRange = getMonthRange(displayDate);
                start = monthRange.start;
                end = monthRange.end;
                break;
            default:
                return null;
        }

        const total = expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= start && expDate <= end;
            })
            .reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);

        return total;
    }, [viewMode, displayDate, tripData, convert, trip.mainCurrency, agendaDateISO]);
    
    const handleNavigation = (delta: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            if (viewMode === 'month') {
                newDate.setMonth(newDate.getMonth() + delta, 1);
            } else {
                newDate.setDate(newDate.getDate() + (delta * 7));
            }
            return newDate;
        });
    };

    const handleDateSelect = useCallback((isoDate: string) => {
        setAgendaDateISO(isoDate);
        setViewMode('day');
    }, []);
    
    const handleViewModeChange = useCallback((newMode: ItineraryAgendaViewMode) => {
        if ((newMode === 'week' || newMode === 'month') && viewMode !== newMode) {
            setDisplayDate(new Date(agendaDateISO + 'T12:00:00Z'));
        }
        setViewMode(newMode);
    }, [agendaDateISO, viewMode]);

    const handleOpenDayDetail = (date: Date) => setSelectedDateForDetail(dateToISOString(date));
    const handleCloseDayDetail = () => setSelectedDateForDetail(null);
    
    const handleOpenAddEventForm = () => setIsAddingEvent(true);
    const handleCloseAddEventForm = () => setIsAddingEvent(false);

    const agendaHeaderTitle = useMemo(() => {
        if (viewMode === 'day') {
             const d = new Date(agendaDateISO + 'T12:00:00Z');
             return d.toLocaleString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
        }
         if (viewMode === 'week') {
            return headerDateString;
        }
        if (viewMode === 'month') {
             return displayDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
        }
        if (viewMode === 'map') return 'Mappa Itinerario';
        return '';
    }, [viewMode, headerDateString, displayDate, agendaDateISO]);

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

            {activeSubView === 'agenda' && (
                <>
                    <DayStrip
                        trip={trip}
                        selectedDate={agendaDateISO}
                        onSelectDate={handleDateSelect}
                    />
                    <div className="px-2 max-w-7xl mx-auto relative h-16 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-on-background capitalize">
                                {agendaHeaderTitle}
                            </h2>
                            {totalSpentForPeriod !== null && (viewMode === 'day' || viewMode === 'week' || viewMode === 'month') && (
                                <p className="text-sm font-semibold text-primary -mt-1">
                                    {totalSpentForPeriod > 0 ? `${formatCurrency(totalSpentForPeriod, trip.mainCurrency)} spesi` : 'Nessuna spesa'}
                                </p>
                            )}
                        </div>
                        {(viewMode === 'month' || viewMode === 'week') && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                                <button onClick={() => handleNavigation(-1)} disabled={isPrevDisabled} className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Periodo precedente"><span className="material-symbols-outlined">chevron_left</span></button>
                                <button onClick={() => handleNavigation(1)} disabled={isNextDisabled} className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed" aria-label="Periodo successivo"><span className="material-symbols-outlined">chevron_right</span></button>
                            </div>
                        )}
                    </div>
                     <div className="mt-4 bg-surface-variant p-1 rounded-full flex max-w-lg mx-auto">
                        <button onClick={() => handleViewModeChange('week')} className={`flex-1 py-1.5 rounded-full font-semibold text-sm transition-all ${viewMode === 'week' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}>7 Giorni</button>
                        <button onClick={() => handleViewModeChange('month')} className={`flex-1 py-1.5 rounded-full font-semibold text-sm transition-all ${viewMode === 'month' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}>Mese</button>
                        <button onClick={() => handleViewModeChange('map')} className={`flex-1 py-1.5 rounded-full font-semibold text-sm transition-all ${viewMode === 'map' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}>Mappa</button>
                    </div>
                    <main className="px-2 max-w-7xl mx-auto">
                        {viewMode === 'day' && (
                            <Suspense fallback={<div className="mt-4 h-[70vh] bg-surface-variant rounded-2xl animate-pulse" />}>
                                <DayDetailView 
                                    tripId={trip.id}
                                    selectedDate={agendaDateISO}
                                    onClose={() => {}}
                                    onAddExpense={onAddExpense}
                                    isEmbedded
                                />
                            </Suspense>
                        )}
                        {viewMode === 'month' && <MonthView displayDate={displayDate} trip={trip} categories={data.categories} onOpenDayDetail={handleOpenDayDetail} />}
                        {viewMode === 'week' && <WeekView displayDate={displayDate} trip={trip} categories={data.categories} onOpenDayDetail={handleOpenDayDetail} />}
                        {viewMode === 'map' && (
                            <Suspense fallback={<div className="mt-4 h-[70vh] bg-surface-variant rounded-2xl animate-pulse" />}>
                                <ItineraryMapView 
                                    trip={trip} 
                                    onOpenDayDetail={handleOpenDayDetail}
                                    filter={mapFilter}
                                    onFilterChange={setMapFilter}
                                />
                            </Suspense>
                        )}
                    </main>
                     <button
                        onClick={handleOpenAddEventForm}
                        className="fixed bottom-24 right-6 h-16 w-16 bg-secondary-container text-on-secondary-container dark:bg-blue-800 dark:text-white rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-90 z-30"
                        aria-label="Aggiungi nuovo evento"
                    >
                        <span className="material-symbols-outlined text-3xl">add</span>
                    </button>
                    {selectedDateForDetail && (
                        <Suspense fallback={<div/>}>
                            <DayDetailView 
                                tripId={trip.id}
                                selectedDate={selectedDateForDetail}
                                onClose={handleCloseDayDetail}
                                onAddExpense={onAddExpense}
                            />
                        </Suspense>
                    )}
                    {isAddingEvent && (
                        <Suspense fallback={<div />}>
                            <EventForm
                                selectedDate={dateToISOString(displayDate)}
                                tripId={trip.id}
                                onClose={handleCloseAddEventForm}
                            />
                        </Suspense>
                    )}
                </>
            )}

            {activeSubView === 'checklist' && (
                <main className="px-4 max-w-4xl mx-auto mt-4">
                    <Suspense fallback={<div className="p-4"><ExpenseListSkeleton /></div>}>
                        <Checklist trip={trip} />
                    </Suspense>
                </main>
            )}
        </div>
    );
};

export default ItineraryView;