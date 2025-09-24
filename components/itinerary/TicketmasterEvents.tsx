import React, { useState, useEffect, useCallback } from 'react';
import { Trip } from '../../types';
import { useLocation } from '../../context/LocationContext';

// Definisce la struttura di un evento Ticketmaster per una tipizzazione forte
interface TicketmasterEvent {
    id: string;
    name: string;
    url: string;
    images: { url: string }[];
    dates: {
        start: {
            localDate: string;
            localTime?: string;
        };
    };
    _embedded?: {
        venues: { name: string }[];
    };
}

interface TicketmasterEventsProps {
    trip: Trip;
    selectedDate: string; // Formato YYYY-MM-DD
}

const API_KEY = 'OIy4hV1bmN4kaAMZuIxeo1vgYC9QOM5P';
const API_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

const TicketmasterEvents: React.FC<TicketmasterEventsProps> = ({ trip, selectedDate }) => {
    const { location: userLocation } = useLocation();
    const [events, setEvents] = useState<TicketmasterEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<string[]>([]);

    const log = useCallback((message: string) => {
        setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            log('Inizio ricerca eventi...');
            setLoading(true);
            setError(null);
            setEvents([]);

            // Prioritizza la città attuale dell'utente, altrimenti usa il primo paese del viaggio
            const city = userLocation?.city || trip.countries[0];
            if (!city) {
                const errorMsg = 'Nessuna città specificata per la ricerca.';
                log(`ERRORE: ${errorMsg}`);
                setError(errorMsg);
                setLoading(false);
                return;
            }

            log(`Città in uso per la ricerca: ${city}`);
            
            // Aggiunge il filtro per la data selezionata
            const startDateTime = `${selectedDate}T00:00:00Z`;
            const endDateTime = `${selectedDate}T23:59:59Z`;
            log(`Ricerca eventi per il giorno: ${selectedDate}`);
            
            const url = `${API_BASE_URL}?apikey=${API_KEY}&city=${encodeURIComponent(city)}&sort=date,asc&size=20&startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
            log(`Chiamata API: ${url}`);

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorBody = await response.json();
                    const errorMessage = errorBody?.fault?.faultstring || `Errore API: ${response.status}`;
                    throw new Error(errorMessage);
                }
                const data = await response.json();
                
                if (data._embedded && data._embedded.events) {
                    const foundEvents: TicketmasterEvent[] = data._embedded.events;
                    setEvents(foundEvents);
                    log(`Successo: Trovati ${foundEvents.length} eventi.`);
                } else {
                    setEvents([]);
                    log('Nessun evento trovato per questa città e data.');
                }

            } catch (err: any) {
                const errorMsg = err.message || 'Errore sconosciuto durante il recupero degli eventi.';
                log(`ERRORE: ${errorMsg}`);
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [trip, userLocation, log, selectedDate]);

    const EventCard: React.FC<{ event: TicketmasterEvent }> = ({ event }) => {
        const imageUrl = event.images.find(img => img.ratio === '3_2' && img.width > 400)?.url || event.images[0]?.url;
        const venueName = event._embedded?.venues[0]?.name;
        const eventDate = new Date(`${event.dates.start.localDate}T${event.dates.start.localTime || '00:00:00'}`);
        
        const formattedDate = eventDate.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
        });
        const formattedTime = event.dates.start.localTime ? eventDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';


        return (
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="block bg-surface rounded-2xl shadow-md overflow-hidden transition-transform hover:scale-[1.03] active:scale-100">
                <img src={imageUrl} alt={event.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                    <h4 className="font-bold text-on-surface truncate">{event.name}</h4>
                    {venueName && <p className="text-sm text-on-surface-variant">{venueName}</p>}
                    <p className="text-xs text-on-surface-variant mt-1 font-semibold">{formattedDate}{formattedTime && `, ore ${formattedTime}`}</p>
                </div>
            </a>
        );
    };
    
    const formattedDateTitle = new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="p-4 bg-surface-variant/50 rounded-2xl border border-outline/20">
                <h3 className="font-semibold text-on-surface text-sm">Debug Ricerca Eventi</h3>
                <div className="mt-2 p-2 bg-black/80 text-white font-mono text-xs rounded-lg max-h-40 overflow-y-auto">
                    {debugLog.map((line, index) => (
                        <p key={index} className="whitespace-pre-wrap break-words">{line}</p>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-on-surface mb-4">Eventi per il {formattedDateTitle}</h2>
                {loading && (
                    <div className="text-center py-10">
                         <div className="w-8 h-8 border-4 border-t-primary border-surface-variant rounded-full animate-spin mx-auto"></div>
                         <p className="mt-4 text-on-surface-variant">Ricerca eventi in corso...</p>
                    </div>
                )}
                {error && <p className="text-error text-center py-10 bg-error-container/20 p-4 rounded-xl">{error}</p>}
                {!loading && !error && events.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {events.map(event => <EventCard key={event.id} event={event} />)}
                    </div>
                )}
                {!loading && !error && events.length === 0 && (
                    <div className="text-center py-10 px-4 bg-surface-variant/50 rounded-3xl">
                        <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">event_busy</span>
                        <p className="font-semibold text-on-surface-variant text-lg">Nessun evento trovato</p>
                        <p className="text-sm text-on-surface-variant/80 mt-1">Non ci sono eventi per questa data su Ticketmaster.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketmasterEvents;