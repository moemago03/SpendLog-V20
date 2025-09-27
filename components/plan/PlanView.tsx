import React, { useState, lazy, Suspense, useMemo } from 'react';
import { Trip, Stage, AppView, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import PlanMapView from './PlanMapView';
import { getTripDurationDays, dateToISOString } from '../../utils/dateUtils';
import { STAGE_COLORS } from '../../constants';
import { useNotification } from '../../context/NotificationContext';
import { useIonAlert } from '@ionic/react';


// Lazy load modals for better performance
const AddDestinationView = lazy(() => import('./AddDestinationView'));
const StageDetailView = lazy(() => import('./StageDetailView'));
const AccommodationFiltersModal = lazy(() => import('./AccommodationFiltersModal'));
const FindStayModal = lazy(() => import('./FindStayModal'));

// Local component for adding/editing pinboard items to keep changes encapsulated
const AddEditPinboardItemForm: React.FC<{
    tripId: string;
    itemToEdit?: Partial<PlanItem>;
    onClose: () => void;
}> = ({ tripId, itemToEdit, onClose }) => {
    const { addPinboardItem, updatePinboardItem } = useData();
    const { addNotification } = useNotification();
    const isEditing = !!itemToEdit?.id;

    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [description, setDescription] = useState(itemToEdit?.description || '');
    const [link, setLink] = useState(itemToEdit?.link || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            addNotification("Il titolo è obbligatorio.", 'error');
            return;
        }

        if (isEditing) {
            const updatedItem: PlanItem = {
                ...(itemToEdit as PlanItem),
                title: title.trim(),
                description: description.trim() || undefined,
                link: link.trim() || undefined,
            };
            updatePinboardItem(tripId, updatedItem);
        } else {
             const newItem: Omit<PlanItem, 'id'> = {
                category: 'Notes',
                title: title.trim(),
                description: description.trim() || undefined,
                link: link.trim() || undefined,
                status: 'idea',
            };
            addPinboardItem(tripId, newItem);
        }
        onClose();
    };
    
    const inputClasses = "mt-1 block w-full bg-surface-variant border-transparent rounded-lg py-3 px-3 focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClasses = "block text-sm font-medium text-on-surface-variant";

    return (
         <div className="fixed inset-0 bg-background z-[51] flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="flex items-center p-4 flex-shrink-0 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">{isEditing ? 'Modifica Nota' : 'Aggiungi alla Bacheca'}</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="title" className={labelClasses}>Titolo</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className={inputClasses}/>
                    </div>
                     <div>
                        <label htmlFor="description" className={labelClasses}>Descrizione (Opzionale)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClasses}></textarea>
                    </div>
                    <div>
                        <label htmlFor="link" className={labelClasses}>Link (Opzionale)</label>
                        <input id="link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className={inputClasses}/>
                    </div>
                 </form>
            </main>
             <footer className="p-4 border-t border-surface-variant mt-auto flex-shrink-0">
                <button type="submit" onClick={handleSubmit} className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md">
                    {isEditing ? 'Salva Modifiche' : 'Salva'}
                </button>
            </footer>
        </div>
    );
};


interface PlanViewProps {
    trip: Trip;
    onNavigate: (view: AppView) => void;
}

