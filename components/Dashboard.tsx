import React, { lazy, Suspense } from 'react';
import { Trip, Expense } from '../types';
import { useData } from '../context/DataContext';
import { AppView } from '../App';
import LoadingScreen from './LoadingScreen';
import ExpenseListSkeleton from './ExpenseListSkeleton';

// Lazy load main view components
const SummaryHeader = lazy(() => import('./summary/SummaryHeader'));
const BudgetProgress = lazy(() => import('./summary/BudgetProgress'));
const RecentExpenses = lazy(() => import('./summary/RecentExpenses'));
const TodaysItineraryWidget = lazy(() => import('./summary/TodaysItineraryWidget'));
const QuickAddBar = lazy(() => import('./summary/QuickAddBar'));
const Statistics = lazy(() => import('./Statistics'));
const GroupBalances = lazy(() => import('./GroupBalances'));

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
            <Suspense fallback={<div className="h-[240px] bg-surface-variant rounded-3xl animate-pulse" />}>
                <SummaryHeader trip={activeTrip} />
            </Suspense>
            <Suspense fallback={null}>
                <QuickAddBar trip={activeTrip} onEditExpense={setEditingExpense} />
            </Suspense>
             <Suspense fallback={<div className="h-[158px] bg-surface-variant rounded-3xl animate-pulse" />}>
                <BudgetProgress trip={activeTrip} />
            </Suspense>
            <Suspense fallback={<div className="h-[150px] bg-surface-variant rounded-3xl animate-pulse" />}>
                <TodaysItineraryWidget
                    tripId={activeTrip.id}
                    allCategories={data?.categories || []}
                    onNavigateToItinerary={() => onNavigate('itinerary')}
                />
            </Suspense>
             <Suspense fallback={<ExpenseListSkeleton />}>
                <RecentExpenses
                    trip={activeTrip}
                    allCategories={data?.categories || []}
                    onEditExpense={setEditingExpense}
                />
            </Suspense>
        </div>
    );

    const renderStatsView = () => (
        <Suspense fallback={<LoadingScreen />}>
            <Statistics trip={activeTrip} expenses={activeTrip.expenses || []} />
        </Suspense>
    );
    
    const renderGroupView = () => (
        <Suspense fallback={<LoadingScreen />}>
            <GroupBalances trip={activeTrip} />
        </Suspense>
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
