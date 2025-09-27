import React from 'react';
import { Trip, Expense } from '../types';
import { useData } from '../context/DataContext';
// FIX: Updated import path for AppView to resolve circular dependency.
import { AppView } from '../types';
import LoadingScreen from './LoadingScreen';

// Eagerly load components for instant tab switching
import SummaryHeader from './summary/SummaryHeader';
import BudgetProgress from './summary/BudgetProgress';
import RecentExpenses from './summary/RecentExpenses';
import TodaysItineraryWidget from './summary/TodaysItineraryWidget';
import QuickAddBar from './summary/QuickAddBar';
import Statistics from './Statistics';
import GroupView from './GroupBalances';
import { firebaseDebugInfo } from '../config';
import { isDevelopmentEnvironment } from '../services/dataService';

// --- START OF NEW DEBUG COMPONENT ---
const StatusIndicator: React.FC<{ status: 'initializing' | 'connecting' | 'connected' | 'error' | 'not_configured' }> = ({ status }) => {
    const statusConfig = {
        initializing: { color: 'bg-yellow-500', text: 'Inizializzazione' },
        connecting: { color: 'bg-blue-500', text: 'In Connessione' },
        connected: { color: 'bg-green-500', text: 'Connesso' },
        error: { color: 'bg-red-500', text: 'Errore' },
        not_configured: { color: 'bg-gray-500', text: 'Non Configurato' },
    };
    const config = statusConfig[status] || statusConfig.not_configured;
    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${config.color}`}></span>
            <span className="font-semibold uppercase text-xs tracking-wider">{config.text}</span>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex justify-between items-start py-2 border-b border-outline/20 last:border-b-0">
        <dt className="text-sm font-medium text-on-surface-variant flex-shrink-0 pr-4">{label}</dt>
        <dd className="text-sm text-on-surface text-right ml-4 break-words">{children}</dd>
    </div>
);

const FirebaseDebugInfo: React.FC = () => {
    const { firebaseStatus } = useData();

    return (
        <div className="mt-8">
            <details className="bg-surface rounded-3xl shadow-sm overflow-hidden group">
                <summary className="p-4 font-semibold text-on-surface cursor-pointer flex justify-between items-center list-none">
                    <span>Debug Connessione Firebase</span>
                    <span className="material-symbols-outlined transition-transform duration-200">expand_more</span>
                </summary>
                <div className="p-4 border-t border-surface-variant bg-surface-variant/30">
                    <dl>
                        <InfoRow label="Stato Connessione">
                            <StatusIndicator status={firebaseStatus.status} />
                        </InfoRow>
                        <InfoRow label="Messaggio di Stato">
                            <pre className="whitespace-pre-wrap text-right font-sans text-sm">{firebaseStatus.message}</pre>
                        </InfoRow>
                        <InfoRow label="Ambiente Rilevato">
                            {isDevelopmentEnvironment() ? 'Sviluppo (Dati Mock)' : 'Produzione (Firestore)'}
                        </InfoRow>
                         <InfoRow label="FIREBASE_API_KEY">
                            {firebaseDebugInfo.isConfigured ? 
                                <span className="font-bold text-green-600">RILEVATA</span> : 
                                <span className="font-bold text-red-600">NON RILEVATA</span>
                            }
                        </InfoRow>
                        <InfoRow label="Project ID">
                            {firebaseDebugInfo.projectId}
                        </InfoRow>
                    </dl>
                </div>
            </details>
        </div>
    );
};
// --- END OF NEW DEBUG COMPONENT ---


interface DashboardProps {
    activeTripId: string;
    currentView: AppView;
    setEditingExpense: (expense: Partial<Expense> & { checklistItemId?: string } | null) => void;
    onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeTripId, currentView, setEditingExpense, onNavigate }) => {
    const { data, loading } = useData();

    const activeTrip = data?.trips.find(t => t.id === activeTripId);

    if (loading) {
        return <LoadingScreen />;
    }

    if (!activeTrip) {
        // This case should be handled by App.tsx, but good to have a fallback.
        return (
            <div className="p-4 text-center">
                <h2 className="text-xl font-semibold">Viaggio non trovato.</h2>
                <p className="text-on-surface-variant">Seleziona un viaggio dal tuo profilo.</p>
            </div>
        );
    }

    const renderSummaryView = () => (
        <div className="space-y-6">
            <SummaryHeader trip={activeTrip} />
            <QuickAddBar trip={activeTrip} onEditExpense={setEditingExpense} />
            <BudgetProgress trip={activeTrip} />
            <TodaysItineraryWidget
                tripId={activeTrip.id}
                allCategories={data?.categories || []}
                onNavigateToItinerary={() => onNavigate('itinerary')}
            />
            <RecentExpenses
                trip={activeTrip}
                allCategories={data?.categories || []}
                onEditExpense={setEditingExpense}
            />
            <FirebaseDebugInfo />
        </div>
    );

    const renderStatsView = () => (
        <Statistics trip={activeTrip} expenses={activeTrip.expenses || []} />
    );
    
    const renderGroupView = () => (
        <GroupView trip={activeTrip} />
    );


    const renderContent = () => {
        switch (currentView) {
            case 'summary':
                return renderSummaryView();
            case 'stats':
                return renderStatsView();
            case 'group':
                 return renderGroupView();
            default:
                // Fallback to summary view if view is not recognized
                return renderSummaryView();
        }
    };

    return (
        <div className="p-4 pb-20">
            {renderContent()}
        </div>
    );
};

export default Dashboard;