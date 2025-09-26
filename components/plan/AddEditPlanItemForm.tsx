import React, { useState } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';

interface AddEditPlanItemFormProps {
    tripId: string;
    stageId: string;
    category: PlanItem['category'];
    itemToEdit?: PlanItem;
    onClose: () => void;
}

const AddEditPlanItemForm: React.FC<AddEditPlanItemFormProps> = ({ tripId, stageId, category, itemToEdit, onClose }) => {
    const { addPlanItem, updatePlanItem } = useData();
    const { addNotification } = useNotification();
    const isEditing = !!itemToEdit;

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
                ...itemToEdit,
                title: title.trim(),
                description: description.trim() || undefined,
                link: link.trim() || undefined,
            };
            updatePlanItem(tripId, stageId, updatedItem);
        } else {
             const newItem: Omit<PlanItem, 'id'> = {
                category,
                title: title.trim(),
                description: description.trim() || undefined,
                link: link.trim() || undefined,
                status: 'idea',
            };
            addPlanItem(tripId, stageId, newItem);
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
                <h1 className="text-xl font-bold ml-4">{isEditing ? 'Modifica' : 'Aggiungi'} {category.replace(' & ', ' & ')}</h1>
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

export default AddEditPlanItemForm;
