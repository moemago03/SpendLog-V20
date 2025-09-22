import React, { useState, useMemo, lazy, Suspense } from 'react';
import { AppView } from '../App';
import { useData } from '../context/DataContext';
import { Expense, Trip, Category } from '../types';
import Statistics from './Statistics';
import ExpenseListSkeleton from './ExpenseListSkeleton';
import SummaryHeader from './summary/SummaryHeader';
import BudgetProgress from './summary/BudgetProgress';
import RecentExpenses from './summary/RecentExpenses';
const QuickAddBar = lazy(() => import('./summary/QuickAddBar'));
const TodaysItineraryWidget = lazy(() => import('./summary/TodaysItineraryWidget'));


const CategoryBudgetTracker = lazy(() => import('./CategoryBudgetTracker'));
const AdvancedFilterPanel = lazy(() => import('./AdvancedFilterPanel'));
const GroupBalances = lazy(() => import('./GroupBalances'));

interface DashboardProps {
    activeTripId: string;
    currentView: Exclude<AppView, 'profile' | 'explore' | 'itinerary'>;
    setEditingExpense: (expense: Partial<Expense> | null) => void;
    onNavigate: (view: AppView) => void;
}

// FIX: Updated onEditExpense to accept null to align with the state setter from App.tsx.
const SummaryView: React.FC<{ 
    trip: Trip; 
    allCategories: Category[]; 
    onEditExpense: (expense: Partial<Expense> | null) => void;
    onNavigate: (view: AppView) => void;
}> = ({ trip, allCategories, onEditExpense, onNavigate }) => {

    const topCategories = useMemo(() => {
        const categoryCounts = (trip.expenses || []).reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const sortedCategoryNames = Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
        
        return sortedCategoryNames
            .slice(0, 3)
            .map(name => allCategories.find(c => c.name === name))
            .filter((c): c is Category => !!c);

    }, [trip.expenses, allCategories]);


    return (
        <div className="p-4 pb-28 max-w-2xl mx-auto space-y-6">
            <SummaryHeader trip={trip} />
            
            <BudgetProgress trip={trip} />

            <Suspense fallback={null}>
                <TodaysItineraryWidget
                    tripId={trip.id}
                    allCategories={allCategories}
                    onNavigateToItinerary={() => onNavigate('itinerary')}
                />
            </Suspense>

            <Suspense fallback={null}>
                <QuickAddBar
                    trip={trip}
                    topCategories={topCategories}
                    allCategories={allCategories}
                    onAddDetailed={() => onEditExpense({})}
                />
            </Suspense>

            {trip.enableCategoryBudgets && (
                <Suspense fallback={null}>
                    <CategoryBudgetTracker trip={trip} expenses={trip.expenses || []} />
                </Suspense>
            )}
            
            <RecentExpenses 
                trip={trip} 
                allCategories={allCategories}
                onEditExpense={onEditExpense}
            />
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ activeTripId, currentView, setEditingExpense, onNavigate }) => {
    const { data, loading } = useData();
    
    const activeTrip = useMemo(() => {
        return data?.trips.find(t => t.id === activeTripId);
    }, [data?.trips, activeTripId]);

    const expenses = useMemo(() => {
        if (!activeTrip?.expenses) return [];
        return [...activeTrip.expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activeTrip?.expenses]);

    if (loading || !activeTrip || !data?.categories) {
        return <div className="p-4"><ExpenseListSkeleton /></div>;
    }
    
    const renderContent = () => {
        switch (currentView) {
            case 'summary':
                return (
                    <SummaryView 
                        trip={activeTrip}
                        allCategories={data.categories}
                        onEditExpense={setEditingExpense}
                        onNavigate={onNavigate}
                    />
                );
            case 'stats':
                return (
                    <div className="p-4 pb-24 max-w-2xl mx-auto">
                        <Statistics trip={activeTrip} expenses={expenses} />
                    </div>
                );
            case 'group':
                return (
                    <div className="p-4 pb-24 max-w-2xl mx-auto">
                        <header className="pt-8 pb-4">
                            <h1 className="text-4xl font-bold text-on-background">Cruscotto di Gruppo</h1>
                        </header>
                        <Suspense fallback={<ExpenseListSkeleton />}>
                            <GroupBalances trip={activeTrip} />
                        </Suspense>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {renderContent()}
        </>
    );
};

export default Dashboard;
