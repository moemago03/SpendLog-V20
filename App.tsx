import React, { useState, useMemo, lazy, Suspense, useCallback, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';
import { Trip, Expense, AppView } from './types';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ItineraryProvider } from './context/ItineraryContext';
import { LocationProvider } from './context/LocationContext';
import { getContrastColor, hexToRgba } from './utils/colorUtils';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

import LoginScreen from './components/LoginScreen';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './components/layout/MainLayout';
import NotificationContainer from './components/NotificationContainer';
import FloatingActionButtons from './components/layout/FloatingActionButtons';
import DebugMenu from './components/DebugMenu';
import PrivacyPolicy from './PrivacyPolicy';

// Eagerly load main components
import Dashboard from './components/Dashboard';
import ProfileScreen from './components/ProfileScreen';
import ItineraryView from './components/itinerary/ItineraryView';

// Lazy load other components
const ExpenseForm = lazy(() => import('./components/ExpenseForm'));
const AIPanel = lazy(() => import('./components/AIPanel'));
const ReceiptScanner = lazy(() => import('./components/ReceiptScanner'));
const PlanView = lazy(() => import('./components/plan/PlanView'));
const Statistics = lazy(() => import('./components/Statistics'));
const GroupView = lazy(() => import('./components/GroupBalances'));

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showingPrivacy, setShowingPrivacy] = useState(false);

    useEffect(() => {
        if (!auth) {
            setLoadingAuth(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = useCallback(async () => {
        await FirebaseAuthentication.signOut();
    }, []);

    if (loadingAuth) {
        return <LoadingScreen />;
    }

    if (showingPrivacy) {
        return <PrivacyPolicy onBack={() => setShowingPrivacy(false)} />;
    }

    return (
        <ThemeProvider>
            <NotificationProvider>
                <CurrencyProvider>
                    <LocationProvider>
                        {user ? (
                            <DataProvider user={user.uid}>
                                <ItineraryProvider>
                                    <AuthenticatedApp user={user} onLogout={handleLogout} />
                                </ItineraryProvider>
                            </DataProvider>
                        ) : (
                            <LoginScreen onShowPrivacy={() => setShowingPrivacy(true)} />
                        )}
                        <NotificationContainer />
                    </LocationProvider>
                </CurrencyProvider>
            </NotificationProvider>
        </ThemeProvider>
    );
};

// This new component is wrapped by DataProvider, so it can use the useData hook.
const AuthenticatedApp: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
    const { data, loading, firebaseStatus, setDefaultTrip } = useData();
    const [currentView, setCurrentView] = useState<AppView>('summary');
    
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const activeTripId = useMemo(() => {
        if (!data) return null;
        if (data.defaultTripId && data.trips.some(t => t.id === data.defaultTripId)) {
            return data.defaultTripId;
        }
        return data.trips[0]?.id || null;
    }, [data]);

    const activeTrip = useMemo(() => {
        return data?.trips.find(t => t.id === activeTripId) || null;
    }, [data?.trips, activeTripId]);

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

    useEffect(() => {
        if (!loading && (!data || data.trips.length === 0)) {
            setCurrentView('profile');
        }
    }, [data, loading]);

    const renderContent = () => {
        if (loading && !data) return <LoadingScreen />;

        if (!activeTrip && data && data.trips.length > 0) {
            return (
                <div className="p-4 text-center">
                    <h2 className="text-xl font-semibold">No active trip.</h2>
                    <p className="text-on-surface-variant">Select a trip from your profile to get started.</p>
                </div>
            );
        }
        
        const mainViews: { [key in AppView]?: React.ReactNode } = {
            'summary': activeTrip && <Dashboard activeTripId={activeTrip.id} setEditingExpense={setEditingExpense} onNavigate={setCurrentView} />,
            'itinerary': activeTrip && <ItineraryView trip={activeTrip} onAddExpense={setEditingExpense} />,
            'plan': activeTrip && <Suspense fallback={<LoadingScreen />}><PlanView trip={activeTrip} onNavigate={setCurrentView} /></Suspense>,
            'stats': activeTrip && <Suspense fallback={<LoadingScreen />}><Statistics trip={activeTrip} expenses={activeTrip.expenses || []} /></Suspense>,
            'group': activeTrip && <Suspense fallback={<LoadingScreen />}><GroupView trip={activeTrip} /></Suspense>,
            'profile': <ProfileScreen trips={data?.trips || []} activeTripId={activeTripId} onSetDefaultTrip={setDefaultTrip} onLogout={onLogout} />
        };
        
        if (!activeTrip && currentView !== 'profile') {
             return <ProfileScreen trips={[]} activeTripId={null} onSetDefaultTrip={setDefaultTrip} onLogout={onLogout} />;
        }

        return mainViews[currentView] || <div>View not found</div>;
    };

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

            <Suspense fallback={<div />}>
                {editingExpense && activeTrip && (
                    <ExpenseForm 
                        expense={editingExpense} 
                        trip={activeTrip}
                        onClose={() => setEditingExpense(null)}
                    />
                )}
                {isAIPanelOpen && activeTrip && (
                    <AIPanel 
                        trip={activeTrip} 
                        expenses={activeTrip.expenses || []} 
                        onClose={() => setIsAIPanelOpen(false)} 
                    />
                )}
                {isScannerOpen && (
                    <ReceiptScanner 
                        trip={activeTrip!}
                        onClose={() => setIsScannerOpen(false)}
                        onScanComplete={(expense) => setEditingExpense(expense)}
                    />
                )}
            </Suspense>

            <DebugMenu 
                user={user}
                dataContext={{ data, loading, firebaseStatus }}
                activeTripId={activeTripId}
            />
        </>
    );
};

export default App;