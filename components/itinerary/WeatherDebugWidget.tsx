import React, { useState, useEffect, useCallback } from 'react';
import { Trip } from '../../types';
import { getWeatherIconFromWmoCode, WeatherInfo } from '../../utils/weatherUtils';
import { useLocation } from '../../context/LocationContext';
import { dateToISOString } from '../../utils/dateUtils';
import { geocodeLocation } from '../../services/mapService';

interface WeatherDebugWidgetProps {
    trip: Trip;
}

type Status = 'Idle' | 'Geocoding' | 'Fetching Weather' | 'Processing' | 'Success' | 'Error';

const WeatherDebugWidget: React.FC<WeatherDebugWidgetProps> = ({ trip }) => {
    const { location: userLocation } = useLocation();
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
            
            const location = userLocation?.city || trip.countries?.[0];

            if (!location) {
                setStatus('Error');
                log('ERRORE: Nessuna posizione disponibile (né utente né viaggio).');
                setLocationUsed('Nessuna');
                return;
            }

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

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tripStart = new Date(trip.startDate.split('T')[0] + 'T00:00:00Z');
                const tripEnd = new Date(trip.endDate.split('T')[0] + 'T23:59:59Z');

                if (today > tripEnd) {
                    log('Viaggio terminato. Nessun dato meteo da recuperare.');
                    setStatus('Success');
                    return;
                }

                const apiStartDate = today > tripStart ? today : tripStart;
                const apiEndDateLimit = new Date(apiStartDate);
                apiEndDateLimit.setDate(apiEndDateLimit.getDate() + 8); // 9 days total
                const apiEndDate = apiEndDateLimit < tripEnd ? apiEndDateLimit : tripEnd;

                const startDateParam = dateToISOString(apiStartDate);
                const endDateParam = dateToISOString(apiEndDate);

                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&start_date=${startDateParam}&end_date=${endDateParam}&timezone=auto`;
                log(`Chiamata API: ${weatherUrl.substring(0, 120)}...`);
                
                const response = await fetch(weatherUrl);
                if (!response.ok) throw new Error(`API ha risposto con stato ${response.status}`);
                
                const data = await response.json();
                if (!data.daily || !data.daily.time) throw new Error("Risposta API non valida o vuota (mancano dati 'daily').");

                setStatus('Processing');
                log(`Dati giornalieri ricevuti per ${data.daily.time.length} giorni. Inizio elaborazione.`);
                
                const weatherMap = new Map<string, WeatherInfo>();
                for (let i = 0; i < data.daily.time.length; i++) {
                    const date = data.daily.time[i];
                    const temp = data.daily.temperature_2m_max[i];
                    const code = data.daily.weathercode[i];
                    if (temp !== null && code !== null) {
                        weatherMap.set(date, {
                            icon: getWeatherIconFromWmoCode(code),
                            temp: Math.round(temp),
                        });
                    }
                }
                log(`Elaborazione completata per ${weatherMap.size} giorni.`);
                
                const firstDayOfTripISO = trip.startDate.split('T')[0];
                const firstDayWeather = weatherMap.get(firstDayOfTripISO) || Array.from(weatherMap.values())[0];
                
                if (firstDayWeather) {
                    setWeatherPreview(firstDayWeather);
                    const previewDate = weatherMap.has(firstDayOfTripISO) ? firstDayOfTripISO : Array.from(weatherMap.keys())[0];
                    log(`Anteprima meteo per il primo giorno (${previewDate}): ${firstDayWeather.temp}°C, Icona: ${firstDayWeather.icon}`);
                } else {
                     log(`Nessun dato meteo per il primo giorno del viaggio (${firstDayOfTripISO}).`);
                }

                setStatus('Success');
            } catch (error: any) {
                setStatus('Error');
                log(`ERRORE nel recupero meteo: ${error.message}`);
            }
        };

        fetchAndLog();
    }, [trip, log, userLocation]);

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
                        <p className="text-xs font-medium text-on-surface-variant">Giorno 1</p>
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
