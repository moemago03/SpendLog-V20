import React, { useState } from 'react';
import { Trip, Expense } from '../types';
import AIInsights from './AIInsights';
import AIForecast from './AIForecast';
import QuickExpense from './QuickExpense';

interface AIPanelProps {
    trip: Trip;
    expenses: Expense[];
    onClose: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ trip, expenses, onClose }) => {
    const [activeTab, setActiveTab] = useState('insights');

    const TabButton = ({ tabId, label, icon }: { tabId: string, label: string, icon: string }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 flex flex-col items-center justify-center p-3 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tabId
                    ? 'bg-surface text-primary'
                    : 'text-on-surface-variant hover:bg-surface-variant/70'
            }`}
            role="tab"
            aria-selected={activeTab === tabId}
        >
            <span className="material-symbols-outlined mb-1">{icon}</span>
            {label}
        </button>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} aria-hidden="true"></div>
            <div 
                className="fixed bottom-0 right-0 left-0 sm:left-auto sm:bottom-8 sm:right-8 bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:w-[450px] max-h-[80vh] flex flex-col z-50 animate-[slide-up_0.3s_ease-out]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ai-panel-title"
            >
                <header className="flex justify-between items-center p-4 border-b border-surface-variant flex-shrink-0">
                    <h2 id="ai-panel-title" className="text-xl font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        Assistente AI
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant" aria-label="Chiudi">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <div className="flex justify-around border-b border-surface-variant flex-shrink-0" role="tablist">
                    <TabButton tabId="insights" label="Analisi" icon="insights" />
                    <TabButton tabId="forecast" label="Previsioni" icon="show_chart" />
                    <TabButton tabId="quick" label="Spesa Rapida" icon="bolt" />
                </div>

                <main className="overflow-y-auto p-6 flex-1">
                    <div role="tabpanel" hidden={activeTab !== 'insights'}>
                        <AIInsights expenses={expenses} trip={trip} />
                    </div>
                    <div role="tabpanel" hidden={activeTab !== 'forecast'}>
                        <AIForecast expenses={expenses} trip={trip} />
                    </div>
                    <div role="tabpanel" hidden={activeTab !== 'quick'}>
                        <QuickExpense trip={trip} />
                    </div>
                </main>
            </div>
            {/* Simple animation styles */}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @media (min-width: 640px) {
                    @keyframes slide-up {
                        from { transform: translateY(2rem) scale(0.95); opacity: 0; }
                        to { transform: translateY(0) scale(1); opacity: 1; }
                    }
                }
                .animate-\\[slide-up_0\\.3s_ease-out\\] {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default AIPanel;
