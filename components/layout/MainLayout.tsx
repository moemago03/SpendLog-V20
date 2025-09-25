import React, { ReactNode } from 'react';
import BottomNavBar from '../BottomNavBar';
import { AppView } from '../../App';

interface MainLayoutProps {
    children: ReactNode;
    activeView: AppView;
    onNavigate: (view: AppView) => void;
    isTripActive: boolean;
    hideNavBar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activeView, onNavigate, isTripActive, hideNavBar }) => {
    return (
        <div className="min-h-screen bg-background text-on-background font-sans">
            <main className="pb-20 overflow-x-hidden">
                {children}
            </main>
            {!hideNavBar && (
                <BottomNavBar
                    activeView={activeView}
                    onNavigate={onNavigate}
                    isTripActive={isTripActive}
                />
            )}
        </div>
    );
};

export default MainLayout;