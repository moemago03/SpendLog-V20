import React, { useState, useMemo, lazy, Suspense, useCallback, useEffect } from 'react';
import { Trip, Expense, AppView } from './types';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ItineraryProvider } from './context/ItineraryContext';
import { LocationProvider } from './context/LocationContext';
import { getContrastColor, hexToRgba } from './utils/colorUtils';

import LoginScreen from './components/LoginScreen';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './components/layout/MainLayout';
import NotificationContainer from './components/NotificationContainer';
import FloatingActionButtons from './components/layout/FloatingActionButtons';

// Eagerly load main components for faster navigation
import Dashboard from './components/Dashboard';
import ProfileScreen from './components/ProfileScreen';
import ItineraryView from './components/itinerary/ItineraryView';
import ExploreView from './components/explore/ExploreView';

// Lazy load components that are not opened immediately
const ExpenseForm = lazy(() => import('./components/ExpenseForm'));
const AIPanel = lazy(() => import('./components/AIPanel'));
const PackingPromptModal = lazy(() => import('./components/prompts/PackingPromptModal'));
const ReceiptScanner = lazy(() => import('./components/ReceiptScanner'));
const PlanView = lazy(() => import('./components/plan/PlanView'));

const App: React.FC = () => {
    const [user, setUser] = useState<string | null>(localStorage.getItem('vsc_user'));

    const handleLogin = useCallback((password: string) => {
        const userId = `user-${password}`;
        localStorage.setItem('vsc_user', userId);
        setUser(userId);
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('vsc_user');
        setUser(null);
    }, []);

    return (
        <ThemeProvider>
            <NotificationProvider>
                <CurrencyProvider>
                    <LocationProvider>
                        {user ? (
                            <DataProvider user={user}>
                                <ItineraryProvider>
                                    <AppContent onLogout={handleLogout} />
                                </ItineraryProvider>
                            </DataProvider>
                        ) : (
                            <LoginScreen onLogin={handleLogin} />
                        )}
                        <NotificationContainer />
                    </LocationProvider>
                </CurrencyProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
};

// FIX: Destructure 'onLogout' from props to make it available within the component scope.
const AppContent: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { data, loading, setDefaultTrip, addChecklistItem } = useData();
    const [currentView, setCurrentView] = useState<AppView>('summary');
    
    // State for modals
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> & { checklistItemId?: string } | null>(null);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [packingPrompt, setPackingPrompt] = useState<{ tripId: string, itemName: string } | null>(null);

    const activeTripId = useMemo(() => {
        if (!data) return null;
        if (data.defaultTripId && data.trips.some(t => t.id === data.defaultTripId)) {
            return data.defaultTripId;
        }
        if (data.trips.length > 0) {
            const sortedTrips = [...data.trips].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            return sortedTrips[0].id;
        }
        return null;
    }, [data]);

    const activeTrip = useMemo(() => {
        return data?.trips.find(t => t.id === activeTripId) || null;
    }, [data?.trips, activeTripId]);

    // Apply dynamic trip theme
    useEffect(() => {
        const themeStyle = document.getElementById('dynamic-trip-theme');
        if (themeStyle) {
            if (activeTrip?.color) {
                const primary = activeTrip.color;
                const onPrimary = getContrastColor(primary);
                const primaryContainer = hexToRgba(primary, 0.2);
                themeStyle.innerHTML = `
                    :root {
                        --trip-primary: ${primary};
                        --trip-on-primary: ${onPrimary};
                        --trip-primary-container: ${primaryContainer};
                    }
                `;
            } else {
                themeStyle.innerHTML = '';
            }
        }
    }, [activeTrip?.color]);
    
    // Redirect to the profile view if there are no trips.
    // This handles the initial load and the case where the last trip is deleted,
    // ensuring the user always starts on a valid screen.
    useEffect(() => {
        if (!loading && (!data || data.trips.length === 0)) {
            setCurrentView('profile');
        }
    }, [data, loading]);

    const handleSetDefaultTrip = useCallback((tripId: string) => {
        setDefaultTrip(tripId);
    }, [setDefaultTrip]);
    
    const handleShowPackingPrompt = (tripId: string, itemName: string) => {
        setPackingPrompt({ tripId, itemName });
    };

    const handleConfirmPackingPrompt = () => {
        if (packingPrompt) {
            addChecklistItem(packingPrompt.tripId, packingPrompt.itemName, false);
            setPackingPrompt(null);
        }
    };
    
    const handleScanComplete = (scannedExpense: Partial<Expense>) => {
        setEditingExpense(scannedExpense);
        setIsScannerOpen(false);
    };

    const renderContent = () => {
        if (!activeTrip && data && data.trips.length > 0) {
            return (
                <div className="p-4 text-center">
                    <h2 className="text-xl font-semibold">Nessun viaggio attivo.</h2>
                    <p className="text-on-surface-variant">Seleziona un viaggio dal tuo profilo per iniziare.</p>
                </div>
            );
        }
        
        const mainViews: { [key in AppView]?: React.ReactNode } = {
            'summary': activeTrip && <Dashboard activeTripId={activeTrip.id} currentView={currentView} setEditingExpense={setEditingExpense} onNavigate={setCurrentView} />,
            'stats': activeTrip && <Dashboard activeTripId={activeTrip.id} currentView={currentView} setEditingExpense={setEditingExpense} onNavigate={setCurrentView} />,
            'group': activeTrip && <Dashboard activeTripId={activeTrip.id} currentView={currentView} setEditingExpense={setEditingExpense} onNavigate={setCurrentView} />,
            'itinerary': activeTrip && <ItineraryView trip={activeTrip} onAddExpense={setEditingExpense} />,
            'plan': activeTrip && <Suspense fallback={<LoadingScreen />}><PlanView trip={activeTrip} onNavigate={setCurrentView} /></Suspense>,
            'profile': <ProfileScreen trips={data?.trips || []} activeTripId={activeTripId} onSetDefaultTrip={handleSetDefaultTrip} onLogout={onLogout} />
        };
        
        // Handle no trips case
        if (!activeTrip && currentView !== 'profile') {
             return (
                 <div className="pt-20">
                    <ProfileScreen trips={[]} activeTripId={null} onSetDefaultTrip={handleSetDefaultTrip} onLogout={onLogout} />
                 </div>
            );
        }

        return mainViews[currentView] || <div>Vista non trovata</div>;
    };

    if (loading) {
        return <LoadingScreen />;
    }
    
    return (
        <>
            <MainLayout activeView={currentView} onNavigate={setCurrentView} isTripActive={!!activeTrip}>
                {renderContent()}
            </MainLayout>
            
            {activeTrip && currentView !== 'profile' && (
                <FloatingActionButtons 
                    onAddExpense={() => setEditingExpense({})}
                    onAIPanelOpen={() => setIsAIPanelOpen(true)}
                    onScanReceipt={() => setIsScannerOpen(true)}
                />
            )}

            {/* Modals */}
            <Suspense fallback={<div />}>
                {editingExpense && activeTrip && (
                    <ExpenseForm 
                        expense={editingExpense} 
                        trip={activeTrip}
                        onClose={() => setEditingExpense(null)}
                        onShowPackingPrompt={handleShowPackingPrompt}
                    />
                )}
                {isAIPanelOpen && activeTrip && (
                    <AIPanel 
                        trip={activeTrip} 
                        expenses={activeTrip.expenses || []} 
                        onClose={() => setIsAIPanelOpen(false)} 
                    />
                )}
                {isScannerOpen && activeTrip && (
                    <ReceiptScanner 
                        trip={activeTrip}
                        onClose={() => setIsScannerOpen(false)}
                        onScanComplete={handleScanComplete}
                    />
                )}
                 {packingPrompt && (
                    <PackingPromptModal 
                        itemName={packingPrompt.itemName}
                        onConfirm={handleConfirmPackingPrompt}
                        onClose={() => setPackingPrompt(null)}
                    />
                )}
            </Suspense>
        </>
    );
};

export default App;