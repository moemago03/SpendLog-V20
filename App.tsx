import React, { useState, useEffect, useCallback, memo, lazy, Suspense } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ItineraryProvider } from './context/ItineraryContext';
import { LocationProvider } from './context/LocationContext';
import NotificationContainer from './components/NotificationContainer';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ProfileScreen from './components/ProfileScreen';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './components/layout/MainLayout';
import { Expense, Trip } from './types';

const ExpenseForm = lazy(() => import('./components/ExpenseForm'));
const FloatingActionButtons = lazy(() => import('./components/layout/FloatingActionButtons'));
const AIPanel = lazy(() => import('./components/AIPanel'));
const ExploreView = lazy(() => import('./components/explore/ExploreView'));
const ItineraryView = lazy(() => import('./components/itinerary/ItineraryView'));
const CurrencyConverterModal = lazy(() => import('./components/CurrencyConverter'));


export type AppView = 'explore' | 'summary' | 'stats' | 'itinerary' | 'group' | 'profile';

const viewIndices: { [key in AppView]: number } = {
    explore: 0,
    summary: 1,
    stats: 2,
    itinerary: 3,
    group: 4,
    profile: 5,
};

const AppContent: React.FC<{
    onLogout: () => void;
}> = memo(({ onLogout }) => {
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<AppView>('summary');
    const [animationClass, setAnimationClass] = useState('animate-view-transition');
    const { data, loading, setDefaultTrip } = useData();
    const [isInitialized, setIsInitialized] = useState(false); // State to track initial load
    
    // FIX: Changed state to hold Partial<Expense> to allow creating new expenses without an ID.
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
    const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
    const [isConverterModalOpen, setIsConverterModalOpen] = useState(false);

    const activeTrip = data?.trips.find(t => t.id === activeTripId) || null;

    const handleAddExpense = useCallback((prefill: Partial<Expense> = {}) => {
        const defaultExpense: Partial<Expense> = {
            currency: activeTrip?.mainCurrency,
            date: new Date().toISOString(),
        };
        const newExpenseData = { ...defaultExpense, ...prefill };
        // FIX: Removed unsafe cast, as editingExpense state now correctly handles Partial<Expense>.
        setEditingExpense(newExpenseData);
    }, [activeTrip]);


    const changeView = useCallback((newView: AppView, isSlide: boolean) => {
        setActiveView(currentActiveView => {
            if (newView === currentActiveView) {
                return currentActiveView;
            }

            if (isSlide) {
                const currentIndex = viewIndices[currentActiveView];
                const newIndex = viewIndices[newView];
                
                if (newIndex > currentIndex) {
                    setAnimationClass('animate-slide-in-right');
                } else { // newIndex < currentIndex
                    setAnimationClass('animate-slide-in-left');
                }
            } else {
                setAnimationClass('animate-view-transition');
            }
            return newView;
        });
    }, []);

    useEffect(() => {
        if (loading || !data || isInitialized) {
            return;
        }

        const defaultTripId = data.defaultTripId;
        if (defaultTripId && data.trips.some(t => t.id === defaultTripId)) {
            setActiveTripId(defaultTripId);
            changeView('summary', false);
        } else {
            setActiveTripId(null);
            changeView('profile', false);
        }

        setIsInitialized(true);
    }, [data, loading, isInitialized, changeView]);


    useEffect(() => {
        const styleElement = document.getElementById('dynamic-trip-theme');
        if (!styleElement) return;

        if (activeTrip && activeTrip.color) {
            const isColorLight = (hex: string) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                return yiq >= 128;
            };

            const primaryColor = activeTrip.color;
            const onPrimaryColor = isColorLight(primaryColor) ? '#001A40' : '#FFFFFF';

            styleElement.innerHTML = `
                :root {
                    --trip-primary: ${primaryColor};
                    --trip-on-primary: ${onPrimaryColor};
                }
            `;
        } else {
            styleElement.innerHTML = `
                :root {
                    --trip-primary: var(--color-primary);
                    --trip-on-primary: var(--color-on-primary);
                }
            `;
        }
    }, [activeTrip]);


    const handleSetDefaultTrip = useCallback((tripId: string) => {
        const newDefaultTripId = tripId === 'none' ? null : tripId;
        setDefaultTrip(newDefaultTripId);

        if (tripId === 'none') {
             setActiveTripId(null);
             changeView('profile', false);
        } else {
            setActiveTripId(tripId);
            changeView('summary', false); // Switch to summary for the new default trip
        }
    }, [setDefaultTrip, changeView]);
    
    const handleNavigation = useCallback((view: AppView) => {
        changeView(view, true);
    }, [changeView]);

    if (loading) {
        return <LoadingScreen />;
    }
    
    const renderMainContent = () => {
        if (activeView === 'profile') {
             return (
                <ProfileScreen 
                    trips={data.trips}
                    activeTripId={activeTripId}
                    onSetDefaultTrip={handleSetDefaultTrip}
                    onLogout={onLogout}
                />
            );
        }

        if (activeView === 'explore') {
            return (
                <Suspense fallback={<LoadingScreen />}>
                    <ExploreView activeTrip={activeTrip} />
                </Suspense>
            );
        }

        if (activeTrip && activeTripId) {
             if (activeView === 'itinerary') {
                return (
                    <Suspense fallback={<LoadingScreen />}>
                        <ItineraryView 
                            trip={activeTrip} 
                            onAddExpense={handleAddExpense}
                        />
                    </Suspense>
                );
            }
            return (
                <Dashboard 
                    key={activeTripId}
                    activeTripId={activeTripId}
                    currentView={activeView}
                    setEditingExpense={setEditingExpense}
                    onNavigate={handleNavigation}
                />
            );
        }

        return (
             <ProfileScreen 
                trips={data.trips}
                activeTripId={null}
                onSetDefaultTrip={handleSetDefaultTrip}
                onLogout={onLogout}
            />
        );
    };
    
    return (
        <>
            <MainLayout
                activeView={activeView}
                onNavigate={handleNavigation}
                isTripActive={!!activeTrip}
            >
                <div key={activeView + activeTripId} className={animationClass}>
                    {renderMainContent()}
                </div>
                {activeView === 'summary' && activeTrip && (
                    <Suspense fallback={null}>
                        <FloatingActionButtons
                            onAddExpense={() => handleAddExpense()}
                            onAIPanelOpen={() => setIsAIPanelOpen(true)}
                        />
                        {isAIPanelOpen && (
                            <AIPanel
                                trip={activeTrip}
                                expenses={activeTrip.expenses || []}
                                onClose={() => setIsAIPanelOpen(false)}
                            />
                        )}
                    </Suspense>
                )}
                
                {editingExpense && activeTrip && (
                    <Suspense fallback={null}>
                        <ExpenseForm
                            trip={activeTrip}
                            expense={editingExpense}
                            onClose={() => setEditingExpense(null)}
                        />
                    </Suspense>
                )}
            </MainLayout>
             <button
                onClick={() => setIsConverterModalOpen(true)}
                className="fixed bottom-20 right-4 h-12 w-12 bg-tertiary-container text-on-tertiary-container rounded-2xl shadow-lg flex items-center justify-center transition-transform active:scale-90 z-20 animate-fade-in"
                aria-label="Apri convertitore valuta"
             >
                <span className="material-symbols-outlined">currency_exchange</span>
             </button>
             {isConverterModalOpen && (
                <Suspense fallback={null}>
                    <CurrencyConverterModal
                        trip={activeTrip}
                        isOpen={isConverterModalOpen}
                        onClose={() => setIsConverterModalOpen(false)}
                    />
                </Suspense>
             )}
        </>
    );
});


const App: React.FC = () => {
    // Login temporarily disabled for faster verification by providing a default user.
    // The original line was: const [user, setUser] = useState<string | null>(localStorage.getItem('vsc_user'));
    const [user, setUser] = useState<string | null>('dev_user');

    const handleLogin = (password: string) => {
        localStorage.setItem('vsc_user', password);
        setUser(password);
    };
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('vsc_user');
        setUser(null);
    }, []);
    
    if (!user) {
        return <LoginScreen onLogin={handleLogin} />;
    }
    
    return (
        <ThemeProvider>
            <NotificationProvider>
                <LocationProvider>
                    <DataProvider user={user}>
                        <CurrencyProvider>
                            <ItineraryProvider>
                                <AppContent 
                                    onLogout={handleLogout} 
                                />
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
