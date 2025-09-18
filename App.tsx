import React, { useState, useEffect, useCallback, memo } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/NotificationContainer';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ProfileScreen from './components/ProfileScreen';
import LoadingScreen from './components/LoadingScreen';
import MainLayout from './components/layout/MainLayout';

export type AppView = 'summary' | 'stats' | 'checklist' | 'group' | 'currency' | 'profile';

const viewIndices: { [key in AppView]: number } = {
    summary: 0,
    stats: 1,
    checklist: 2,
    group: 3,
    currency: 4,
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
        // This effect runs only once, after the initial data load, to set the
        // default trip and view. It uses the `isInitialized` flag to prevent
        // re-running when data changes later (e.g., adding an expense).
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

        // Mark initialization as complete to prevent this from running again.
        setIsInitialized(true);
    }, [data, loading, isInitialized, changeView]);

    const activeTrip = data?.trips.find(t => t.id === activeTripId) || null;

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
            // Reset to default theme colors when no trip is active or trip has no color
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

        // FIX: Removed redundant `activeView !== 'profile'` check. The preceding `if` statement
        // already handles the 'profile' case, so TypeScript correctly narrows the type of
        // `activeView` at this point, making the check unnecessary and causing a type error.
        if (activeTrip && activeTripId) {
             return (
                <Dashboard 
                    key={activeTripId}
                    activeTripId={activeTripId}
                    currentView={activeView}
                />
            );
        }

        // Fallback: If no active trip, but view is not profile, redirect to profile
        // This can happen if the default trip is deleted.
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
        <MainLayout
            activeView={activeView}
            onNavigate={handleNavigation}
            isTripActive={!!activeTrip}
        >
            <div key={activeView + activeTripId} className={animationClass}>
                {renderMainContent()}
            </div>
        </MainLayout>
    );
});


const App: React.FC = () => {
    const [user, setUser] = useState<string | null>(localStorage.getItem('vsc_user'));

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
                <DataProvider user={user}>
                    <CurrencyProvider>
                        <AppContent 
                            onLogout={handleLogout} 
                        />
                    </CurrencyProvider>
                </DataProvider>
                <NotificationContainer />
            </NotificationProvider>
        </ThemeProvider>
    );
};

export default App;
