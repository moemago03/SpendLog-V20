import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { Poi } from '../../services/poiService';
import { PoiDetail, fetchPoiDetails } from '../../services/wikiService';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import ImageWithFallback from '../common/ImageWithFallback';

const MapView = lazy(() => import('../MapView'));

interface PoiDetailViewProps {
    poi: Poi;
    trip: Trip;
    stage: Stage;
    onBack: () => void;
}

const PoiDetailView: React.FC<PoiDetailViewProps> = ({ poi, trip, stage, onBack }) => {
    const [details, setDetails] = useState<PoiDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const { addPlanItem } = useData();
    const { addNotification } = useNotification();

    useEffect(() => {
        const loadDetails = async () => {
            setLoading(true);
            const poiDetails = await fetchPoiDetails(poi);
            setDetails(poiDetails);
            setLoading(false);
        };
        loadDetails();
    }, [poi]);
    
    const handleAddToPlan = () => {
        const newItem: Omit<PlanItem, 'id'> = {
            category: 'See & Do',
            title: poi.name,
            description: details?.extract?.substring(0, 100) + '...' || 'Attrazione locale',
            link: details?.pageUrl,
            imageUrl: details?.imageUrl,
            status: 'idea',
        };
        addPlanItem(trip.id, stage.id, newItem);
        addNotification(`${poi.name} aggiunto al piano!`, 'success');
        onBack();
    };

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 flex items-center border-b border-surface-variant flex-shrink-0">
                <button onClick={onBack} className="p-2 -m-2 rounded-full"><span className="material-symbols-outlined">arrow_back</span></button>
                <h1 className="text-xl font-bold ml-4 truncate">{poi.name}</h1>
            </header>

            <main className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center p-8">Caricamento dettagli...</div>
                ) : (
                    <>
                        <div className="w-full h-64 bg-surface-variant">
                            <ImageWithFallback
                                src={details?.imageUrl}
                                alt={poi.name}
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                                fallbackIcon="attractions"
                                iconClassName="text-5xl text-on-surface-variant/50"
                            />
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-on-surface-variant leading-relaxed">
                                {details?.extract || "Nessuna descrizione disponibile."}
                            </p>
                            {details?.pageUrl && (
                                <a href={details.pageUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold text-sm">
                                    Leggi di più su Wikipedia
                                </a>
                            )}
                            <div className="h-64 rounded-2xl overflow-hidden">
                                <Suspense fallback={<div className="w-full h-full bg-surface-variant animate-pulse" />}>
                                    <MapView location={poi.name} />
                                </Suspense>
                            </div>
                        </div>
                    </>
                )}
            </main>

             <footer className="p-4 bg-surface/80 backdrop-blur-sm border-t border-surface-variant">
                <button onClick={handleAddToPlan} className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md">
                    Aggiungi al Piano
                </button>
            </footer>
        </div>
    );
};

export default PoiDetailView;