const PlanView: React.FC<PlanViewProps> = ({ trip }) => {
    const { updateStage, deleteStage, deletePinboardItem } = useData();
    const [presentAlert] = useIonAlert();
    const [modal, setModal] = useState<'closed' | 'addDest' | 'viewStage' | 'findStay' | 'accommodationFilters'>('closed');
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
    const [addAfterStageId, setAddAfterStageId] = useState<string | null>(null);
    const [editingPinboardItem, setEditingPinboardItem] = useState<Partial<PlanItem> | null>(null);


    const handleUpdateNights = (stageId: string, delta: number) => {
        const stageToUpdate = trip.stages.find(s => s.id === stageId);
        if (!stageToUpdate) return;

        const newNights = stageToUpdate.nights + delta;
        if (newNights < 1) return; // A stage must last at least 1 night

        updateStage(trip.id, { ...stageToUpdate, nights: newNights });
    };

    const handleDeleteStage = (stageId: string) => {
        presentAlert({
            header: 'Conferma Eliminazione',
            message: 'Sei sicuro di voler rimuovere questa destinazione?',
            buttons: [
                {
                    text: 'Annulla',
                    role: 'cancel',
                },
                {
                    text: 'Elimina',
                    role: 'destructive',
                    handler: () => {
                        deleteStage(trip.id, stageId);
                    },
                },
            ],
        });
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

    const isZIndexIssueActive = modal !== 'closed' || !!editingPinboardItem;

    return (
        <>
            <div className="p-4 pb-28 max-w-4xl mx-auto space-y-6 animate-fade-in">
                <header className="pt-8 pb-4">
                    <h1 className="text-4xl font-bold text-on-background">Piano di Viaggio</h1>
                </header>
                
                <section className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-on-background">Bacheca</h2>
                        <button onClick={() => setEditingPinboardItem({ category: 'Notes' })} className="flex items-center gap-1 text-sm font-semibold bg-primary-container text-on-primary-container rounded-full px-3 py-1.5">
                            <span className="material-symbols-outlined text-base">add</span>
                            Aggiungi
                        </button>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-4 no-scrollbar">
                        {(trip.pinboardItems && trip.pinboardItems.length > 0) ? (
                            trip.pinboardItems.map(item => (
                                <div key={item.id} className="relative flex-shrink-0 w-64 bg-surface p-4 rounded-2xl shadow-sm space-y-2 group">
                                    <h4 className="font-bold text-on-surface">{item.title}</h4>
                                    {item.description && <p className="text-sm text-on-surface-variant line-clamp-3">{item.description}</p>}
                                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block truncate">Visualizza link</a>}
                                    <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingPinboardItem(item)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-full"><span className="material-symbols-outlined text-base">edit</span></button>
                                        <button onClick={() => deletePinboardItem(trip.id, item.id)} className="p-1.5 text-on-surface-variant hover:text-error rounded-full"><span className="material-symbols-outlined text-base">delete</span></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-shrink-0 w-full text-center py-8 px-4 bg-surface-variant/50 rounded-2xl">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">dashboard_customize</span>
                                <p className="font-semibold text-on-surface-variant">La bacheca è vuota.</p>
                                <p className="text-sm text-on-surface-variant/80 mt-1">Aggiungi note, link e idee per il viaggio.</p>
                            </div>
                        )}
                    </div>
                     <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
                </section>

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
                                        <button onClick={() => handleUpdateNights(stage.id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant">-</button>
                                        <span className="font-bold w-6 text-center">{stage.nights}</span>
                                        <button onClick={() => handleUpdateNights(stage.id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant">+</button>
                                    </div>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <button onClick={() => { setSelectedStage(stage); setModal('viewStage'); }} className="flex-1 bg-surface-variant text-on-surface-variant font-semibold py-2 rounded-lg">Apri</button>
                                    <button onClick={() => { setSelectedStage(stage); setModal('findStay'); }} className="flex-1 bg-primary-container text-on-primary-container font-semibold py-2 rounded-lg">Trova hotel</button>
                                    <button onClick={() => handleDeleteStage(stage.id)} className="w-10 h-10 bg-error-container/50 text-on-error-container flex-shrink-0 rounded-lg"><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={() => { setAddAfterStageId(trip.stages[trip.stages.length - 1]?.id || null); setModal('addDest'); }} className="w-full p-4 border-2 border-dashed border-outline/50 text-on-surface-variant font-semibold rounded-2xl hover:bg-surface-variant transition-colors">
                    Aggiungi Destinazione
                </button>
            </div>
            
            {modal === 'addDest' && (
                 <Suspense fallback={<div/>}>
                    <AddDestinationView trip={trip} afterStageId={addAfterStageId} onClose={() => setModal('closed')} />
                </Suspense>
            )}

            {modal === 'viewStage' && selectedStage && (
                 <Suspense fallback={<div/>}>
                    <StageDetailView trip={trip} stage={selectedStage} onClose={() => setModal('closed')} />
                </Suspense>
            )}

            {modal === 'accommodationFilters' && (
                 <Suspense fallback={<div/>}>
                    <AccommodationFiltersModal onClose={() => setModal('closed')} />
                </Suspense>
            )}
             {modal === 'findStay' && selectedStage && (
                 <Suspense fallback={<div/>}>
                    <FindStayModal stage={selectedStage} onClose={() => setModal('closed')} />
                </Suspense>
            )}
            {editingPinboardItem && (
                 <Suspense fallback={<div/>}>
                    <AddEditPinboardItemForm
                        tripId={trip.id}
                        itemToEdit={editingPinboardItem}
                        onClose={() => setEditingPinboardItem(null)}
                    />
                </Suspense>
            )}
        </>
    );
};

export default PlanView;