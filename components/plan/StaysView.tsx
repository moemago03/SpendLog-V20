import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Trip, Stage } from '../../types';

const FindStayModal = lazy(() => import('./FindStayModal'));

interface StaysViewProps {
    trip: Trip;
}

const StaysView: React.FC<StaysViewProps> = ({ trip }) => {
    const [modalStage, setModalStage] = useState<Stage | null>(null);

    const stages = useMemo(() => trip.stages || [], [trip.stages]);

    const getStageEndDate = (stage: Stage): Date => {
        const startDate = new Date(stage.startDate + 'T12:00:00Z');
        startDate.setDate(startDate.getDate() + stage.nights);
        return startDate;
    };
    
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    const formatStayDateRange = (stage: Stage) => {
        const startDate = new Date(stage.startDate + 'T12:00:00Z');
        const endDate = getStageEndDate(stage);
        
        const startStr = `${formatDate(startDate)}`;
        const endStr = `${formatDate(endDate)}`;

        return `${startStr} - ${endStr}`;
    }


    return (
        <>
            <div className="p-4 pb-28 space-y-6 animate-fade-in">
                <header className="pt-8 pb-4">
                    <h1 className="text-4xl font-bold text-on-background">Stays to book</h1>
                </header>
                
                <div className="w-full bg-surface-variant rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                
                <ul className="space-y-3">
                    {stages.map(stage => {
                        const dateRangeString = formatStayDateRange(stage);

                        return (
                            <li key={stage.id} className="flex items-center gap-4 bg-surface p-3 rounded-2xl shadow-sm">
                                <div className="w-6 h-6 rounded-full border-2 border-outline flex-shrink-0"></div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-on-surface">Book a stay in {stage.location.split(',')[0]}</p>
                                    <p className="text-sm text-on-surface-variant">{dateRangeString}</p>
                                </div>
                                <button
                                    onClick={() => setModalStage(stage)}
                                    className="px-5 py-2 bg-green-500 text-white font-semibold rounded-full text-sm"
                                >
                                    Search
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            
            {modalStage && (
                <Suspense fallback={<div />}>
                    <FindStayModal
                        stage={modalStage}
                        onClose={() => setModalStage(null)}
                    />
                </Suspense>
            )}
        </>
    );
};
export default StaysView;
