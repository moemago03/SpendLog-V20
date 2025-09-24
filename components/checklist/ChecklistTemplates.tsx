import React from 'react';
import { useData } from '../../context/DataContext';
import { CHECKLIST_TEMPLATES } from '../../constants';

interface ChecklistTemplatesProps {
    tripId: string;
}

const ChecklistTemplates: React.FC<ChecklistTemplatesProps> = ({ tripId }) => {
    const { addChecklistFromTemplate } = useData();
    
    const handleAddTemplate = (templateName: string) => {
        const template = CHECKLIST_TEMPLATES[templateName];
        if (template && template.items) {
            addChecklistFromTemplate(tripId, template.items);
        }
    };
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.keys(CHECKLIST_TEMPLATES).map(templateName => (
                <button
                    key={templateName}
                    onClick={() => handleAddTemplate(templateName)}
                    className="p-3 bg-surface-variant rounded-2xl text-on-surface-variant hover:bg-primary-container/60 transition-colors text-left"
                >
                    <span className="material-symbols-outlined text-primary mb-1">{CHECKLIST_TEMPLATES[templateName].icon}</span>
                    <p className="font-semibold text-sm">{templateName}</p>
                </button>
            ))}
        </div>
    );
};

export default ChecklistTemplates;