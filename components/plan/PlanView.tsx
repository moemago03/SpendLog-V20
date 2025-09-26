import React, { useState, lazy, Suspense, useMemo } from 'react';
import { Trip, Stage, AppView } from '../../types';
import { useData } from '../../context/DataContext';
import PlanMapView from './PlanMapView';
import { getTripDurationDays, dateToISOString } from '../../utils/dateUtils';
import { STAGE_COLORS } from '../../constants';

// Lazy load modals for better performance
const AddDestinationView = lazy(() => import('./AddDestinationView'));
const StageDetailView = lazy(() => import('./StageDetailView'));
const AccommodationFiltersModal = lazy(() => import('./AccommodationFiltersModal'));
const FindStayModal = lazy(() => import('./FindStayModal'));

interface PlanViewProps {
    trip: Trip;
    onNavigate: (view: AppView) => void;
}

const PlanView: React.FC<PlanViewProps> = ({ trip }) => {
    const { updateStage, deleteStage } = useData();
    const [modal, setModal] = useState<'closed' | 'addDest' | 'viewStage' | 'findStay' | 'accommodationFilters'>('closed');
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
    const [addAfterStageId, setAddAfterStageId] = useState<string | null>(null);

    const handleUpdateNights = (stageId: string, delta: number) => {
        const stageToUpdate = trip.stages.find(s => s.id === stageId);
        if (!stageToUpdate) return;

        const newNights = stageToUpdate.nights + delta;
        if (newNights < 1) return; // A stage must last at least 1 night

        updateStage(trip.id, { ...stageToUpdate, nights: newNights });
    };

    const handleDeleteStage = (stageId: string) => {
        if (window.confirm("Sei sicuro di voler rimuovere questa destinazione?")) {
            deleteStage(trip.id, stageId);
        }
    };
    
    const totalTripNights = useMemo(() => {
        if (!trip.startDate || !trip.endDate) return 0;
        // Duration in days - 1 = nights
        return getTripDurationDays(trip.startDate, trip.endDate) -1;
    }, [trip.startDate, trip.endDate]);

    const plannedNights = useMemo(() => {
        return trip.stages.reduce((sum, stage) => sum + stage.nights, 0);
    }, [trip.stages]);
    
    const remainingBudget = useMemo(() => {
        const totalSpent = (trip.expenses || []).reduce((sum, exp) => sum + exp.amount, 0); // Simplified for now
        return trip.totalBudget - totalSpent;
    }, [trip.expenses, trip.totalBudget]);
    
    const locations = useMemo(() => trip.stages.map(s => s.location), [trip.stages]);

    const isZIndexIssueActive = modal !== 'closed';

    return (
        <>
            <div className="p-4 pb-28 max-w-4xl mx-auto space-y-6 animate-fade-in">
                <header className="pt-8 pb-4">
                    <h1 className="text-4xl font-bold text-on-background">Piano di Viaggio</h1>
                </header>
                
                <div className={`h-48 rounded-2xl overflow-hidden shadow-lg ${isZIndexIssueActive ? 'z-0' : 'z-10'}`}>
                    <PlanMapView locations={locations} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-surface p-3 rounded-2xl shadow-sm">
                        <p className="text-sm text-on-surface-variant">Notti</p>
                        <p className="font-bold text-lg text-on-surface">{plannedNights} / {totalTripNights}</p>
                    </div>
                     <div className="bg-surface p-3 rounded-2xl shadow-sm">
                        <p className="text-sm text-on-surface-variant">Budget Rimanente</p>
                        <p className="font-bold text-lg text-on-surface">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: trip.mainCurrency, minimumFractionDigits: 0 }).format(remainingBudget)}</p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button onClick={() => setModal('accommodationFilters')} className="text-sm font-semibold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">tune</span>
                        Parametri Alloggio
                    </button>
                </div>
                
                <div className="space-y-3">
                    {trip.stages.map((stage, index) => {
                        const startDate = new Date(stage.startDate + 'T12:00:00Z');
                        const endDate = new Date(startDate);
                        endDate.setDate(startDate.getDate() + stage.nights);
                        const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
                        const formattedDate = `${startDate.toLocaleDateString('it-IT', dateOptions)} - ${endDate.toLocaleDateString('it-IT', dateOptions)}`;

                        return (
                             <div key={stage.id} className="bg-surface p-4 rounded-2xl shadow-sm space-y-3">
                                <div className="flex items-start gap-4">
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-lg text-on-surface">{stage.location}</p>
                                        <p className="text-sm text-on-surface-variant">{formattedDate}</p>
                                    </div>
                                     <div className="flex items-center gap-3 bg-surface-variant p-1 rounded-full">
                                        <button onClick={() => handleUpdateNights(stage.id, -1)} className="w-7 h-7 rounded-full text-on-surface-variant flex items-center justify-center transition-transform active:scale-90">-</button>
                                        <span className="font-bold text-sm w-16 text-center">{stage.nights} notti</span>
                                        <button onClick={() => handleUpdateNights(stage.id, 1)} className="w-7 h-7 rounded-full text-on-surface-variant flex items-center justify-center transition-transform active:scale-90">+</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-surface-variant pt-3">
                                     <button onClick={() => handleDeleteStage(stage.id)} className="p-2 text-on-surface-variant hover:text-error rounded-full"><span className="material-symbols-outlined text-base">delete</span></button>
                                     <button onClick={() => { setSelectedStage(stage); setModal('findStay'); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-tertiary-container text-on-tertiary-container rounded-full"><span className="material-symbols-outlined text-sm">hotel</span>Cerca</button>
                                     <button onClick={() => { setSelectedStage(stage); setModal('viewStage'); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary-container text-on-primary-container rounded-full"><span className="material-symbols-outlined text-sm">edit_calendar</span>Pianifica</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center">
                    <button onClick={() => { setAddAfterStageId(trip.stages[trip.stages.length - 1]?.id || null); setModal('addDest'); }} className="flex items-center gap-2 px-6 py-3 bg-surface-variant font-semibold rounded-full">
                        <span className="material-symbols-outlined">add</span>
                        Aggiungi Destinazione
                    </button>
                </div>
            </div>
             {modal === 'addDest' && (
                <Suspense fallback={<div className="fixed inset-0 bg-background/50 z-50"/>}>
                    <AddDestinationView trip={trip} afterStageId={addAfterStageId} onClose={() => setModal('closed')} />
                </Suspense>
            )}
            {modal === 'viewStage' && selectedStage && (
                 <Suspense fallback={<div className="fixed inset-0 bg-background/50 z-50"/>}>
                    <StageDetailView trip={trip} stage={selectedStage} onClose={() => setModal('closed')} />
                </Suspense>
            )}
            {modal === 'findStay' && selectedStage && (
                 <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-40"/>}>
                    <FindStayModal stage={selectedStage} onClose={() => setModal('closed')} />
                </Suspense>
            )}
            {modal === 'accommodationFilters' && (
                 <Suspense fallback={<div className="fixed inset-0 bg-background/50 z-50"/>}>
                    <AccommodationFiltersModal onClose={() => setModal('closed')} />
                </Suspense>
            )}
        </>
    );
};

export default PlanView;
