import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { CityGuide, CountryGuide, Trip } from '../../types';
import LoadingScreen from '../LoadingScreen';
import AttractionCard from './AttractionCard';

const AddToItineraryModal = lazy(() => import('./AddToItineraryModal'));

interface CityDetailModalProps {
    cityId: string;
    countryFileMap: { [countryCode: string]: string };
    activeTrip: Trip | null;
    onClose: () => void;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        role="tab"
        aria-selected={isActive}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}
    >
        {label}
    </button>
);

const CityDetailModal: React.FC<CityDetailModalProps> = ({ cityId, countryFileMap, activeTrip, onClose }) => {
    const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);
    const [countryGuide, setCountryGuide] = useState<CountryGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('info');
    
    const [isAddingToItinerary, setIsAddingToItinerary] = useState(false);
    const [selectedAttraction, setSelectedAttraction] = useState<any>(null);

    useEffect(() => {
        const fetchGuides = async () => {
            setLoading(true);
            setError(null);
            try {
                const cityResponse = await fetch(`/data/cities/${cityId}.json`);
                if (!cityResponse.ok) throw new Error(`Could not load guide for ${cityId}`);
                const cityData: CityGuide = await cityResponse.json();
                setCityGuide(cityData);

                const countryFile = countryFileMap[cityData.countryCode];
                if (countryFile) {
                    const countryResponse = await fetch(`/data/countries/${countryFile}.json`);
                    if (countryResponse.ok) {
                        const countryData: CountryGuide = await countryResponse.json();
                        setCountryGuide(countryData);
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGuides();
    }, [cityId, countryFileMap]);
    
    const handleAddAttraction = (attraction: any) => {
        setSelectedAttraction(attraction);
        setIsAddingToItinerary(true);
    };

    const tabs = useMemo(() => {
        if (!cityGuide) return [];
        const availableTabs = [{ id: 'info', label: 'Info' }];
        if (cityGuide.mainAttractions?.length > 0) availableTabs.push({ id: 'attractions', label: 'Attrazioni' });
        if (cityGuide.dayTrips?.length > 0) availableTabs.push({ id: 'daytrips', label: 'Gite' });
        if (cityGuide.suggestedItineraries?.length > 0) availableTabs.push({ id: 'itineraries', label: 'Itinerari' });
        return availableTabs;
    }, [cityGuide]);

    return (
        <>
            <div
                className="fixed inset-0 bg-surface z-50 flex flex-col animate-[slide-up_0.3s_ease-out]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="city-guide-title"
            >
                <header className="flex-shrink-0">
                    <div className="relative h-48">
                        {cityGuide?.image && (
                            <img src={cityGuide.image} alt={cityGuide.cityName} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                            <h1 id="city-guide-title" className="text-3xl font-bold">{cityGuide?.cityName}</h1>
                            <p className="text-white/80">{countryGuide?.countryName}</p>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors" aria-label="Chiudi guida">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-2 border-b border-surface-variant overflow-x-auto">
                        <div className="flex space-x-2">
                            {tabs.map(tab => <TabButton key={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />)}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-6">
                    {loading && <LoadingScreen />}
                    {error && <p className="text-center text-error">{error}</p>}
                    
                    {cityGuide && (
                        <>
                            <div hidden={activeTab !== 'info'} className="space-y-6 animate-fade-in">
                               <p className="text-on-surface-variant text-center p-4 bg-surface-variant/40 rounded-xl">{cityGuide.generalInfo.quickDescription}</p>
                               <div>
                                 <h3 className="font-semibold text-on-surface mb-2">Arrivare in città</h3>
                                 <div className="space-y-3">
                                   {cityGuide.arrivalInfo.options.map((opt, i) => <div key={i} className="p-3 bg-surface-variant/50 rounded-lg text-sm"><p className="font-bold">{opt.method}:</p><p>{opt.details}</p></div>)}
                                 </div>
                               </div>
                               <div>
                                 <h3 className="font-semibold text-on-surface mb-2">Consigli</h3>
                                 <ul className="list-disc list-inside text-on-surface-variant text-sm space-y-1">
                                    <li><span className="font-bold">Famiglie:</span> {cityGuide.travelerTips.families}</li>
                                    <li><span className="font-bold">Coppie:</span> {cityGuide.travelerTips.couples}</li>
                                 </ul>
                               </div>
                            </div>
                            <div hidden={activeTab !== 'attractions'} className="space-y-4 animate-fade-in">
                                {cityGuide.mainAttractions.map((attr, index) => <AttractionCard key={index} attraction={attr} onAdd={() => handleAddAttraction(attr)} canAdd={!!activeTrip} />)}
                            </div>
                            <div hidden={activeTab !== 'daytrips'} className="space-y-4 animate-fade-in">
                                {cityGuide.dayTrips.map((trip, index) => (
                                    <div key={index} className="p-4 bg-surface-variant/50 rounded-xl">
                                        <h4 className="font-bold text-on-surface">{trip.name}</h4>
                                        <p className="text-xs text-on-surface-variant mb-2">Tempo di viaggio: {trip.travelTime}</p>
                                        <p className="text-sm text-on-surface-variant">{trip.description}</p>
                                    </div>
                                ))}
                            </div>
                            <div hidden={activeTab !== 'itineraries'} className="space-y-6 animate-fade-in">
                               {cityGuide.suggestedItineraries.map((itinerary, index) => (
                                 <div key={index} className="p-4 bg-surface-variant/50 rounded-xl">
                                   <h4 className="font-bold text-on-surface text-lg mb-3">{itinerary.title}</h4>
                                   <div className="space-y-4">
                                     {itinerary.days.map(day => (
                                       <div key={day.day} className="pl-4 border-l-2 border-primary">
                                         <h5 className="font-semibold text-primary">Giorno {day.day}: {day.theme}</h5>
                                         <ul className="list-disc list-inside text-sm text-on-surface-variant mt-1">
                                           {day.activities.map((act, i) => <li key={i}>{act}</li>)}
                                         </ul>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
            {isAddingToItinerary && selectedAttraction && activeTrip && (
                <Suspense fallback={<div />}>
                    <AddToItineraryModal
                        trip={activeTrip}
                        attraction={selectedAttraction}
                        onClose={() => setIsAddingToItinerary(false)}
                    />
                </Suspense>
            )}
        </>
    );
};

export default CityDetailModal;