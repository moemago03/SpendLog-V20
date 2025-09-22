import React, { useState, useMemo, lazy, Suspense } from 'react';
import { AppView } from '../App';
import { useData } from '../context/DataContext';
import { Expense, Trip, Category } from '../types';
import Statistics from './Statistics';
import Checklist from './Checklist';
import ExpenseListSkeleton from './ExpenseListSkeleton';
import SummaryHeader from './summary/SummaryHeader';
import BudgetProgress from './summary/BudgetProgress';
import RecentExpenses from './summary/RecentExpenses';


const CategoryBudgetTracker = lazy(() => import('./CategoryBudgetTracker'));
const AdvancedFilterPanel = lazy(() => import('./AdvancedFilterPanel'));
const GroupBalances = lazy(() => import('./GroupBalances'));

interface DashboardProps {
    activeTripId: string;
    currentView: Exclude<AppView, 'profile' | 'explore'>;
    setEditingExpense: (expense: Expense | null) => void;
}

const SummaryView: React.FC<{ 
    trip: Trip; 
    allCategories: Category[]; 
    onEditExpense: (expense: Expense) => void;
}> = ({ trip, allCategories, onEditExpense }) => {
    return (
        <div className="p-4 pb-28 max-w-2xl mx-auto space-y-6">
            <SummaryHeader trip={trip} />
            
            <BudgetProgress trip={trip} />

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

const Dashboard: React.FC<DashboardProps> = ({ activeTripId, currentView, setEditingExpense }) => {
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
                    />
                );
            case 'stats':
                return (
                    <div className="p-4 pb-24 max-w-2xl mx-auto">
                        <Statistics trip={activeTrip} expenses={expenses} />
                    </div>
                );
            case 'checklist':
                 return (
                    <div className="p-4 pb-24 max-w-2xl mx-auto">
                        <Checklist trip={activeTrip} />
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