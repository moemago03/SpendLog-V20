import React, { useState, useEffect } from 'react';

interface InAppBrowserProps {
    url: string;
    onClose: () => void;
}

const InAppBrowser: React.FC<InAppBrowserProps> = ({ url, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [iframeKey, setIframeKey] = useState(Date.now()); // To allow refresh

    const domain = new URL(url).hostname.replace('www.', '');

    const handleRefresh = () => {
        setIsLoading(true);
        setIframeKey(Date.now());
    };

    return (
        <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
            {/* Header with controls */}
            <header className="flex-shrink-0 h-14 bg-surface flex items-center justify-between px-2 border-b border-surface-variant">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-variant">
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="text-center">
                    <p className="text-sm font-bold text-on-surface">{domain}</p>
                    {isLoading && <p className="text-xs text-on-surface-variant">Caricamento...</p>}
                </div>
                <div className="flex items-center">
                    <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-surface-variant" aria-label="Aggiorna">
                        <span className="material-symbols-outlined text-base">refresh</span>
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-surface-variant" aria-label="Apri nel browser">
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                    </a>
                </div>
            </header>

            {/* Iframe for content */}
            <main className="flex-1 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface">
                        <div className="w-8 h-8 border-4 border-t-primary border-surface-variant rounded-full animate-spin"></div>
                    </div>
                )}
                <iframe
                    key={iframeKey}
                    src={url}
                    onLoad={() => setIsLoading(false)}
                    className={`w-full h-full border-none ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    title={`Browser in-app: ${domain}`}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
            </main>
        </div>
    );
};

export default InAppBrowser;