import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Trip, ChecklistItem } from '../types';
import AddItemForm from './checklist/AddItemForm';
import ChecklistItems from './checklist/ChecklistItems';
import ChecklistProgress from './checklist/ChecklistProgress';
import ChecklistTemplates from './checklist/ChecklistTemplates';
const AIChecklistGenerator = lazy(() => import('./checklist/AIChecklistGenerator'));

interface ChecklistProps {
    trip: Trip;
    onCreateExpense: (item: ChecklistItem) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ trip, onCreateExpense }) => {
    const checklist = useMemo(() => trip.checklist || [], [trip.checklist]);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [checklistView, setChecklistView] = useState<'personal' | 'group'>('personal');

    const { personalItems, groupItems, completedPersonal, completedGroup } = useMemo(() => {
        const personal = checklist.filter(item => !item.isGroupItem);
        const group = checklist.filter(item => item.isGroupItem);
        return {
            personalItems: personal,
            groupItems: group,
            completedPersonal: personal.filter(i => i.completed).length,
            completedGroup: group.filter(i => i.completed).length,
        };
    }, [checklist]);

    const itemsToShow = checklistView === 'personal' ? personalItems : groupItems;
    const completedCount = checklistView === 'personal' ? completedPersonal : completedGroup;
    const totalCount = itemsToShow.length;

    return (
        <div className="space-y-6 pb-20">
             <div className="flex items-center p-1 bg-surface-variant rounded-full max-w-sm mx-auto">
                <button 
                    onClick={() => setChecklistView('personal')} 
                    className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${checklistView === 'personal' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}
                >
                    Personale
                </button>
                <button 
                    onClick={() => setChecklistView('group')} 
                    className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${checklistView === 'group' ? 'bg-surface text-primary shadow' : 'text-on-surface-variant'}`}
                >
                    Gruppo
                </button>
            </div>

            <AddItemForm tripId={trip.id} checklistView={checklistView} />

            <ChecklistProgress 
                completed={completedCount} 
                total={totalCount} 
            />
            
            <ChecklistItems 
                trip={trip}
                checklist={itemsToShow}
                onCreateExpense={onCreateExpense}
            />
            
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-on-surface">Aggiungi da template</h2>
                 <button 
                    onClick={() => setIsAIGeneratorOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-secondary-container text-on-secondary-container rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    Suggerimenti AI
                </button>
            </div>
            <ChecklistTemplates tripId={trip.id} checklistView={checklistView} />
            
            {isAIGeneratorOpen && (
                <Suspense fallback={<div />}>
                    <AIChecklistGenerator 
                        trip={trip}
                        onClose={() => setIsAIGeneratorOpen(false)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default Checklist;