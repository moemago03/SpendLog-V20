import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import { Poi } from '../../services/poiService';

const AddPlanItemView = lazy(() => import('./AddPlanItemView'));
const StageInfoView = lazy(() => import('./StageInfoView'));
const PlanItemCard = lazy(() => import('./PlanItemCard'));
const GenerateDayPlanModal = lazy(() => import('./GenerateDayPlanModal'));
const AddEditPlanItemForm = lazy(() => import('./AddEditPlanItemForm'));
const PoiDetailView = lazy(() => import('./PoiDetailView'));
const FindGuidesView = lazy(() => import('./FindGuidesView'));


// Custom hook for debouncing
const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


interface StageDetailViewProps {
    trip: Trip;
    stage: Stage;
    onClose: () => void;
}

const StageDetailView: React.FC<StageDetailViewProps> = ({ trip, stage, onClose }) => {
    const { updateStage } = useData();
    const [activeTab, setActiveTab] = useState<'plan' | 'info'>('plan');
    
    // State for modals
    const [addingSeeDo, setAddingSeeDo] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
    const [addingGenericCategory, setAddingGenericCategory] = useState<PlanItem['category'] | null>(null);
    const [viewingPoi, setViewingPoi] = useState<Poi | null>(null);
    const [isFindingGuides, setIsFindingGuides] = useState(false);


    // State for notes
    const [notes, setNotes] = useState(stage.notes || '');
    const debouncedNotes = useDebounce(notes, 800);

    useEffect(() => {
        // Auto-save notes when debounced value changes and is different from original
        if (debouncedNotes !== (stage.notes || '')) {
            updateStage(trip.id, { ...stage, notes: debouncedNotes });
        }
    }, [debouncedNotes, stage, trip.id, updateStage]);

    const planItems = useMemo(() => stage.planItems || [], [stage.planItems]);
    const sleepItems = planItems.filter(i => i.category === 'Sleep');
    const seeDoItems = planItems.filter(i => i.category === 'See & Do');
    const eatDrinkItems = planItems.filter(i => i.category === 'Eat & Drink');
    const guidesItems = planItems.filter(i => i.category === 'Articles & Guides');

    const formatDateRange = () => {
        const startDate = new Date(stage.startDate + 'T12:00:00Z');
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + stage.nights);
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
        return `${startDate.toLocaleDateString('it-IT', options)} - ${endDate.toLocaleDateString('it-IT', options)}`;
    };

    const handleAddItem = (category: PlanItem['category']) => {
        setEditingItem(null); // Ensure we are not in edit mode
        if (category === 'See & Do') {
            setAddingSeeDo(true);
        } else if (category === 'Articles & Guides') {
            setIsFindingGuides(true);
        } else {
            setAddingGenericCategory(category);
        }
    };

    const handleEditItem = (item: PlanItem) => {
        setEditingItem(item);
        if (item.category === 'See & Do') {
            // For now, even 'See & Do' items are edited with the generic form for simplicity
            setAddingGenericCategory('See & Do');
        } else {
            setAddingGenericCategory(item.category);
        }
    };
    
    const renderCategorySection = (icon: string, title: PlanItem['category'], items: PlanItem[]) => (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-variant flex-shrink-0 flex items-center justify-center"><span className="material-symbols-outlined">{icon}</span></div>
            <div className="flex-grow border-b border-surface-variant pb-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <div className="flex items-center gap-2">
                         <button onClick={() => handleAddItem(title)} className="w-8 h-8 rounded-full border-2 border-outline/50 flex items-center justify-center"><span className="material-symbols-outlined text-lg">add</span></button>
                         <div className="relative">
                            <button className="w-8 h-8 rounded-full border-2 border-outline/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">bookmark_border</span>
                            </button>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">0</div>
                         </div>
                    </div>
                </div>
                 {items.length > 0 ? (
                    <div className="mt-2 space-y-2">
                       {items.map(item => (
                           <Suspense fallback={<div className="h-16 bg-surface-variant/50 rounded-2xl animate-pulse"/>} key={item.id}>
                               <PlanItemCard
                                   item={item}
                                   tripId={trip.id}
                                   stageId={stage.id}
                                   onEdit={handleEditItem}
                               />
                           </Suspense>
                       ))}
                    </div>
                ) : (
                     <p className="text-sm text-on-surface-variant mt-1">Nothing planned</p>
                )}
            </div>
        </div>
    );
    
    if (viewingPoi) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center">Caricamento...</div>}>
                    <PoiDetailView 
                        poi={viewingPoi}
                        trip={trip}
                        stage={stage}
                        onBack={() => setViewingPoi(null)}
                    />
                </Suspense>
            </div>
        );
    }


    return (
        <>
            <div className="fixed inset-0 bg-background z-50 flex flex-col animate-[slide-up_0.3s_ease-out]">
                {/* Header */}
                <header className="p-4 flex justify-between items-center border-b border-surface-variant">
                    <button onClick={onClose} className="p-2 -m-2 rounded-full"><span className="material-symbols-outlined">close</span></button>
                    <div className="text-center">
                        <h1 className="text-xl font-bold">{stage.location.split(',')[0]}</h1>
                        <p className="text-sm text-on-surface-variant">{formatDateRange()}</p>
                    </div>
                    <button className="p-2 -m-2 rounded-full"><span className="material-symbols-outlined">more_horiz</span></button>
                </header>

                {/* Tabs */}
                <div className="p-4 flex items-center justify-center">
                    <div className="flex items-center p-1 bg-surface-variant rounded-full">
                        <button onClick={() => setActiveTab('plan')} className={`px-8 py-2 rounded-full text-sm font-semibold ${activeTab === 'plan' ? 'bg-surface shadow' : 'text-on-surface-variant'}`}>Plan</button>
                        <button onClick={() => setActiveTab('info')} className={`px-8 py-2 rounded-full text-sm font-semibold ${activeTab === 'info' ? 'bg-surface shadow' : 'text-on-surface-variant'}`}>Info</button>
                    </div>
                </div>

                {/* Content */}
                <main className="flex-1 overflow-y-auto px-4 space-y-4 pb-8">
                    {activeTab === 'plan' && (
                        <>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Aggiungi note, numeri di prenotazione, idee..."
                                className="w-full p-3 bg-surface-variant/70 rounded-xl min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                            />

                            <button onClick={() => setIsGeneratingPlan(true)} className="w-full flex items-center justify-center gap-2 p-3 bg-surface-variant rounded-xl font-semibold text-primary">
                                <span className="material-symbols-outlined">auto_awesome</span>
                                Generate day plan
                            </button>

                            {renderCategorySection("hotel", "Sleep", sleepItems)}
                            {renderCategorySection("photo_camera", "See & Do", seeDoItems)}
                            {renderCategorySection("restaurant", "Eat & Drink", eatDrinkItems)}
                            {renderCategorySection("article", "Articles & Guides", guidesItems)}
                        </>
                    )}
                     {activeTab === 'info' && (
                        <Suspense fallback={<div className="text-center p-8">Caricamento informazioni...</div>}>
                            <StageInfoView trip={trip} stage={stage} onPoiClick={setViewingPoi} />
                        </Suspense>
                    )}
                </main>
            </div>

            {addingSeeDo && (
                <Suspense fallback={<div className="fixed inset-0 bg-background/50 z-[51]" />}>
                    <AddPlanItemView
                        trip={trip}
                        stage={stage}
                        category="See & Do"
                        onClose={() => setAddingSeeDo(false)}
                    />
                </Suspense>
            )}
            
            {(addingGenericCategory || editingItem) && (
                <Suspense fallback={<div className="fixed inset-0 bg-background/50 z-[51]" />}>
                    <AddEditPlanItemForm
                        tripId={trip.id}
                        stageId={stage.id}
                        category={addingGenericCategory || editingItem!.category}
                        itemToEdit={editingItem || undefined}
                        onClose={() => {
                            setAddingGenericCategory(null);
                            setEditingItem(null);
                        }}
                    />
                </Suspense>
            )}

            {isGeneratingPlan && (
                <Suspense fallback={<div className="fixed inset-0 bg-background/50 z-[51]" />}>
                    <GenerateDayPlanModal
                        trip={trip}
                        stage={stage}
                        onClose={() => setIsGeneratingPlan(false)}
                    />
                </Suspense>
            )}
            
            {isFindingGuides && (
                <Suspense fallback={<div className="fixed inset-0 bg-background/50 z-[51]" />}>
                    <FindGuidesView
                        trip={trip}
                        stage={stage}
                        onClose={() => setIsFindingGuides(false)}
                    />
                </Suspense>
            )}
        </>
    );
}

export default StageDetailView;