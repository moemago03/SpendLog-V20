import React, { useState } from 'react';
import { useData } from '../../context/DataContext';

interface AddItemFormProps {
    tripId: string;
    checklistView: 'personal' | 'group';
}

const AddItemForm: React.FC<AddItemFormProps> = ({ tripId, checklistView }) => {
    const { addChecklistItem } = useData();
    const [newItemText, setNewItemText] = useState('');
    
    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            addChecklistItem(tripId, newItemText.trim(), checklistView === 'group');
            setNewItemText('');
        }
    };

    return (
        <form onSubmit={handleAddItem} className="w-full max-w-lg mx-auto">
            <div className="relative">
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder={`Aggiungi a checklist ${checklistView === 'personal' ? 'personale' : 'di gruppo'}...`}
                    className="w-full bg-surface shadow-lg rounded-full py-4 pl-6 pr-16 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center transition-transform active:scale-90" aria-label="Aggiungi elemento">
                     <span className="material-symbols-outlined">add</span>
                </button>
            </div>
        </form>
    );
};

export default AddItemForm;