import React, { useState, useMemo, lazy, Suspense, useCallback } from 'react';
// FIX: Import AppView from types.ts to avoid circular dependencies.
import { Trip, Expense, ChecklistItem, AppView } from './types';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ItineraryProvider } from './context/ItineraryContext';
import { LocationProvider } from './context/LocationContext';

import LoginScreen from './components/LoginScreen';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './components/layout/MainLayout';
import NotificationContainer from './components/NotificationContainer';
import FloatingActionButtons from './components/layout/FloatingActionButtons';

// Eagerly load main components for faster navigation
import Dashboard from './components/Dashboard';
import ProfileScreen from './components/ProfileScreen';
import ItineraryView from './components/itinerary/ItineraryView';

// Lazy load components that are not opened immediately
const ExpenseForm = lazy(() => import('./components/ExpenseForm'));
const AIPanel = lazy(() => import('./components/AIPanel'));
const PackingPromptModal = lazy(() => import('./components/prompts/PackingPromptModal'));
const ReceiptScanner = lazy(() => import('./components/ReceiptScanner'));
const PlanView = lazy(() => import('./components/plan/PlanView'));


// The main views of the application
// FIX: Moved AppView to types.ts to resolve circular dependency.

const AppContent: React.FC = () => {
    const { data, loading, setDefaultTrip, addChecklistItem } = useData();
    
    // State for UI management
    const [currentView, setCurrentView] = useState<AppView>('summary');
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> & { checklistItemId?: string } | null>(null);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);
    
    const [packingPrompt, setPackingPrompt] = useState<{ tripId: string, itemName: string } | null>(null);

    const activeTripId = useMemo(() => data?.defaultTripId || data?.trips[0]?.id || null, [data]);
    const activeTrip = useMemo(() => data?.trips.find(t => t.id === activeTripId) || null, [data, activeTripId]);

    const handleSetDefaultTrip = (tripId: string) => {
        setDefaultTrip(tripId);
    };
    
    const handleLogout = () => {
        // In this mock setup, we clear local storage and reload to show the login screen.
        localStorage.removeItem('vsc_user');
        window.location.reload();
    };

    const handleShowPackingPrompt = useCallback((tripId: string, itemName: string) => {
        setPackingPrompt({ tripId, itemName });
    }, []);

    const handleConfirmPackingPrompt = () => {
        if (packingPrompt) {
            addChecklistItem(packingPrompt.tripId, packingPrompt.itemName, false);
            setPackingPrompt(null);
        }
    };

    const handleScanComplete = (scannedExpense: Partial<Expense>) => {
        setEditingExpense(scannedExpense);
        setIsScanningReceipt(false);
    };

    const renderView = () => {
        if (!activeTrip) {
            // If no trip is selected or exists, default to profile view to create one
            return <ProfileScreen trips={data?.trips || []} activeTripId={activeTripId} onSetDefaultTrip={handleSetDefaultTrip} onLogout={handleLogout} />;
        }
        
        switch (currentView) {
            case 'summary':
            case 'stats':
            case 'group':
                return <Dashboard activeTripId={activeTrip.id} currentView={currentView} setEditingExpense={setEditingExpense} onNavigate={setCurrentView} />;
            case 'plan':
                return <Suspense fallback={<LoadingScreen />}><PlanView trip={activeTrip} onNavigate={setCurrentView} /></Suspense>;
            case 'itinerary':
                 return <ItineraryView trip={activeTrip} onAddExpense={setEditingExpense} />;
            case 'profile':
                return <ProfileScreen trips={data?.trips || []} activeTripId={activeTripId} onSetDefaultTrip={handleSetDefaultTrip} onLogout={handleLogout} />;
            default:
                return <Dashboard activeTripId={activeTrip.id} currentView="summary" setEditingExpense={setEditingExpense} onNavigate={setCurrentView} />;
        }
    };

    if (loading && !data) {
        return <LoadingScreen />;
    }

    return (
        <>
            <MainLayout 
                activeView={currentView} 
                onNavigate={setCurrentView} 
                isTripActive={!!activeTrip}
            >
                {renderView()}
            </MainLayout>

            {currentView === 'summary' && activeTrip && (
                 <FloatingActionButtons
                    onAddExpense={() => setEditingExpense({})}
                    onAIPanelOpen={() => setIsAIPanelOpen(true)}
                    onScanReceipt={() => setIsScanningReceipt(true)}
                 />
            )}

            {editingExpense && activeTrip && (
                 <Suspense fallback={<div/>}>
                    <ExpenseForm 
                        expense={editingExpense} 
                        trip={activeTrip} 
                        onClose={() => setEditingExpense(null)} 
                        onShowPackingPrompt={handleShowPackingPrompt}
                    />
                 </Suspense>
            )}

            {isAIPanelOpen && activeTrip && (
                <Suspense fallback={<div/>}>
                    <AIPanel 
                        trip={activeTrip}
                        expenses={activeTrip.expenses || []}
                        onClose={() => setIsAIPanelOpen(false)}
                    />
                </Suspense>
            )}
            
             {packingPrompt && (
                <Suspense fallback={<div/>}>
                    <PackingPromptModal
                        itemName={packingPrompt.itemName}
                        onConfirm={handleConfirmPackingPrompt}
                        onClose={() => setPackingPrompt(null)}
                    />
                </Suspense>
            )}

            {isScanningReceipt && activeTrip && (
                <Suspense fallback={<div/>}>
                    <ReceiptScanner
                        trip={activeTrip}
                        onClose={() => setIsScanningReceipt(false)}
                        onScanComplete={handleScanComplete}
                    />
                </Suspense>
            )}
        </>
    );
};

const App: React.FC = () => {
    // Login is temporarily disabled as per user request.
    // A fixed user ID is used to fetch data. This will be re-enabled for production.
    const user = 'default-user';

    // Original login logic is commented out below for easy restoration.
    /*
    const [user, setUser] = useState<string | null>(localStorage.getItem('vsc_user'));

    const handleLogin = (password: string) => {
        // Use the password as a key for mock data. In a real app, you'd authenticate.
        localStorage.setItem('vsc_user', password);
        setUser(password);
    };

    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }
    */

    return (
        <ThemeProvider>
            <NotificationProvider>
                <LocationProvider>
                    <DataProvider user={user}>
                        <CurrencyProvider>
                            <ItineraryProvider>
                                <AppContent />
                            </ItineraryProvider>
                        </CurrencyProvider>
                    </DataProvider>
                </LocationProvider>
                <NotificationContainer />
            </NotificationProvider>
        </ThemeProvider>
    );
};

export default App;