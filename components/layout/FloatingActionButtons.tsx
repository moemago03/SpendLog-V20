import React from 'react';

interface FloatingActionButtonsProps {
    onAddExpense: () => void;
    onAIPanelOpen: () => void;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({ onAddExpense, onAIPanelOpen }) => {
    return (
        <div className="fixed bottom-20 right-4 flex flex-col items-center gap-3 z-20">
            <button
                onClick={onAIPanelOpen}
                className="h-10 w-10 bg-secondary-container text-on-secondary-container rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90"
                aria-label="Assistente AI"
            >
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
            </button>
            <button
                onClick={onAddExpense}
                className="h-12 w-12 bg-trip-primary text-trip-on-primary rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-90"
                aria-label="Aggiungi spesa"
            >
                <span className="material-symbols-outlined text-xl">add</span>
            </button>
        </div>
    );
};

export default FloatingActionButtons;
