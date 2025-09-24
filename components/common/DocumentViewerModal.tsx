import React from 'react';
import { Document as DocType } from '../../types';

interface DocumentViewerModalProps {
    document: DocType;
    onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document, onClose }) => {
    
    const isImage = document.type.startsWith('image/');
    const isPdf = document.type === 'application/pdf';

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-viewer-title"
            onClick={onClose}
        >
            <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 text-white bg-gradient-to-b from-black/50 to-transparent">
                <h2 id="document-viewer-title" className="text-lg font-semibold truncate">{document.name}</h2>
                <button onClick={onClose} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors" aria-label="Chiudi">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </header>

            <main className="w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {isImage && (
                    <img src={document.data} alt={document.name} className="max-w-full max-h-full object-contain" />
                )}
                {isPdf && (
                    <iframe src={document.data} title={document.name} className="w-full h-full border-none rounded-lg bg-white" />
                )}
                {!isImage && !isPdf && (
                    <div className="text-center text-white bg-surface p-8 rounded-2xl">
                        <span className="material-symbols-outlined text-5xl">folder_off</span>
                        <p className="mt-4 font-semibold">Formato file non supportato per l'anteprima.</p>
                        <p className="text-sm">Tipo: {document.type}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DocumentViewerModal;