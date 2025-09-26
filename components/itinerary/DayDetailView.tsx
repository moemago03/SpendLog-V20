import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useItinerary } from '../../context/ItineraryContext';
import { Event, Expense, Trip } from '../../types';
import EventCard from './EventCard';
import AIDaySummary from './AIDaySummary';
import TravelInfo from '../checklist/TravelInfo';
import SafetyAlertWidget from './SafetyAlertWidget';
import { useData } from '../../context/DataContext';
import { useCurrencyConverter } from '../../hooks/useCurrencyConverter';
import { findStageForDate } from '../../utils/tripUtils';

const EventForm = lazy(() => import('./EventForm'));
const DuplicateEventModal = lazy(() => import('./DuplicateEventModal'));

interface DayDetailViewProps {
    tripId: string;
    selectedDate: string; // YYYY-MM-DD
    onAddExpense: (prefill: Partial<Expense>) => void;
}

const DailyBudgetWidget: React.FC<{ trip: Trip, events: Event[], expenses: Expense[] }> = ({ trip, events, expenses }) => {
    const { convert, formatCurrency } = useCurrencyConverter();
    
    const { dailyBudget, plannedCost, spentToday } = useMemo(() => {
        const tripDuration = Math.max(1, (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24) + 1);
        const budget = trip.totalBudget / tripDuration;

        const planned = events.reduce((sum, event) => {
            if (event.estimatedCost?.amount) {
                return sum + convert(event.estimatedCost.amount, event.estimatedCost.currency, trip.mainCurrency);
            }
            return sum;
        }, 0);

        const spent = expenses.reduce((sum, exp) => sum + convert(exp.amount, exp.currency, trip.mainCurrency), 0);
        
        return { dailyBudget: budget, plannedCost: planned, spentToday: spent };
    }, [trip, events, expenses, convert]);

    const remaining = dailyBudget - plannedCost - spentToday;
    
    return (
        <div className="p-4 bg-surface rounded-2xl shadow-sm space-y-3">
            <div className="flex justify-between items-center text-sm font-medium text-on-surface-variant">
                <span>Budget del Giorno</span>
                <span>{formatCurrency(dailyBudget, trip.mainCurrency)}</span>
            </div>
             <div className="flex justify-between items-center text-sm">
                <span>Pianificato</span>
                <span>- {formatCurrency(plannedCost, trip.mainCurrency)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span>Speso</span>
                <span>- {formatCurrency(spentToday, trip.mainCurrency)}</span>
            </div>
            <div className="border-t border-dashed border-outline/50 my-2"></div>
            <div className="flex justify-between items-center font-bold text-on-surface">
                <span>Rimanente Oggi</span>
                <span className={remaining < 0 ? 'text-error' : ''}>{formatCurrency(remaining, trip.mainCurrency)}</span>
            </div>
        </div>
    );
};


const DayDetailView: React.FC<DayDetailViewProps> = ({ tripId, selectedDate, onAddExpense }) => {
    const { getEventsByTrip, deleteEvent } = useItinerary();
    const { data } = useData();
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [duplicatingEvent, setDuplicatingEvent] = useState<Event | null>(null);

    const trip = useMemo(() => data.trips.find(t => t.id === tripId), [data.trips, tripId]);

    const currentStage = useMemo(() => {
        if (!trip) return null;
        return findStageForDate(trip, selectedDate);
    }, [trip, selectedDate]);

    const { dayEvents, todaysExpenses } = useMemo(() => {
        if (!trip) return { dayEvents: [], todaysExpenses: [] };
        const events = getEventsByTrip(tripId)
            .filter(event => {
                const eventStart = new Date(event.eventDate + 'T00:00:00Z');
                // FIX: For single-day events, the end date must be the end of that same day, not the start.
                const eventEnd = event.endDate 
                    ? new Date(event.endDate + 'T23:59:59Z') 
                    : new Date(event.eventDate + 'T23:59:59Z');
                const selected = new Date(selectedDate + 'T12:00:00Z');
                return selected >= eventStart && selected <= eventEnd;
            })
            .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
            
        const expenses = (trip.expenses || []).filter(exp => exp.date.startsWith(selectedDate));
        
        return { dayEvents: events, todaysExpenses: expenses };
    }, [getEventsByTrip, tripId, selectedDate, trip]);
    
    if (!trip) return null;

    return (
        <div className="animate-fade-in space-y-6">
            {currentStage && (
                <div className="px-4 text-center">
                    <h2 className="text-xl font-bold text-on-surface">
                        Il tuo programma a <span className="text-primary">{currentStage.location.split(',')[0]}</span>
                    </h2>
                </div>
            )}
            <DailyBudgetWidget trip={trip} events={dayEvents} expenses={todaysExpenses} />

            {dayEvents.length > 0 ? (
                <>
                    <AIDaySummary events={dayEvents} trip={trip} />
                    <div>
                        {dayEvents.map((event, index) => (
                            <EventCard
                                key={event.eventId}
                                event={event}
                                // FIX: Pass the trip object to EventCard to resolve context issues
                                trip={trip}
                                onEdit={() => setEditingEvent(event)}
                                onDelete={() => deleteEvent(trip.id, event.eventId)}
                                onDuplicate={() => setDuplicatingEvent(event)}
                                onAddExpense={onAddExpense}
                                isFirst={index === 0}
                                isLast={index === dayEvents.length - 1}
                                nextEvent={dayEvents[index + 1]}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-16 px-6 bg-surface-variant/50 rounded-3xl">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/50">event_busy</span>
                    <h2 className="text-2xl font-semibold text-on-surface mt-4">Nessun evento per oggi</h2>
                    <p className="mt-2 text-on-surface-variant max-w-xs mx-auto">
                        Goditi la giornata libera o aggiungi un nuovo evento al tuo programma!
                    </p>
                </div>
            )}
            
            <SafetyAlertWidget trip={trip} selectedDate={selectedDate} />
            <TravelInfo countries={trip.countries} />

            {editingEvent && (
                <Suspense fallback={<div/>}>
                    <EventForm
                        event={editingEvent}
                        tripId={tripId}
                        selectedDate={selectedDate}
                        onClose={() => setEditingEvent(null)}
                    />
                </Suspense>
            )}
             {duplicatingEvent && (
                <Suspense fallback={<div/>}>
                    <DuplicateEventModal
                        trip={trip}
                        eventToDuplicate={duplicatingEvent}
                        onClose={() => setDuplicatingEvent(null)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default DayDetailView;