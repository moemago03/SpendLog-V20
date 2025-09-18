import React from 'react';
import { VIAGGIARE_SICURI_COUNTRY_SLUGS } from '../../constants';

interface TravelInfoProps {
    countries: string[];
}

const TravelInfo: React.FC<TravelInfoProps> = ({ countries }) => {
    if (!countries || countries.length === 0) {
        return null;
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-on-surface mb-3">Informazioni di Viaggio</h2>
            <div className="bg-surface p-2 rounded-3xl shadow-sm space-y-1">
                {countries.map(country => {
                    const slug = VIAGGIARE_SICURI_COUNTRY_SLUGS[country];
                    if (!slug) return null;
                    const url = `https://www.viaggiaresicuri.it/find-country/country/${slug}`;

                    return (
                        <a
                            key={country}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex justify-between items-center p-3 hover:bg-surface-variant rounded-2xl transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-on-surface-variant">shield_person</span>
                                <span className="font-medium text-on-surface">{country}</span>
                            </div>
                            <span className="material-symbols-outlined text-on-surface-variant">open_in_new</span>
                        </a>
                    );
                })}
                 <p className="text-xs text-on-surface-variant/80 text-center p-2">
                    I link aprono il sito ufficiale Viaggiare Sicuri. Controlla sempre le fonti governative per informazioni aggiornate.
                </p>
            </div>
        </div>
    );
};

export default TravelInfo;
