import React, { useState, useEffect, lazy, Suspense } from 'react';
import { CityGuide, CountryGuide, Trip } from '../../types';
import LoadingScreen from '../LoadingScreen';
import { useItinerary } from '../../context/ItineraryContext';

const AddToItineraryModal = lazy(() => import('./AddToItineraryModal'));
const MapView = lazy(() => import('../MapView'));

interface ExploreDetailViewProps {
    cityId: string;
    countryFileMap: { [key: string]: string };
    activeTrip: Trip | null;
    onClose: () => void;
}

// --- Reusable UI Components for the Redesign ---

const TabButton: React.FC<{
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        role="tab"
        aria-selected={isActive}
        className={`flex-1 flex items-center justify-center gap-2 p-4 border-b-2 text-sm font-semibold transition-colors ${
            isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:bg-surface-variant/50'
        }`}
    >
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
    </button>
);

const Section: React.FC<{ icon: string; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className = '' }) => (
    <section className={`py-6 ${className}`}>
        <h3 className="flex items-center gap-3 text-2xl font-bold text-on-surface mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
            {title}
        </h3>
        {children}
    </section>
);

const StatCard: React.FC<{ icon: string; title: string; value: string; }> = ({ icon, title, value }) => (
    <div className="bg-surface-variant/60 rounded-2xl p-4 flex items-center gap-4">
        <div className="bg-primary-container text-on-primary-container rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
            <p className="text-sm font-medium text-on-surface-variant">{title}</p>
            <p className="text-lg font-bold text-on-surface">{value}</p>
        </div>
    </div>
);

const AttractionCard: React.FC<{
    name: string;
    description: string;
    costOrPrice: string;
    typeOrRange: string;
    icon: string;
    location?: string;
    onAddToItinerary?: () => void;
}> = ({ name, description, costOrPrice, typeOrRange, icon, location, onAddToItinerary }) => {
    const [isMapVisible, setIsMapVisible] = useState(false);
    return (
        <div className="bg-surface-variant/60 rounded-2xl p-4 flex flex-col h-full shadow-sm">
            <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex-shrink-0 bg-surface rounded-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-semibold text-on-surface truncate" title={name}>{name}</h4>
                        <p className="text-xs text-on-surface-variant">{typeOrRange}</p>
                    </div>
                </div>
                 <div className="flex-shrink-0 flex items-center gap-1">
                     <span className="text-xs font-bold bg-primary-container text-on-primary-container px-2.5 py-1 rounded-full">{costOrPrice}</span>
                     {location && (
                        <button onClick={(e) => { e.stopPropagation(); setIsMapVisible(!isMapVisible); }} className="p-2 rounded-full text-on-surface-variant hover:bg-primary-container/50 hover:text-on-primary-container transition-colors" aria-label="Mostra mappa">
                            <span className="material-symbols-outlined text-base">{isMapVisible ? 'map' : 'map'}</span>
                        </button>
                     )}
                     {onAddToItinerary && (
                        <button onClick={onAddToItinerary} className="p-2 rounded-full text-on-surface-variant hover:bg-primary-container/50 hover:text-on-primary-container transition-colors" aria-label="Aggiungi all'itinerario">
                            <span className="material-symbols-outlined text-base">calendar_add_on</span>
                        </button>
                     )}
                </div>
            </div>
            <p className="text-sm text-on-surface-variant mt-3 flex-grow">{description}</p>
            {isMapVisible && location && (
                <div className="mt-4">
                    <Suspense fallback={<div className="h-40 bg-surface-variant rounded-xl animate-pulse" />}>
                        <MapView location={location} />
                    </Suspense>
                </div>
            )}
        </div>
    );
};

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
    <details className="bg-surface-variant/60 rounded-xl group" open={defaultOpen}>
        <summary className="font-semibold text-on-surface p-4 cursor-pointer list-none flex justify-between items-center">
            {title}
            <span className="material-symbols-outlined transition-transform duration-300 transform group-open:rotate-180">expand_more</span>
        </summary>
        <div className="px-4 pb-4 border-t border-outline/20 text-sm text-on-surface-variant leading-relaxed">
            {children}
        </div>
    </details>
);

