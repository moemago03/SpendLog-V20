import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Trip, Stage, PlanItem } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';
import { fetchPoisForCity, Poi } from '../../services/poiService';
import ImageWithFallback from '../common/ImageWithFallback';

const PoiDetailView = lazy(() => import('./PoiDetailView'));


interface AddPlanItemViewProps {
    trip: Trip;
    stage: Stage;
    category: PlanItem['category'];
    onClose: () => void;
}

const AddPlanItemView: React.FC<AddPlanItemViewProps> = ({ trip, stage, category, onClose }) => {
    const { addPlanItem } = useData();
    const { addNotification } = useNotification();
    const [attractions, setAttractions] = useState<Poi[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

    const city = useMemo(() => stage.location.split(',')[0], [stage.location]);
    
    useEffect(() => {
        const fetchCityData = async () => {
            if (!city) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const pois = await fetchPoisForCity(city);
                setAttractions(pois);
            } catch (err) {
                console.error("Failed to load city data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCityData();
    }, [city]);

    const checkin = stage.startDate;
    const checkoutDate = new Date(stage.startDate + 'T12:00:00Z');
    checkoutDate.setDate(checkoutDate.getDate() + stage.nights);
    const checkout = checkoutDate.toISOString().split('T')[0];
    
    const tourProviders = [
        { name: 'Get Your Guide', logo: 'GYG', color: 'bg-[#007fad]', url: `https://www.getyourguide.com/search?q=${encodeURIComponent(city)}&date_from=${checkin}&date_to=${checkout}`},
        { name: 'Tourscanner', logo: 'Ts', color: 'bg-[#00b295]', url: `https://tourscanner.com/${encodeURIComponent(city)}?date_from=${checkin}&date_to=${checkout}`},
        { name: 'Viator', logo: 'V', color: 'bg-[#000000]', url: `https://www.viator.com/search/${encodeURIComponent(city)}` },
        { name: 'Tiqets', logo: 'T', color: 'bg-[#1b9fe3]', url: `https://www.tiqets.com/en/search?q=${encodeURIComponent(city)}`},
    ];

    const formatDateRange = () => {
        const start = new Date(stage.startDate + 'T12:00:00Z');
        const end = new Date(start);
        end.setDate(start.getDate() + stage.nights);
        return `${start.toLocaleDateString('it-IT', { day: 'numeric'})} - ${end.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;
    };

    if (selectedPoi) {
        return (
            <div className="fixed inset-0 bg-background z-[51] flex flex-col animate-fade-in">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center">Caricamento...</div>}>
                    <PoiDetailView 
                        poi={selectedPoi}
                        trip={trip}
                        stage={stage}
                        onBack={() => setSelectedPoi(null)}
                    />
                </Suspense>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background z-[51] flex flex-col animate-[slide-up_0.3s_ease-out]">
            <header className="p-4 flex items-center border-b border-surface-variant">
                <button onClick={onClose} className="p-2 -m-2 rounded-full"><span className="material-symbols-outlined">close</span></button>
                <h1 className="text-xl font-bold ml-4">Add {category.replace(' & ', ' &amp; ')}</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                    <input type="text" placeholder={`Enter name e.g. "Eiffel Tower"...`} className="w-full bg-surface-variant border-transparent rounded-full py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="text-center -mt-2">
                    <button className="text-primary font-semibold">or add a link</button>
                </div>

                <section>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xs font-bold uppercase text-on-surface-variant">TOP PICKS IN {city.toUpperCase()}</h2>
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg">Things to do</h3>
                             <button className="px-3 py-1 bg-surface-variant rounded-full text-sm font-semibold">Discover all</button>
                        </div>
                        {loading && <div className="h-64 flex items-center justify-center text-on-surface-variant">Loading suggestions...</div>}
                        {!loading && attractions.length > 0 && (
                             <div className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-2 no-scrollbar">
                                {attractions.map((attr, index) => (
                                    <button onClick={() => setSelectedPoi(attr)} key={index} className="relative w-48 h-64 rounded-2xl overflow-hidden flex-shrink-0 shadow-md group bg-surface-variant text-left">
                                        <ImageWithFallback 
                                            src={attr.imageUrl}
                                            alt={attr.name}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            containerClassName="w-full h-full"
                                            fallbackIcon="attractions"
                                            iconClassName="text-4xl text-on-surface-variant/50"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 p-3 text-white">
                                            <p className="font-bold">{attr.name}</p>
                                        </div>
                                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100">
                                            <span className="material-symbols-outlined text-lg">info</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                         {!loading && attractions.length === 0 && (
                            <div className="h-40 flex items-center justify-center text-on-surface-variant text-sm bg-surface-variant/50 rounded-2xl">Nessun suggerimento disponibile per questa città.</div>
                         )}
                    </div>
                </section>
                
                <section>
                    <h3 className="font-bold text-lg mb-2">Discover tours &amp; tickets</h3>
                    <div className="space-y-2">
                        {tourProviders.map(p => (
                            <a href={p.url} target="_blank" rel="noopener noreferrer" key={p.name} className="flex items-center p-3 hover:bg-surface-variant rounded-xl">
                                <div className={`w-8 h-8 rounded-md ${p.color} flex-shrink-0 flex items-center justify-center font-bold text-white`}>{p.logo}</div>
                                <div className="ml-3 flex-grow">
                                    <p className="font-semibold text-on-surface">Find tours on {p.name}</p>
                                    <p className="text-sm text-on-surface-variant">{city}, {formatDateRange()}</p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant text-lg">arrow_forward_ios</span>
                            </a>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AddPlanItemView;