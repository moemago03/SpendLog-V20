import React, { useState, useEffect } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { fetchGuidesForCity, Guide } from '../../services/guideService';

interface FindGuidesViewProps {
    trip: Trip;
    stage: Stage;
    onClose: () => void;
}

const FindGuidesView: React.FC<FindGuidesViewProps> = ({ trip, stage, onClose }) => {
    const { addPlanItem } = useData();
    const { addNotification } = useNotification();
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);

    const city = stage.location.split(',')[0];

    useEffect(() => {
        const loadGuides = async () => {
            setLoading(true);
            const fetchedGuides = await fetchGuidesForCity(city);
            setGuides(fetchedGuides);
            setLoading(false);
        };
        loadGuides();
    }, [city]);

    const handleAddGuide = (guide: Guide) => {
        const newItem: Omit<PlanItem, 'id'> = {
            category: 'Articles & Guides',
            title: guide.title,
            description: guide.description,
            link: guide.url,
            status: 'idea',
        };
        addPlanItem(trip.id, stage.id, newItem);
        addNotification(`"${guide.title}" aggiunto al piano!`, 'success');
    };

    return (
        <div className="fixed inset-0 bg-background z-[51] flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="p-4 flex items-center border-b border-surface-variant">
                <button onClick={onClose} className="p-2 -m-2 rounded-full"><span className="material-symbols-outlined">close</span></button>
                <h1 className="text-xl font-bold ml-4">Trova Guide e Articoli</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center p-8 text-on-surface-variant">Ricerca su Wikivoyage...</div>
                ) : guides.length > 0 ? (
                    <ul className="space-y-3">
                        {guides.map(guide => (
                            <li key={guide.url}>
                                <div className="p-4 bg-surface-variant/50 rounded-2xl">
                                    <h3 className="font-bold text-on-surface">{guide.title}</h3>
                                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{guide.description}</p>
                                    <div className="mt-3 flex justify-end gap-3">
                                        <a href={guide.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-primary font-semibold rounded-full hover:bg-primary-container/30">
                                            Leggi
                                        </a>
                                        <button onClick={() => handleAddGuide(guide)} className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-full">
                                            Aggiungi
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-16 px-6">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">menu_book</span>
                        <p className="font-semibold text-on-surface-variant">Nessuna guida trovata per {city}.</p>
                        <p className="text-sm text-on-surface-variant/80 mt-1">Non ci sono risultati su Wikivoyage per questa destinazione.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FindGuidesView;
