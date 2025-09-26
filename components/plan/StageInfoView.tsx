import React, { useState, useEffect, useMemo } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { fetchPoisForCity, Poi } from '../../services/poiService';
import { fetchCityInfo, WikiInfo } from '../../services/wikiService';
import ImageWithFallback from '../common/ImageWithFallback';

interface StageInfoViewProps {
    trip: Trip;
    stage: Stage;
    onPoiClick: (poi: Poi) => void;
}

const StageInfoView: React.FC<StageInfoViewProps> = ({ trip, stage, onPoiClick }) => {
    const { addPlanItem } = useData();
    const { addNotification } = useNotification();
    
    const [wikiInfo, setWikiInfo] = useState<WikiInfo | null>(null);
    const [attractions, setAttractions] = useState<Poi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const city = useMemo(() => stage.location.split(',')[0], [stage.location]);
    
    useEffect(() => {
        const fetchAllInfo = async () => {
            if (!city) {
                setLoading(false);
                setError("Nome della città non valido.");
                return;
            }
            setLoading(true);
            setError(null);
            
            try {
                const [info, pois] = await Promise.all([
                    fetchCityInfo(city),
                    fetchPoisForCity(city)
                ]);

                setWikiInfo(info);
                setAttractions(pois);

                if (!info && pois.length === 0) {
                     setError(`Non sono state trovate informazioni per ${city}.`);
                }

            } catch (err) {
                console.error("Failed to load stage info:", err);
                setError("Impossibile caricare le informazioni per questa destinazione.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllInfo();
    }, [city]);

    if (loading) {
        return <div className="text-center p-8">Caricamento guida...</div>;
    }
    
    if (error) {
        return <div className="text-center p-8 text-error">{error}</div>;
    }

    if (!wikiInfo && attractions.length === 0) {
        return <div className="text-center p-8 text-on-surface-variant">Informazioni non disponibili.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {wikiInfo?.extract && (
                <p className="text-on-surface-variant p-4 bg-surface-variant/40 rounded-xl">{wikiInfo.extract}</p>
            )}
            
            {attractions.length > 0 && (
                <section>
                    <h3 className="font-bold text-lg text-on-surface mb-3">Attrazioni Principali</h3>
                    <div className="space-y-2">
                        {attractions.map((attr) => (
                            <button 
                                key={attr.id}
                                onClick={() => onPoiClick(attr)}
                                className="w-full flex items-center gap-3 p-3 bg-surface-variant/50 rounded-2xl text-left hover:bg-surface-variant transition-colors"
                            >
                                <div className="w-16 h-16 bg-primary-container rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    <ImageWithFallback
                                        src={attr.imageUrl}
                                        alt={attr.name}
                                        className="w-full h-full object-cover"
                                        containerClassName="w-full h-full"
                                        fallbackIcon="attractions"
                                        iconClassName="text-on-primary-container"
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-semibold text-on-surface truncate">{attr.name}</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default StageInfoView;