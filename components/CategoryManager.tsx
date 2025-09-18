import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Category } from '../types';
import CategoryForm from './CategoryForm';
import { DEFAULT_CATEGORIES } from '../constants';

interface CategoryManagerProps {
    onClose: () => void;
}

const CategoryGridItem: React.FC<{
    category: Category;
    onClick: () => void;
}> = ({ category, onClick }) => (
    <div className="flex flex-col items-center gap-2 text-center cursor-pointer" onClick={onClick}>
        <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" 
            style={{ backgroundColor: category.color }}
        >
            {category.icon}
        </div>
        <p className="text-sm text-on-surface-variant w-full truncate">{category.name}</p>
    </div>
);

const CreateCategoryItem: React.FC<{ onClick: () => void; }> = ({ onClick }) => (
     <div className="flex flex-col items-center gap-2 text-center cursor-pointer" onClick={onClick}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-variant">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">add</span>
        </div>
        <p className="text-sm text-on-surface-variant font-medium">Crea</p>
    </div>
);


const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
    const { data, addCategory, updateCategory } = useData();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleCreate = () => {
        setEditingCategory(null);
        setView('form');
    };
    
    const handleEdit = (category: Category) => {
        const isDefault = DEFAULT_CATEGORIES.some(c => c.id === category.id);
        if (isDefault) {
            return;
        }
        setEditingCategory(category);
        setView('form');
    };
    
    const handleSave = (categoryData: Omit<Category, 'id' | 'expenses' | 'color'> & { color: string }) => {
        if (editingCategory) {
            updateCategory({ ...editingCategory, ...categoryData });
        } else {
            addCategory(categoryData);
        }
        setView('list');
        setEditingCategory(null);
    };

    return (
        <div className="fixed inset-0 bg-background z-50">
            {view === 'list' && (
                <div className="h-full flex flex-col">
                    <header className="flex items-center p-4">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                             <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-bold ml-4">Categorie</h1>
                    </header>
                    <main className="flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-4 gap-y-6">
                            <CreateCategoryItem onClick={handleCreate} />
                            {data.categories.map(cat => (
                                <CategoryGridItem key={cat.id} category={cat} onClick={() => handleEdit(cat)} />
                            ))}
                        </div>
                    </main>
                </div>
            )}
            {view === 'form' && (
                <CategoryForm
                    category={editingCategory || undefined}
                    onSave={handleSave}
                    onClose={() => setView('list')}
                />
            )}
        </div>
    );
};

export default CategoryManager;