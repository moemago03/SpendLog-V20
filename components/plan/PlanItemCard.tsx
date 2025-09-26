import React from 'react';
import { PlanItem } from '../../types';
import { useData } from '../../context/DataContext';

interface PlanItemCardProps {
    item: PlanItem;
    tripId: string;
    stageId: string;
    onEdit: (item: PlanItem) => void;
}

const getIconForCategory = (category: PlanItem['category']): string => {
    switch (category) {
        case 'Sleep': return 'hotel';
        case 'See & Do': return 'photo_camera';
        case 'Eat & Drink': return 'restaurant';
        case 'Articles & Guides': return 'article';
        case 'Notes': return 'notes';
        default: return 'bookmark';
    }
}

const PlanItemCard: React.FC<PlanItemCardProps> = ({ item, tripId, stageId, onEdit }) => {
    const { deletePlanItem } = useData();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Sei sicuro di voler eliminare "${item.title}"?`)) {
            deletePlanItem(tripId, stageId, item.id);
        }
    };
    
    return (
        <div className="bg-surface p-3 rounded-2xl shadow-sm flex items-start gap-3">
             <div className="w-10 h-10 rounded-full bg-surface-variant flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">{getIconForCategory(item.category)}</span>
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-on-surface">{item.title}</p>
                {item.description && <p className="text-sm text-on-surface-variant truncate">{item.description}</p>}
                {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block" onClick={e => e.stopPropagation()}>Visualizza link</a>}
            </div>
             <div className="flex-shrink-0 flex items-center -mr-2">
                <button onClick={() => onEdit(item)} className="p-2 text-on-surface-variant hover:text-primary rounded-full"><span className="material-symbols-outlined text-base">edit</span></button>
                <button onClick={handleDelete} className="p-2 text-on-surface-variant hover:text-error rounded-full"><span className="material-symbols-outlined text-base">delete</span></button>
            </div>
        </div>
    );
};

export default PlanItemCard;