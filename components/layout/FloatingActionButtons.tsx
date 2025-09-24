import React from 'react';

interface FloatingActionButtonsProps {
    onAddExpense: () => void;
    onAIPanelOpen: () => void;
    onScanReceipt: () => void;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({ onAddExpense, onAIPanelOpen, onScanReceipt }) => {
    return (
        <div className="fixed bottom-24 right-4 flex flex-col items-center gap-3 z-20">
            <button
                onClick={onAIPanelOpen}
                className="h-10 w-10 bg-secondary-container text-on-secondary-container rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90"
                aria-label="Assistente AI"
            >
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
            </button>
             <button
                onClick={onScanReceipt}
                className="h-10 w-10 bg-tertiary-container text-on-tertiary-container rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90"
                aria-label="Scansiona ricevuta"
            >
                <span className="material-symbols-outlined text-lg">document_scanner</span>
            </button>
            <button
                onClick={onAddExpense}
                className="h-14 w-14 bg-trip-primary text-trip-on-primary rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-90"
                aria-label="Aggiungi spesa"
            >
                <span className="material-symbols-outlined text-2xl">add</span>
            </button>
        </div>
    );
};

export default FloatingActionButtons;
