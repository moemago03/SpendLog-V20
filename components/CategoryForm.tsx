
import React, { useState } from 'react';
import { Category } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';

interface CategoryFormProps {
    category?: Category;
    onSave: (categoryData: Omit<Category, 'id'>) => void;
    onClose: () => void;
    onDelete?: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onClose, onDelete }) => {
    const [name, setName] = useState(category?.name || '');
    const [selectedColor, setSelectedColor] = useState(category?.color || CATEGORY_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(category?.icon || CATEGORY_ICONS[0]);
    const [isItineraryCategory, setIsItineraryCategory] = useState(category?.isItineraryCategory || false);

    const handleSubmit = () => {
        if (!name.trim()) {
            alert("Il nome della categoria è obbligatorio.");
            return;
        }
        onSave({ name, icon: selectedIcon, color: selectedColor, isItineraryCategory });
    };

    const handleDeleteClick = () => {
        if(onDelete && window.confirm("Sei sicuro di voler eliminare questa categoria? Le spese associate verranno spostate in 'Varie'.")){
            onDelete();
        }
    };

    return (
        <div className="bg-background text-on-background h-full flex flex-col">
            <header className="flex items-center p-4">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold ml-4">Categoria personalizzata</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-8">
                <div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome"
                        className="w-full bg-surface-variant text-on-surface text-lg p-4 rounded-2xl border-2 border-transparent focus:border-primary focus:outline-none"
                    />
                </div>

                <div className="bg-surface-variant p-4 rounded-2xl flex items-center justify-between">
                    <label htmlFor="itinerary-toggle" className="font-medium text-on-surface">Usa nell'itinerario</label>
                    <button
                        id="itinerary-toggle"
                        role="switch"
                        aria-checked={isItineraryCategory}
                        onClick={() => setIsItineraryCategory(!isItineraryCategory)}
                        className={`relative inline-flex items-center h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-variant focus:ring-primary ${
                            isItineraryCategory ? 'bg-primary' : 'bg-on-surface/20'
                        }`}
                    >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            isItineraryCategory ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 -mb-2">
                        {CATEGORY_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-12 h-12 rounded-full flex-shrink-0 transition-transform transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Seleziona colore ${color}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-surface-variant p-4 rounded-3xl">
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                        {CATEGORY_ICONS.map(icon => (
                            <button
                                key={icon}
                                onClick={() => setSelectedIcon(icon)}
                                className={`aspect-square rounded-full flex items-center justify-center text-3xl transition-transform transform hover:scale-110 ${selectedIcon === icon ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-variant' : ''}`}
                                style={{ backgroundColor: selectedColor }}
                                aria-label={`Seleziona icona ${icon}`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="p-4 border-t border-surface-variant">
                 <div className="flex items-center gap-4">
                    {category && onDelete && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="w-16 h-16 flex items-center justify-center bg-error-container text-on-error-container rounded-2xl flex-shrink-0"
                            aria-label="Elimina categoria"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        className="w-full bg-on-surface-variant text-surface font-bold py-4 rounded-2xl"
                    >
                        Salva
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default CategoryForm;
