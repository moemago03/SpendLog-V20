import React, { useMemo } from 'react';
import { Trip } from '../types';
import AddItemForm from './checklist/AddItemForm';
import ChecklistItems from './checklist/ChecklistItems';
import ChecklistProgress from './checklist/ChecklistProgress';
import ChecklistTemplates from './checklist/ChecklistTemplates';


interface ChecklistProps {
    trip: Trip;
}

const Checklist: React.FC<ChecklistProps> = ({ trip }) => {
    const checklist = useMemo(() => trip.checklist || [], [trip.checklist]);
    
    const { completedCount, totalCount } = useMemo(() => {
        const total = checklist.length;
        const completed = checklist.filter(item => item.completed).length;
        return { completedCount: completed, totalCount: total };
    }, [checklist]);

    return (
        <div className="space-y-6 pb-20">
            <AddItemForm tripId={trip.id} />

            <ChecklistProgress 
                completed={completedCount} 
                total={totalCount} 
            />
            
            <ChecklistItems 
                tripId={trip.id}
                checklist={checklist}
            />

            <ChecklistTemplates tripId={trip.id} />
        </div>
    );
};

export default Checklist;