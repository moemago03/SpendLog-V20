import React, { useState, useMemo, lazy, Suspense } from 'react';
import { ChecklistItem, Trip } from '../../types';
import { useData } from '../../context/DataContext';
import MemberAvatar from '../common/MemberAvatar';

const ChecklistItemDetailModal = lazy(() => import('./ChecklistItemDetailModal'));

const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(10);
};

interface ChecklistItemsProps {
    trip: Trip;
    checklist: ChecklistItem[];
    onCreateExpense: (item: ChecklistItem) => void;
}

const ChecklistItems: React.FC<ChecklistItemsProps> = ({ trip, checklist, onCreateExpense }) => {
    const { updateChecklistItem, deleteChecklistItem, clearCompletedChecklistItems } = useData();
    const [showCompleted, setShowCompleted] = useState(false);
    const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

    const { active, completed, total } = useMemo(() => {
        const activeItems = checklist.filter(item => !item.completed);
        const completedItems = checklist.filter(item => item.completed);
        return { active: activeItems, completed: completedItems, total: checklist.length };
    }, [checklist]);

    const handleToggleItem = (item: ChecklistItem) => {
        triggerHapticFeedback();
        updateChecklistItem(trip.id, { ...item, completed: !item.completed });
    };
    
    const handleEditItem = (item: ChecklistItem) => {
        setEditingItem(item);
    };

    const handleDeleteItem = (itemId: string) => {
        deleteChecklistItem(trip.id, itemId);
    };

    const handleClearCompleted = () => {
        triggerHapticFeedback();
        const itemsToClear = checklist.filter(item => item.completed);
        if (itemsToClear.length > 0) {
            // This is a simplified approach. A more robust implementation would batch deletes.
            itemsToClear.forEach(item => deleteChecklistItem(trip.id, item.id));
        }
    };


    if (total === 0) {
        return (
            <div className="text-center py-12 px-4 bg-surface-variant/50 rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">task_alt</span>
                <p className="font-semibold text-on-surface-variant text-lg">La tua checklist è pronta!</p>
                <p className="text-sm text-on-surface-variant/80 mt-1">Aggiungi elementi manualmente o usa i template qui sotto.</p>
            </div>
        );
    }
    
    return (
        <>
            <div className="space-y-4">
                {/* Active Items */}
                <div className="space-y-3">
                    {active.map((item, index) => {
                        const assignedMember = item.isGroupItem && item.assignedToMemberId 
                            ? trip.members?.find(m => m.id === item.assignedToMemberId) 
                            : null;
                        return (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-variant rounded-2xl animate-slide-in-up" style={{ animationDelay: `${index * 30}ms`, opacity: 0 }}>
                                <button onClick={() => handleToggleItem(item)} className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-primary flex items-center justify-center transition-transform active:scale-90"></button>
                                <div onClick={() => handleEditItem(item)} className="flex-grow cursor-pointer min-w-0">
                                    <p className="text-on-surface truncate">{item.text}</p>
                                    {item.reminderEventId && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-secondary font-medium">
                                            <span className="material-symbols-outlined text-sm">alarm</span>
                                            <span>Promemoria attivo</span>
                                        </div>
                                    )}
                                </div>
                                {assignedMember && <MemberAvatar member={assignedMember} className="w-6 h-6 text-[10px]"/>}
                                <div className="flex items-center">
                                    {item.expenseId ? (
                                        <div className="p-1.5 text-primary" title="Spesa collegata">
                                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                                        </div>
                                    ) : (
                                        <button onClick={() => onCreateExpense(item)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-full transition-colors active:scale-90" aria-label="Aggiungi spesa">
                                            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                                        </button>
                                    )}
                                    <button onClick={() => handleEditItem(item)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-full transition-colors active:scale-90" aria-label="Modifica elemento">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Completed Items */}
                {completed.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-outline/20">
                        <div className="flex justify-between items-center p-2">
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className="flex-grow flex items-center gap-2 rounded-lg hover:bg-surface-variant transition-colors text-left p-2 -m-2"
                                aria-expanded={showCompleted}
                            >
                                <span className="font-semibold text-on-surface-variant">Completati ({completed.length})</span>
                                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${showCompleted ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>
                            <button 
                                onClick={handleClearCompleted}
                                className="text-sm font-medium text-primary hover:underline px-2 flex-shrink-0 transition-transform active:scale-95"
                                aria-label="Svuota elementi completati"
                            >
                                Svuota
                            </button>
                        </div>

                        {showCompleted && (
                            <div className="space-y-3 animate-fade-in" style={{animationDuration: '300ms'}}>
                                {completed.map((item, index) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-variant/50 rounded-2xl animate-slide-in-up" style={{ animationDelay: `${index * 30}ms`, opacity: 0 }}>
                                        <button onClick={() => handleToggleItem(item)} className="flex-shrink-0 w-6 h-6 rounded-md bg-primary flex items-center justify-center text-on-primary transition-transform active:scale-90">
                                            <span className="material-symbols-outlined text-base">check</span>
                                        </button>
                                        <p onClick={() => handleEditItem(item)} className="flex-grow text-on-surface-variant line-through cursor-pointer">{item.text}</p>
                                        {item.expenseId && (
                                            <div className="p-1.5 text-primary flex-shrink-0" title="Spesa collegata">
                                                <span className="material-symbols-outlined text-lg">receipt_long</span>
                                            </div>
                                        )}
                                         <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-on-surface-variant/50 hover:text-error rounded-full transition-colors active:scale-90">
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {editingItem && (
                <Suspense fallback={<div/>}>
                    <ChecklistItemDetailModal
                        item={editingItem}
                        trip={trip}
                        onClose={() => setEditingItem(null)}
                    />
                </Suspense>
            )}
        </>
    );
};

export default ChecklistItems;