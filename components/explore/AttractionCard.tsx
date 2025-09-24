import React from 'react';

interface Attraction {
    name: string;
    type: string;
    description: string;
    estimatedCost: string;
    location?: string;
}

interface AttractionCardProps {
    attraction: Attraction;
    onAdd: () => void;
    canAdd: boolean;
}

const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, onAdd, canAdd }) => {
    return (
        <div className="bg-surface-variant/50 p-4 rounded-2xl flex flex-col h-full">
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-on-surface">{attraction.name}</h4>
                    <div className="text-xs font-semibold bg-tertiary-container text-on-tertiary-container px-2 py-1 rounded-full flex-shrink-0 ml-2">
                        {attraction.type}
                    </div>
                </div>
                <p className="text-sm text-on-surface-variant mt-2">{attraction.description}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-outline/30 flex justify-between items-center">
                <div>
                    <p className="text-xs text-on-surface-variant">Costo Stimato</p>
                    <p className="font-semibold text-on-surface">{attraction.estimatedCost}</p>
                </div>
                {canAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-primary-container text-on-primary-container rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                        aria-label={`Aggiungi ${attraction.name} all'itinerario`}
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        Aggiungi
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttractionCard;
