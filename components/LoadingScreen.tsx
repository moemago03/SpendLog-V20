import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-on-background fixed inset-0 z-[100]">
            <style>{`
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
                    }
                    50% {
                        transform: translateY(-25%);
                        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
                    }
                }
                .animate-bounce-custom {
                    animation: bounce 1.2s infinite;
                }
            `}</style>
            <div className="text-center">
                <div className="flex justify-center items-center gap-4 mb-8">
                    <span
                        className="material-symbols-outlined text-primary text-5xl animate-bounce-custom"
                        style={{ animationDelay: '0s' }}
                    >
                        receipt_long
                    </span>
                    <span
                        className="material-symbols-outlined text-tertiary text-5xl animate-bounce-custom"
                        style={{ animationDelay: '0.2s' }}
                    >
                        bar_chart
                    </span>
                    <span
                        className="material-symbols-outlined text-secondary text-5xl animate-bounce-custom"
                        style={{ animationDelay: '0.4s' }}
                    >
                        travel
                    </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter mb-2">SpendiLog</h1>
                <p className="text-on-surface-variant">Stiamo preparando i tuoi viaggi...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;