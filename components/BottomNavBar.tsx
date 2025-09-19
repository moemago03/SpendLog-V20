import React from 'react';
import { AppView } from '../App';

interface BottomNavBarProps {
    activeView: AppView;
    onNavigate: (view: AppView) => void;
    isTripActive: boolean;
}

const triggerHapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(10);
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onNavigate, isTripActive }) => {
    const navItems = [
        { id: 'explore', label: 'Esplora', icon: 'explore', requiresTrip: true },
        { id: 'summary', label: 'Home', icon: 'home', requiresTrip: true },
        { id: 'stats', label: 'Analisi', icon: 'bar_chart', requiresTrip: true },
        { id: 'checklist', label: 'Checklist', icon: 'checklist', requiresTrip: true },
        { id: 'group', label: 'Gruppo', icon: 'group', requiresTrip: true },
        { id: 'currency', label: 'Valute', icon: 'currency_exchange', requiresTrip: true },
        { id: 'profile', label: 'Profilo', icon: 'person', requiresTrip: false },
    ];

    const handleNavigate = (view: AppView) => {
        triggerHapticFeedback();
        onNavigate(view);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-14 bg-surface/95 backdrop-blur-lg border-t border-outline/20 z-30">
            <div className="flex h-full w-full">
                {navItems.map((item) => {
                    const isActive = activeView === item.id;
                    const isDisabled = item.requiresTrip && !isTripActive;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id as AppView)}
                            disabled={isDisabled}
                            className={`relative flex h-full flex-1 flex-col items-center justify-center transition-transform duration-150 ease-out active:scale-95 focus:outline-none focus-visible:bg-on-surface/10 ${
                                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span
                                className={`material-symbols-outlined text-xl transition-colors ${
                                    isActive ? 'text-trip-primary' : 'text-on-surface-variant'
                                }`}
                                style={{
                                    fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' ${isActive ? 500 : 300}`,
                                }}
                            >
                                {item.icon}
                            </span>
                            <span
                                className={`text-[11px] transition-colors ${
                                    isActive
                                        ? 'font-semibold text-trip-primary'
                                        : 'text-on-surface-variant'
                                }`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default React.memo(BottomNavBar);