import React, { useState, useMemo } from 'react';
import { ChecklistItem } from '../../types';
import { useData } from '../../context/DataContext';

const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(10);
};

const ChecklistItems: React.FC<{
    tripId: string;
    checklist: ChecklistItem[];
}> = ({ tripId, checklist }) => {
    const { updateChecklistItem, deleteChecklistItem, clearCompletedChecklistItems } = useData();
    const [showCompleted, setShowCompleted] = useState(false);

    const { active, completed, total } = useMemo(() => {
        const activeItems = checklist.filter(item => !item.completed);
        const completedItems = checklist.filter(item => item.completed);
        return { active: activeItems, completed: completedItems, total: checklist.length };
    }, [checklist]);

    const handleToggleItem = (item: ChecklistItem) => {
        triggerHapticFeedback();
        updateChecklistItem(tripId, { ...item, completed: !item.completed });
    };

    const handleDeleteItem = (itemId: string) => {
        deleteChecklistItem(tripId, itemId);
    };

    const handleClearCompleted = () => {
        triggerHapticFeedback();
        clearCompletedChecklistItems(tripId);
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
        <div className="space-y-4">
            {/* Active Items */}
            <div className="space-y-3">
                {active.map((item, index) => (
                     <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-variant rounded-2xl animate-slide-in-up" style={{ animationDelay: `${index * 30}ms`, opacity: 0 }}>
                        <button onClick={() => handleToggleItem(item)} className="flex-shrink-0 w-6 h-6 rounded-md border-2 border-primary flex items-center justify-center transition-transform active:scale-90"></button>
                        <p className="flex-grow text-on-surface">{item.text}</p>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-on-surface-variant hover:text-error rounded-full transition-colors active:scale-90">
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                ))}
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
                                    <p className="flex-grow text-on-surface-variant line-through">{item.text}</p>
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
    );
};

export default ChecklistItems;