


import React, { useState, useEffect, useCallback } from 'react';
import { Trip } from '../../types';
import { getWeatherIconFromBrightSky, WeatherInfo } from '../../utils/weatherUtils';
import { dateToISOString } from '../../utils/dateUtils';

interface WeatherDebugWidgetProps {
    trip: Trip;
}

type Status = 'Idle' | 'Geocoding' | 'Fetching Weather' | 'Processing' | 'Success' | 'Error';

// Helper to geocode a location string to lat/lon using Nominatim
const geocodeLocation = async (location: string): Promise<{ lat: number; lon: number } | null> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=it`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error(`Geocoding failed for ${location}:`, error);
        return null;
    }
};

const WeatherDebugWidget: React.FC<WeatherDebugWidgetProps> = ({ trip }) => {
    const [status, setStatus] = useState<Status>('Idle');
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [weatherPreview, setWeatherPreview] = useState<WeatherInfo | null>(null);
    const [locationUsed, setLocationUsed] = useState<string>('N/A');

    const log = useCallback((message: string) => {
        setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    }, []);

    useEffect(() => {
        const fetchAndLog = async () => {
            setDebugLog([]);
            setWeatherPreview(null);
            log('Inizio processo recupero meteo...');
            
            if (!trip.countries || trip.countries.length === 0) {
                setStatus('Error');
                log('ERRORE: Nessuna nazione definita nel viaggio.');
                setLocationUsed('Nessuna');
                return;
            }

            const location = trip.countries[0];
            setLocationUsed(location);
            log(`Posizione da usare: ${location}`);
            setStatus('Geocoding');

            const coords = await geocodeLocation(location);
            if (!coords) {
                setStatus('Error');
                log(`ERRORE: Geocodifica fallita per "${location}".`);
                return;
            }
            log(`Geocodifica riuscita: Lat ${coords.lat.toFixed(2)}, Lon ${coords.lon.toFixed(2)}`);
            setStatus('Fetching Weather');

            try {
                const { lat, lon } = coords;
                const startDate = trip.startDate;
                const endDate = trip.endDate;
                const weatherUrl = `https://api.brightsky.dev/weather?lat=${lat}&lon=${lon}&date=${startDate}&last_date=${endDate}`;
                log(`Chiamata API: ${weatherUrl.substring(0, 120)}...`);
                
                const response = await fetch(weatherUrl);
                if (!response.ok) throw new Error(`API ha risposto con stato ${response.status}`);
                
                const data = await response.json();
                if (!data.weather) throw new Error("Risposta API non valida o vuota.");

                setStatus('Processing');
                log(`Dati orari ricevuti (${data.weather.length} record). Inizio aggregazione giornaliera.`);
                
                const dailyData = new Map<string, { temps: number[], icons: string[] }>();
                 data.weather.forEach((hourly: any) => {
                    const date = hourly.timestamp.substring(0, 10);
                    if (!dailyData.has(date)) dailyData.set(date, { temps: [], icons: [] });
                    const day = dailyData.get(date)!;
                    if (hourly.temperature !== null) day.temps.push(hourly.temperature);
                    if (hourly.icon) day.icons.push(hourly.icon);
                });
                log(`Aggregazione completata per ${dailyData.size} giorni.`);
                
                const todayISO = dateToISOString(new Date());
                const todayData = dailyData.get(todayISO);
                
                if (todayData && todayData.temps.length > 0) {
                    const maxTemp = Math.round(Math.max(...todayData.temps));
                    const iconCounts: { [key: string]: number } = todayData.icons.reduce((acc, icon) => {
                        acc[icon] = (acc[icon] || 0) + 1;
                        return acc;
                    }, {} as { [key: string]: number });
                    const dominantIcon = Object.keys(iconCounts).reduce((a, b) => iconCounts[a] > iconCounts[b] ? a : b, 'thermostat');
                    const preview: WeatherInfo = {
                        icon: getWeatherIconFromBrightSky(dominantIcon),
                        temp: maxTemp,
                    };
                    setWeatherPreview(preview);
                    log(`Meteo di oggi: ${preview.temp}°C, Icona: ${preview.icon} (da "${dominantIcon}")`);
                } else {
                     log("Nessun dato meteo per la data odierna trovato.");
                }
                setStatus('Success');
            } catch (error: any) {
                setStatus('Error');
                log(`ERRORE nel recupero meteo: ${error.message}`);
            }
        };

        fetchAndLog();
    }, [trip, log]);

    const getStatusColor = () => {
        switch (status) {
            case 'Success': return 'text-green-500';
            case 'Error': return 'text-error';
            case 'Geocoding':
            case 'Fetching Weather':
            case 'Processing':
                return 'text-yellow-500';
            default: return 'text-on-surface-variant';
        }
    };

    return (
        <div className="p-4 bg-surface-variant/50 rounded-2xl border border-outline/20">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-on-surface text-sm">Anteprima Meteo e Debug</h3>
                    <p className={`text-xs font-bold uppercase ${getStatusColor()}`}>{status}</p>
                </div>
                {weatherPreview && (
                    <div className="text-center bg-surface p-2 rounded-lg">
                        <p className="text-xs font-medium text-on-surface-variant">Oggi</p>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-primary text-lg">{weatherPreview.icon}</span>
                            <span className="font-bold text-on-surface">{weatherPreview.temp}°</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-3 pt-3 border-t border-outline/20">
                <p className="text-xs text-on-surface-variant">
                    <span className="font-semibold">Località in uso:</span> {locationUsed}
                </p>
                <details className="text-xs mt-1">
                    <summary className="cursor-pointer font-semibold text-on-surface-variant">Mostra log dettagliato</summary>
                    <div className="mt-2 p-2 bg-black/70 text-white rounded-lg font-mono text-[10px] max-h-24 overflow-y-auto">
                        {debugLog.map((line, index) => <p key={index} className="whitespace-pre-wrap">{line}</p>)}
                    </div>
                </details>
            </div>
        </div>
    );
};

export default WeatherDebugWidget;