import React, { ReactNode } from 'react';
import BottomNavBar from '../BottomNavBar';
// FIX: Corrected the import path for AppView from `../../App` to `../../types`.
import { AppView } from '../../types';

interface MainLayoutProps {
    children: ReactNode;
    activeView: AppView;
    onNavigate: (view: AppView) => void;
    isTripActive: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activeView, onNavigate, isTripActive }) => {
    return (
        <div className="min-h-screen bg-background text-on-background font-sans">
            <main className="pb-20 overflow-x-hidden">
                {children}
            </main>
            <BottomNavBar
                activeView={activeView}
                onNavigate={onNavigate}
                isTripActive={isTripActive}
            />
        </div>
    );
};

export default MainLayout;