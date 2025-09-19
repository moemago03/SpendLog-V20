import React, { useState, useEffect } from 'react';
import { CityGuide, CountryGuide } from '../../types';
import LoadingScreen from '../LoadingScreen';

interface ExploreDetailViewProps {
    cityId: string;
    countryFileMap: { [key: string]: string };
    onClose: () => void;
}

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
    <section className={`py-4 ${className}`}>
        <h3 className="flex items-center gap-3 text-2xl font-bold text-on-surface mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
            {title}
        </h3>
        {children}
    </section>
);

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <details className="bg-surface-variant/60 rounded-xl">
        <summary className="font-semibold text-on-surface p-4 cursor-pointer list-none flex justify-between items-center">
            {title}
            <span className="material-symbols-outlined transition-transform duration-300 transform details-open:rotate-180">expand_more</span>
        </summary>
        <div className="p-4 border-t border-outline/20">
            {children}
        </div>
        <style>{`
            details[open] > summary .details-open\\:rotate-180 {
                transform: rotate(180deg);
            }
        `}</style>
    </details>
);

const ExploreDetailView: React.FC<ExploreDetailViewProps> = ({ cityId, countryFileMap, onClose }) => {
    const [cityData, setCityData] = useState<CityGuide | null>(null);
    const [countryData, setCountryData] = useState<CountryGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

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
        <div 
            className="fixed inset-0 bg-background z-50 animate-[slide-up_0.4s_cubic-bezier(0.25,1,0.5,1)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-detail-title"
        >
            <div className="h-full w-full overflow-y-auto">
                <header className="relative h-60 w-full flex-shrink-0">
                    <img src={cityData.image} alt={cityData.cityName} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                        <h1 id="city-detail-title" className="text-white text-5xl font-bold tracking-tight">{cityData.cityName}</h1>
                        <p className="text-white/80 text-lg mt-1">{cityData.generalInfo.quickDescription}</p>
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

                <main className="p-6 max-w-4xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-4 divide-y divide-surface-variant">
                            <Section icon="account_balance_wallet" title="Budget Stimato">
                                <p className="text-sm text-on-surface-variant mb-2">{cityData.estimatedBudget.description}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-4 bg-surface-variant/60 rounded-xl">
                                        <p className="text-sm font-semibold">Backpacker</p>
                                        <p className="text-lg font-bold text-on-surface">{cityData.estimatedBudget.backpacker}</p>
                                    </div>
                                    <div className="p-4 bg-surface-variant/60 rounded-xl">
                                        <p className="text-sm font-semibold">Mid-Range</p>
                                        <p className="text-lg font-bold text-on-surface">{cityData.estimatedBudget.midRange}</p>
                                    </div>
                                </div>
                            </Section>
                            <Section icon="flight_land" title="Arrivo in Città">
                                <div className="space-y-3">
                                    {cityData.arrivalInfo.options.map(opt => (
                                        <div key={opt.method} className="p-4 bg-surface-variant/60 rounded-xl">
                                            <h4 className="font-semibold text-on-surface">{opt.method}</h4>
                                            <p className="text-sm text-on-surface-variant mt-1">{opt.details}</p>
                                            <div className="flex justify-between items-center mt-2 text-xs font-medium">
                                                <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded-full">{opt.cost}</span>
                                                <span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full">{opt.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                             <Section icon="directions_bus" title="Muoversi in Città">
                                <ul className="space-y-3">
                                    {cityData.gettingAround.map(item => (
                                        <li key={item.method} className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-secondary mt-1">arrow_right</span>
                                            <p className="text-on-surface-variant"><span className="font-semibold text-on-surface">{item.method}:</span> {item.details}</p>
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        </div>
                    )}
                    
                    {activeTab === 'attractions' && (
                        <div className="space-y-4 divide-y divide-surface-variant">
                            <Section icon="attractions" title="Attrazioni Principali">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {cityData.mainAttractions.map(attraction => (
                                        <div key={attraction.name} className="p-4 bg-surface-variant/60 rounded-xl flex flex-col">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <p className="font-semibold text-on-surface">{attraction.name}</p>
                                                    <p className="text-xs text-on-surface-variant">{attraction.type}</p>
                                                </div>
                                                <p className="text-sm font-medium bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full flex-shrink-0">{attraction.estimatedCost}</p>
                                            </div>
                                            <p className="text-sm text-on-surface-variant mt-2 flex-grow">{attraction.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                            <Section icon="restaurant" title="Esperienze Culinarie">
                                <div className="space-y-3">
                                    {cityData.foodExperience.map(food => (
                                        <div key={food.name} className="p-4 bg-surface-variant/60 rounded-xl">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-on-surface">{food.name}</h4>
                                                <p className="text-xs font-medium bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full">{food.priceRange}</p>
                                            </div>
                                            <p className="text-sm text-on-surface-variant mt-1">{food.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                            <Section icon="near_me" title="Gite di un Giorno">
                                {cityData.dayTrips.map(trip => (
                                    <div key={trip.name} className="p-4 bg-surface-variant/60 rounded-xl">
                                        <h4 className="font-semibold text-on-surface">{trip.name}</h4>
                                        <p className="text-sm text-on-surface-variant mt-1">{trip.description}</p>
                                        <p className="text-xs text-on-surface-variant mt-2">🕒 {trip.travelTime}</p>
                                    </div>
                                ))}
                            </Section>
                        </div>
                    )}

                    {activeTab === 'itinerary' && (
                         <div className="space-y-4 divide-y divide-surface-variant">
                            <Section icon="route" title="Itinerari Suggeriti">
                                {cityData.suggestedItineraries.map(itinerary => (
                                    <div key={itinerary.title}>
                                        <h4 className="text-xl font-semibold mb-3">{itinerary.title}</h4>
                                        <div className="space-y-3">
                                            {itinerary.days.map(day => (
                                                 <AccordionItem key={day.day} title={`Giorno ${day.day}: ${day.theme}`}>
                                                    <ul className="space-y-2 list-disc list-inside text-on-surface-variant">
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
                                        <h4 className="font-semibold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined">family_restroom</span> Famiglie</h4>
                                        <p className="text-sm text-on-surface-variant mt-1">{cityData.travelerTips.families}</p>
                                    </div>
                                    <div className="p-4 bg-surface-variant/60 rounded-xl">
                                        <h4 className="font-semibold text-on-surface flex items-center gap-2"><span className="material-symbols-outlined">favorite</span> Coppie</h4>
                                        <p className="text-sm text-on-surface-variant mt-1">{cityData.travelerTips.couples}</p>
                                    </div>
                                </div>
                            </Section>
                        </div>
                    )}
                    
                    {activeTab === 'country' && (
                        <div className="space-y-3">
                            <AccordionItem title="Requisiti di Ingresso">
                                <p className="text-sm text-on-surface-variant mb-2"><span className="font-semibold">Visto:</span> {countryData.entryRequirements.visaInfo}</p>
                                <p className="text-sm text-on-surface-variant"><span className="font-semibold">Passaporto:</span> {countryData.entryRequirements.passportValidity}</p>
                            </AccordionItem>
                             <AccordionItem title="Salute e Vaccini">
                                 <p className="text-xs italic text-on-surface-variant mb-3">{countryData.healthAndVaccinations.disclaimer}</p>
                                {countryData.healthAndVaccinations.recommendedVaccines.map(v => (
                                     <div key={v.vaccine} className="mb-2">
                                        <h5 className="font-semibold text-on-surface text-sm">{v.vaccine}</h5>
                                        <p className="text-sm text-on-surface-variant">{v.details}</p>
                                    </div>
                                ))}
                                <h5 className="font-semibold text-on-surface text-sm mt-4 mb-2">Consigli generali:</h5>
                                <ul className="list-disc list-inside space-y-1 text-sm text-on-surface-variant">
                                    {countryData.healthAndVaccinations.generalHealthTips.map((tip, i) => <li key={i}>{tip}</li>)}
                                </ul>
                            </AccordionItem>
                            <AccordionItem title="Leggi e Usanze Locali">
                                <div className="space-y-3">
                                    {countryData.lawsAndCustoms.points.map(p => (
                                         <div key={p.topic}>
                                            <h5 className="font-semibold text-on-surface text-sm">{p.topic}</h5>
                                            <p className="text-sm text-on-surface-variant">{p.details}</p>
                                        </div>
                                    ))}
                                </div>
                            </AccordionItem>
                             <AccordionItem title="Sicurezza">
                                <p className="text-sm text-on-surface-variant mb-2"><span className="font-semibold">Numeri di emergenza:</span> Polizia: {countryData.safetyAndSecurity.emergencyNumbers.police}, Polizia Turistica: {countryData.safetyAndSecurity.emergencyNumbers.touristPolice}</p>
                                <p className="text-sm text-on-surface-variant mb-2"><span className="font-semibold">Truffe comuni:</span> {countryData.safetyAndSecurity.commonScams}</p>
                                <p className="text-sm text-on-surface-variant"><span className="font-semibold">Consigli generali:</span> {countryData.safetyAndSecurity.generalSafety}</p>
                            </AccordionItem>
                        </div>
                    )}
                </main>
            </div>
            <style>{`
                @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .animate-\\[slide-up_0\\.4s_cubic-bezier\\(0\\.25,1,0\\.5,1\\)\\] { animation: slide-up 0.4s cubic-bezier(0.25, 1, 0.5, 1); }
            `}</style>
        </div>
    );
};

export default ExploreDetailView;
