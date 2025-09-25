import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Trip, Stage } from '../../types';
import { useData } from '../../context/DataContext';
import { getTripDurationDays } from '../../utils/dateUtils';
import { AppView } from '../../App';

const AddDestinationView = lazy(() => import('./AddDestinationView'));
const StaysView = lazy(() => import('./StaysView'));


interface PlanViewProps {
    trip: Trip;
    onNavigate: (view: AppView) => void;
}

const PlanBottomNavBar: React.FC<{
    activeView: 'plan' | 'stays';
    onNavigate: (view: 'plan' | 'stays') => void;
    onAddClick: () => void;
}> = ({ activeView, onNavigate, onAddClick }) => (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-surface/95 backdrop-blur-lg border-t border-outline/20 z-30 flex items-center justify-around">
        <button
            onClick={() => onNavigate('plan')}
            className={`flex flex-col items-center font-semibold transition-colors ${activeView === 'plan' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
            <span className="material-symbols-outlined">map</span>
            <span className="text-xs">Plan</span>
        </button>
        <button
            onClick={onAddClick}
            className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg transform -translate-y-6 ring-4 ring-background"
            aria-label="Aggiungi destinazione"
        >
            <span className="material-symbols-outlined text-3xl">add</span>
        </button>
        <button
            onClick={() => onNavigate('stays')}
            className={`flex flex-col items-center font-semibold transition-colors ${activeView === 'stays' ? 'text-primary' : 'text-on-surface-variant'}`}
        >
            <span className="material-symbols-outlined">hotel</span>
            <span className="text-xs">Stays</span>
        </button>
    </div>
);


const PlanView: React.FC<PlanViewProps> = ({ trip, onNavigate }) => {
    const { updateStage, deleteStage } = useData();
    const [activePlanView, setActivePlanView] = useState<'plan' | 'stays'>('plan');
    const [isAddingDestination, setIsAddingDestination] = useState(false);
    const [addingAfterStageId, setAddingAfterStageId] = useState<string | null>(null);

    const totalTripNights = useMemo(() => {
        const duration = getTripDurationDays(trip.startDate, trip.endDate);
        return duration > 0 ? duration -1 : 0;
    }, [trip.startDate, trip.endDate]);

    const plannedNights = useMemo(() => {
        return (trip.stages || []).reduce((sum, stage) => sum + stage.nights, 0);
    }, [trip.stages]);

    const handleUpdateNights = (stage: Stage, delta: number) => {
        const newNights = stage.nights + delta;
        if (newNights < 1) { // Can't have 0 nights
            if (window.confirm(`Vuoi rimuovere "${stage.location.split(',')[0]}" dal piano?`)) {
                deleteStage(trip.id, stage.id);
            }
            return;
        }
        updateStage(trip.id, { ...stage, nights: newNights });
    };
    
    const handleDeleteStage = (stageId: string) => {
        const stage = trip.stages.find(s => s.id === stageId);
        if (stage && window.confirm(`Sei sicuro di voler rimuovere "${stage.location.split(',')[0]}" dal piano?`)) {
            deleteStage(trip.id, stageId);
        }
    };


    const handleAddDestinationClick = (afterStageId: string | null) => {
        setAddingAfterStageId(afterStageId);
        setIsAddingDestination(true);
    };

    const formatDate = (dateString: string) => new Date(dateString + 'T12:00:00Z').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

    const getStageEndDate = (stage: Stage) => {
        const startDate = new Date(stage.startDate + 'T12:00:00Z');
        startDate.setDate(startDate.getDate() + stage.nights -1);
        return formatDate(startDate.toISOString().split('T')[0]);
    };

    const renderEmptyState = () => (
        <div className="text-center py-16 px-6 mt-10 max-w-2xl mx-auto flex flex-col items-center animate-fade-in">
             <div className="relative mb-6">
                <div className="absolute -inset-8 bg-primary-container/20 rounded-full animate-pulse blur-2xl"></div>
                <img src="/assets/empt_plan.svg" alt="Empty plan illustration" className="relative w-48 h-48"/>
            </div>
            <h2 className="text-2xl font-bold text-on-surface">Press <span className="inline-flex items-center justify-center w-7 h-7 bg-green-500 text-white rounded-full mx-1 font-bold">+</span> to add your first destination</h2>
            <p className="mt-4 text-on-surface-variant max-w-sm">
                or
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <button 
                    onClick={() => { /* AI feature to be implemented */ }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container font-semibold rounded-full shadow-sm hover:shadow-lg transition-all transform active:scale-95"
                >
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    Generate trip with AI
                </button>
            </div>
        </div>
    );
    
    const renderPlanStages = () => (
         <div className="p-4 pb-28 space-y-6">
            <header className="flex justify-between items-center pt-8 pb-4">
                <button onClick={() => onNavigate('summary')} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-bold text-on-background">{trip.name}</h1>
                    <p className="text-sm text-on-surface-variant">{formatDate(trip.startDate.split('T')[0])} - {formatDate(trip.endDate.split('T')[0])}</p>
                </div>
                 <button className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">share</span>
                </button>
            </header>
            
            <div className="relative z-10 flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            className="stroke-current text-surface-variant"
                            strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                            fill="none"
                            className="stroke-current text-primary"
                            strokeWidth="3"
                            strokeDasharray={`${(plannedNights / (totalTripNights || 1)) * 100}, 100`}
                            strokeLinecap="round"
                            transform="rotate(-90 18 18)" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-on-surface">{plannedNights}/{totalTripNights}</span>
                    </div>
                </div>
                <div className="font-semibold text-lg text-on-surface">
                    Notti<br />pianificate
                </div>
            </div>

            {(!trip.stages || trip.stages.length === 0) ? renderEmptyState() : (
                <div className="space-y-2">
                    {trip.stages.map((stage, index) => (
                        <React.Fragment key={stage.id}>
                            <div className="flex items-center gap-3 animate-slide-in-up" style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}>
                                <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold text-sm flex-shrink-0">{index + 1}</div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-lg text-on-surface truncate">{stage.location.split(',')[0]}</p>
                                        <button onClick={() => handleDeleteStage(stage.id)} className="p-1 -mr-1 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container">
                                            <span className="material-symbols-outlined text-xl">close</span>
                                        </button>
                                    </div>
                                    <p className="text-sm text-on-surface-variant">{formatDate(stage.startDate)} - {getStageEndDate(stage)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleUpdateNights(stage, -1)} className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-2xl">-</button>
                                    <div className="text-center w-12">
                                        <p className="font-bold text-lg">{stage.nights}</p>
                                        <p className="text-xs -mt-1">night{stage.nights > 1 ? 's' : ''}</p>
                                    </div>
                                    <button onClick={() => handleUpdateNights(stage, 1)} className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center text-2xl">+</button>
                                </div>
                            </div>
                            {index < trip.stages.length - 1 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8"></div> {/* Spacer */}
                                    <div className="flex-grow flex items-center gap-2">
                                        <div className="w-px h-8 bg-outline/30 ml-3.5"></div>
                                        <button onClick={() => handleAddDestinationClick(stage.id)} className="flex items-center gap-1.5 text-sm text-red-500 font-semibold p-1">
                                            <span className="material-symbols-outlined text-base">add</span>
                                            <span>231 km</span> {/* Placeholder distance */}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    <div className="text-center pt-4">
                        <button className="px-6 py-2 bg-surface-variant text-on-surface-variant font-semibold rounded-full flex items-center gap-2 mx-auto">
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Optimize route
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            {activePlanView === 'plan' ? renderPlanStages() : (
                 <Suspense fallback={<div className="p-4">Loading...</div>}>
                    <StaysView trip={trip} />
                </Suspense>
            )}
           
             <PlanBottomNavBar 
                activeView={activePlanView}
                onNavigate={setActivePlanView}
                onAddClick={() => handleAddDestinationClick(trip.stages?.[trip.stages.length - 1]?.id || null)} 
             />

             {isAddingDestination && (
                <Suspense fallback={<div/>}>
                    <AddDestinationView 
                        trip={trip}
                        afterStageId={addingAfterStageId}
                        onClose={() => setIsAddingDestination(false)}
                    />
                </Suspense>
             )}
        </>
    );
};

export default PlanView;