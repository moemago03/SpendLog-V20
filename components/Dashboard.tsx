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
import GroupBalances from './GroupBalances';

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
        </div>
    );

    const renderStatsView = () => (
        <Statistics trip={activeTrip} expenses={activeTrip.expenses || []} />
    );
    
    const renderGroupView = () => (
        <GroupBalances trip={activeTrip} />
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