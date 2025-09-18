import React, { useState } from 'react';
import { VIAGGIARE_SICURI_COUNTRY_SLUGS, TRAVEL_INFO_DATA } from '../../constants';

interface TravelInfoProps {
    countries: string[];
}

const InfoItem: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div>
        <h4 className="flex items-center gap-2 font-semibold text-on-surface mb-2">
            <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
            {title}
        </h4>
        <div className="pl-8 text-sm text-on-surface-variant space-y-1">
            {children}
        </div>
    </div>
);


const TravelInfo: React.FC<TravelInfoProps> = ({ countries }) => {
    const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

    if (!countries || countries.length === 0) {
        return null;
    }
    
    const handleToggle = (country: string) => {
        setExpandedCountry(prev => (prev === country ? null : country));
    };

    const availableCountries = countries.filter(country => TRAVEL_INFO_DATA[country] && VIAGGIARE_SICURI_COUNTRY_SLUGS[country]);

    if (availableCountries.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-on-surface mb-3">Informazioni di Viaggio</h2>
            <div className="bg-surface p-2 rounded-3xl shadow-sm space-y-1">
                <p className="text-xs text-on-surface-variant/80 text-center p-2">
                    Le seguenti informazioni sono indicative. Controlla sempre le fonti governative ufficiali per dati aggiornati prima della partenza.
                </p>
                {availableCountries.map(country => {
                    const info = TRAVEL_INFO_DATA[country];
                    const slug = VIAGGIARE_SICURI_COUNTRY_SLUGS[country];
                    const url = `https://www.viaggiaresicuri.it/find-country/country/${slug}`;
                    const isExpanded = expandedCountry === country;

                    return (
                        <div key={country} className="bg-surface-variant/50 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => handleToggle(country)}
                                className="w-full flex justify-between items-center p-4 text-left"
                                aria-expanded={isExpanded}
                            >
                                <span className="font-semibold text-on-surface">{country}</span>
                                <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </button>
                            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-4 pb-4 space-y-4">
                                    <InfoItem icon="badge" title="Visto">
                                        <p>{info.visaInfo}</p>
                                    </InfoItem>
                                    <InfoItem icon="vaccines" title="Salute">
                                        <p>{info.healthInfo}</p>
                                    </InfoItem>
                                    <InfoItem icon="health_and_safety" title="Sicurezza">
                                        <ul className="list-disc list-inside">
                                            {info.safetyTips.map((tip, index) => <li key={index}>{tip}</li>)}
                                        </ul>
                                    </InfoItem>
                                    
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-primary hover:underline"
                                    >
                                        Vai a Viaggiare Sicuri
                                        <span className="material-symbols-outlined text-base">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TravelInfo;