// --- Helper Functions for Icon Mapping ---

const getTransportIcon = (method: string) => {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('rail') || lowerMethod.includes('train') || lowerMethod.includes('bts') || lowerMethod.includes('mrt')) return 'directions_transit';
    if (lowerMethod.includes('taxi')) return 'local_taxi';
    if (lowerMethod.includes('tuk-tuk')) return 'two_wheeler';
    if (lowerMethod.includes('boat') || lowerMethod.includes('barche')) return 'directions_boat';
    return 'commute';
};

const getAttractionIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('tempio')) return 'temple_buddhist';
    if (lowerType.includes('mercato')) return 'storefront';
    return 'local_see';
};

// --- Main Component ---

const ExploreDetailView: React.FC<ExploreDetailViewProps> = ({ cityId, countryFileMap, activeTrip, onClose }) => {
    const [cityData, setCityData] = useState<CityGuide | null>(null);
    const [countryData, setCountryData] = useState<CountryGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    
    // State for "Add to Itinerary" modal
    const [itineraryModalOpen, setItineraryModalOpen] = useState(false);
    const [selectedAttraction, setSelectedAttraction] = useState<{name: string, description: string, location?: string} | null>(null);


    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const cityResponse = await fetch(`/data/cities/${cityId}.json`);
                if (!cityResponse.ok) throw new Error(`Could not find guide for ${cityId}.`);
                const city: CityGuide = await cityResponse.json();
                setCityData(city);

                const countryFilename = countryFileMap[city.countryCode];
                if (!countryFilename) throw new Error(`Country mapping not found for ${city.countryCode}.`);

                const countryResponse = await fetch(`/data/countries/${countryFilename}.json`);
                if (!countryResponse.ok) throw new Error(`Could not find country info for ${countryFilename}.`);
                const country: CountryGuide = await countryResponse.json();
                setCountryData(country);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [cityId, countryFileMap]);
    
    const handleOpenItineraryModal = (attraction: {name: string, description: string, location?: string}) => {
        setSelectedAttraction(attraction);
        setItineraryModalOpen(true);
    }

    if (loading) {
        return <LoadingScreen />;
    }

    if (error || !cityData || !countryData) {
        return (
             <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
                <p className="text-error mb-4">{error || 'An unknown error occurred.'}</p>
                <button onClick={onClose} className="px-4 py-2 bg-primary text-on-primary rounded-lg">Close</button>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Panoramica', icon: 'visibility' },
        { id: 'attractions', label: 'Cosa Vedere', icon: 'attractions' },
        { id: 'itinerary', label: 'Itinerari', icon: 'map' },
        { id: 'country', label: 'Info Paese', icon: 'flag' },
    ];
    
    return (
        <>
            <div 
                className="fixed inset-0 bg-background z-50 animate-[slide-up_0.4s_cubic-bezier(0.25,1,0.5,1)]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="city-detail-title"
            >
                <div className="h-full w-full overflow-y-auto">
                    <header className="relative h-72 w-full flex-shrink-0">
                        <img src={cityData.image} alt={cityData.cityName} className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10"></div>
                        <div className="absolute bottom-0 left-0 p-6">
                            <h1 id="city-detail-title" className="text-white text-5xl font-extrabold tracking-tight">{cityData.cityName}</h1>
                            <p className="text-white/80 text-lg mt-1 max-w-xl">{cityData.generalInfo.quickDescription}</p>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors" aria-label="Chiudi">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </header>
                    
                    <nav className="sticky top-0 bg-surface/80 backdrop-blur-lg z-10 flex border-b border-surface-variant">
                        {tabs.map(tab => (
                            <TabButton key={tab.id} {...tab} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
                        ))}
                    </nav>

                    <main className="p-4 sm:p-6 max-w-4xl mx-auto">
                        {activeTab === 'overview' && (
                            <div className="space-y-4 divide-y divide-surface-variant">
                                <Section icon="info" title="Informazioni Chiave">
                                    <p className="text-sm text-on-surface-variant mb-4 -mt-2">{cityData.estimatedBudget.description}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        <StatCard icon="calendar_month" title="Periodo Migliore" value={cityData.generalInfo.bestTimeToVisit.split('.')[0]} />
                                        <StatCard icon="hiking" title="Budget Backpacker" value={cityData.estimatedBudget.backpacker} />
                                        <StatCard icon="hotel" title="Budget Mid-Range" value={cityData.estimatedBudget.midRange} />
                                    </div>
                                </Section>
                                <Section icon="flight_land" title="Arrivo in Città">
                                    <div className="space-y-3">
                                        {cityData.arrivalInfo.options.map(opt => (
                                            <div key={opt.method} className="p-4 bg-surface-variant/60 rounded-xl">
                                                <h4 className="font-semibold text-on-surface flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base">{getTransportIcon(opt.method)}</span>
                                                    {opt.method}
                                                </h4>
                                                <p className="text-sm text-on-surface-variant mt-1">{opt.details}</p>
                                                <div className="flex flex-wrap gap-2 items-center mt-3 text-xs font-medium">
                                                    <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded-full">Costo: {opt.cost}</span>
                                                    <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full">Tempo: {opt.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                                <Section icon="directions_bus" title="Muoversi in Città">
                                    <div className="space-y-3">
                                        {cityData.gettingAround.map(item => (
                                            <div key={item.method} className="p-4 bg-surface-variant/60 rounded-xl">
                                                <h4 className="font-semibold text-on-surface flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base">{getTransportIcon(item.method)}</span>
                                                    {item.method}
                                                </h4>
                                                <p className="text-sm text-on-surface-variant mt-1">{item.details}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            </div>
                        )}
                        
                        {activeTab === 'attractions' && (
                            <div className="space-y-6 divide-y divide-surface-variant">
                                <Section icon="attractions" title="Attrazioni Principali">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cityData.mainAttractions.map(attraction => (
                                            <AttractionCard key={attraction.name}
                                                name={attraction.name}
                                                description={attraction.description}
                                                costOrPrice={attraction.estimatedCost}
                                                typeOrRange={attraction.type}
                                                icon={getAttractionIcon(attraction.type)}
                                                location={attraction.location}
                                                onAddToItinerary={activeTrip ? () => handleOpenItineraryModal({ name: attraction.name, description: attraction.description, location: attraction.location }) : undefined}
                                            />
                                        ))}
                                    </div>
                                </Section>
                                <Section icon="restaurant" title="Esperienze Culinarie">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cityData.foodExperience.map(food => (
                                            <AttractionCard key={food.name}
                                                name={food.name}
                                                description={food.description}
                                                costOrPrice={food.priceRange}
                                                typeOrRange="Cibo Locale"
                                                icon="restaurant_menu"
                                            />
                                        ))}
                                    </div>
                                </Section>
                                <Section icon="near_me" title="Gite di un Giorno">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cityData.dayTrips.map(trip => (
                                            <AttractionCard key={trip.name}
                                                name={trip.name}
                                                description={trip.description}
                                                costOrPrice={trip.travelTime}
                                                typeOrRange="Escursione"
                                                icon="signpost"
                                            />
                                        ))}
                                    </div>
                                </Section>
                            </div>
                        )}

                        {activeTab === 'itinerary' && (
                            <div className="space-y-6 divide-y divide-surface-variant">
                                <Section icon="route" title="Itinerari Suggeriti">
                                    {cityData.suggestedItineraries.map(itinerary => (
                                        <div key={itinerary.title}>
                                            <h4 className="text-xl font-semibold mb-4 text-on-surface">{itinerary.title}</h4>
                                            <div className="space-y-3">
                                                {itinerary.days.map(day => (
                                                    <AccordionItem key={day.day} title={`Giorno ${day.day}: ${day.theme}`}>
                                                        <ul className="space-y-2 list-disc list-inside">
                                                            {day.activities.map((activity, i) => <li key={i}>{activity}</li>)}
                                                        </ul>
                                                    </AccordionItem>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </Section>
                                <Section icon="thumb_up" title="Consigli di Viaggio">
                                    <div className="space-y-3">
                                        <div className="p-4 bg-surface-variant/60 rounded-xl">
                                            <h4 className="font-semibold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined">family_restroom</span> Per le Famiglie</h4>
                                            <p className="text-sm text-on-surface-variant mt-1">{cityData.travelerTips.families}</p>
                                        </div>
                                        <div className="p-4 bg-surface-variant/60 rounded-xl">
                                            <h4 className="font-semibold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined">favorite</span> Per le Coppie</h4>
                                            <p className="text-sm text-on-surface-variant mt-1">{cityData.travelerTips.couples}</p>
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        )}
                        
                        {activeTab === 'country' && (
                            <div className="space-y-6">
                                <Section icon="badge" title="Requisiti di Ingresso">
                                    <div className="p-4 bg-surface-variant/60 rounded-xl text-on-surface-variant text-sm space-y-2">
                                        <p><span className="font-semibold text-on-surface">Visto:</span> {countryData.entryRequirements.visaInfo}</p>
                                        <p><span className="font-semibold text-on-surface">Passaporto:</span> {countryData.entryRequirements.passportValidity}</p>
                                    </div>
                                </Section>
                                <Section icon="vaccines" title="Salute e Vaccini">
                                    <div className="p-4 bg-surface-variant/60 rounded-xl">
                                        <p className="text-xs italic text-on-surface-variant mb-4">{countryData.healthAndVaccinations.disclaimer}</p>
                                        <AccordionItem title="Vaccinazioni Raccomandate" defaultOpen={true}>
                                            <div className="space-y-3">
                                                {countryData.healthAndVaccinations.recommendedVaccines.map(v => (
                                                    <div key={v.vaccine}>
                                                        <h5 className="font-semibold text-on-surface">{v.vaccine}</h5>
                                                        <p>{v.details}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionItem>
                                    </div>
                                </Section>
                                <Section icon="gavel" title="Leggi e Usanze Locali">
                                    <AccordionItem title="Punti Chiave da Ricordare">
                                        <div className="space-y-3">
                                            {countryData.lawsAndCustoms.points.map(p => (
                                                <div key={p.topic}>
                                                    <h5 className="font-semibold text-on-surface">{p.topic}</h5>
                                                    <p>{p.details}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionItem>
                                </Section>
                                <Section icon="health_and_safety" title="Sicurezza">
                                    <div className="p-4 bg-surface-variant/60 rounded-xl text-on-surface-variant text-sm space-y-2">
                                        <p><span className="font-semibold text-on-surface">Numeri Emergenza:</span> Polizia {countryData.safetyAndSecurity.emergencyNumbers.police}, Turistica {countryData.safetyAndSecurity.emergencyNumbers.touristPolice}</p>
                                        <p><span className="font-semibold text-on-surface">Truffe Comuni:</span> {countryData.safetyAndSecurity.commonScams}</p>
                                        <p><span className="font-semibold text-on-surface">Consigli Generali:</span> {countryData.safetyAndSecurity.generalSafety}</p>
                                    </div>
                                </Section>
                            </div>
                        )}
                    </main>
                </div>
                <style>{`
                    @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                    .animate-\\[slide-up_0\\.4s_cubic-bezier\\(0\\.25,1,0\\.5,1\\)\\] { animation: slide-up 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
                `}</style>
            </div>
            {itineraryModalOpen && activeTrip && selectedAttraction && (
                <Suspense fallback={<div/>}>
                    <AddToItineraryModal
                        trip={activeTrip}
                        attraction={selectedAttraction}
                        onClose={() => setItineraryModalOpen(false)}
                    />
                </Suspense>
            )}
        </>
    );
};

export default ExploreDetailView;