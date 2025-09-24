import React from 'react';
import { useNotification } from '../../context/NotificationContext';

interface PackingPromptModalProps {
    itemName: string;
    onConfirm: () => void;
    onClose: () => void;
}

const PackingPromptModal: React.FC<PackingPromptModalProps> = ({ itemName, onConfirm, onClose }) => {
    const { addNotification } = useNotification();

    const handleConfirm = () => {
        onConfirm();
        addNotification(`"${itemName}" aggiunto alla checklist!`, 'success');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-end sm:items-center z-[60] p-4" onClick={onClose}>
            <div
                className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm flex flex-col p-6 text-center animate-slide-in-up"
                onClick={e => e.stopPropagation()}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="packing-prompt-title"
            >
                <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="material-symbols-outlined text-4xl text-on-secondary-container">luggage</span>
                </div>
                
                <h2 id="packing-prompt-title" className="text-xl font-bold text-on-surface">Non dimenticarlo!</h2>
                
                <p className="text-on-surface-variant my-2">
                    Vuoi aggiungere "<span className="font-semibold">{itemName}</span>" alla tua checklist per ricordarti di metterlo in valigia?
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-surface-variant text-on-surface-variant font-bold py-3 rounded-xl"
                    >
                        No, grazie
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-primary text-on-primary font-bold py-3 rounded-xl"
                    >
                        Sì, aggiungi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackingPromptModal;
