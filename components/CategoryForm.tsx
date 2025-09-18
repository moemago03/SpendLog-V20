import React, { useState } from 'react';
import { Category } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';

interface CategoryFormProps {
    category?: Category;
    onSave: (categoryData: Omit<Category, 'id'>) => void;
    onClose: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSave, onClose }) => {
    const [name, setName] = useState(category?.name || '');
    const [selectedColor, setSelectedColor] = useState(category?.color || CATEGORY_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(category?.icon || CATEGORY_ICONS[0]);

    const handleSubmit = () => {
        if (!name.trim()) {
            alert("Il nome della categoria è obbligatorio.");
            return;
        }
        onSave({ name, icon: selectedIcon, color: selectedColor });
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
                <button
                    onClick={handleSubmit}
                    className="w-full bg-on-surface-variant text-surface font-bold py-4 rounded-2xl"
                >
                    Salva
                </button>
            </footer>
        </div>
    );
};

export default CategoryForm;