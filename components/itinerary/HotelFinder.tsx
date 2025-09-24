import React, { useState, useEffect, useCallback } from 'react';
import { Trip } from '../../types';
import { useLocation } from '../../context/LocationContext';
import ExpenseListSkeleton from '../ExpenseListSkeleton';

interface HotelFinderProps {
    trip: Trip;
}

interface ProcessedHotel {
    id: string;
    name: string;
    bestPrice: number | null;
    bestVendor: string | null;
}

type HotelInfo = { hotelName: string; hotelId: string; };
type PriceInfo = { price: string | null; vendor: string | null; tax: string | null };
type ApiHotelEntry = [HotelInfo[], PriceInfo[]];
type ApiResponse = ApiHotelEntry[];

const HotelFinder: React.FC<HotelFinderProps> = ({ trip }) => {
    const { location: userLocation } = useLocation();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [hotels, setHotels] = useState<ProcessedHotel[]>([]);
    const [debugLog, setDebugLog] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const log = useCallback((message: string) => {
        setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    }, []);

    const parseApiResponse = (data: ApiResponse): ProcessedHotel[] => {
        if (!Array.isArray(data)) {
            throw new Error("Invalid API response format: not an array.");
        }

        return data.map((hotelData: ApiHotelEntry) => {
            if (!Array.isArray(hotelData) || hotelData.length < 2 || !hotelData[0]?.[0]) {
                log(`Skipping malformed hotel entry: ${JSON.stringify(hotelData)}`);
                return null;
            }

            const hotelInfo = hotelData[0][0];
            const prices = hotelData[1];
            
            let bestPrice: number | null = null;
            let bestVendor: string | null = null;
            
            if (Array.isArray(prices)) {
                prices.forEach(priceInfo => {
                    // Assuming the API response is an array of objects like { price: '123', vendor: '...' }
                    // This handles potential malformations in the provided API docs.
                    const priceValue = priceInfo.price ? parseFloat(priceInfo.price) : null;
                    if (priceValue !== null && !isNaN(priceValue) && (bestPrice === null || priceValue < bestPrice)) {
                        bestPrice = priceValue;
                        bestVendor = priceInfo.vendor || null;
                    }
                });
            }

            return {
                id: hotelInfo.hotelId,
                name: hotelInfo.hotelName,
                bestPrice,
                bestVendor,
            };
        }).filter((hotel): hotel is ProcessedHotel => hotel !== null);
    };

    useEffect(() => {
        const fetchHotels = async () => {
            log('Inizio ricerca hotel...');
            const city = userLocation?.city || trip.countries[0];

            if (!city) {
                log('ERRORE: Nessuna città specificata per la ricerca.');
                setError('Nessuna città specificata per la ricerca.');
                setStatus('error');
                return;
            }

            log(`Città in uso: ${city}`);
            setStatus('loading');
            setError(null);

            try {
                const apiUrl = `https://api.makcorps.com/free/${city.toLowerCase().replace(/\s+/g, '-')}`;
                log(`Chiamata API: ${apiUrl}`);
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`API ha risposto con stato ${response.status}`);
                }
                
                const data: ApiResponse = await response.json();
                log('Risposta API ricevuta, inizio elaborazione...');
                
                const processedHotels = parseApiResponse(data);
                log(`Elaborazione completata. Trovati ${processedHotels.length} hotel.`);
                
                setHotels(processedHotels);
                setStatus('success');

            } catch (err: any) {
                log(`ERRORE: ${err.message}`);
                setError(err.message || 'Si è verificato un errore sconosciuto.');
                setStatus('error');
            }
        };

        fetchHotels();
    }, [trip, userLocation, log]);

    const renderContent = () => {
        if (status === 'loading') {
            return <ExpenseListSkeleton />;
        }
        if (status === 'error') {
            return (
                <div className="text-center py-12 px-4 bg-error-container/20 rounded-3xl">
                    <span className="material-symbols-outlined text-5xl text-on-error-container/60 mb-4">error</span>
                    <p className="font-semibold text-on-error-container">Errore nella ricerca</p>
                    <p className="text-sm text-on-error-container/80 mt-1">{error}</p>
                </div>
            );
        }
        if (status === 'success' && hotels.length === 0) {
            return (
                <div className="text-center py-12 px-4 bg-surface-variant/50 rounded-3xl">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">hotel_class</span>
                    <p className="font-semibold text-on-surface-variant text-lg">Nessun hotel trovato</p>
                    <p className="text-sm text-on-surface-variant/80 mt-1">Nessun risultato per la località cercata. Riprova più tardi.</p>
                </div>
            );
        }
        if (status === 'success') {
            return (
                <div className="space-y-3">
                    {hotels.map(hotel => (
                        <div key={hotel.id} className="p-4 bg-surface-variant rounded-2xl flex justify-between items-center">
                            <div className="min-w-0">
                                <p className="font-semibold text-on-surface truncate">{hotel.name}</p>
                                {hotel.bestVendor && <p className="text-xs text-on-surface-variant">Miglior prezzo su {hotel.bestVendor}</p>}
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                                {hotel.bestPrice !== null ? (
                                    <>
                                        <p className="font-bold text-lg text-on-surface">${hotel.bestPrice.toFixed(2)}</p>
                                        <p className="text-xs text-on-surface-variant -mt-1">a notte</p>
                                    </>
                                ) : (
                                    <p className="text-sm font-semibold text-on-surface-variant">N/A</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-on-background">Trova Hotel</h2>
             <details className="p-3 bg-surface-variant/40 rounded-lg text-xs">
                <summary className="cursor-pointer font-semibold text-on-surface-variant">Debug Ricerca Hotel</summary>
                <div className="mt-2 p-2 bg-black/70 text-white rounded-lg font-mono text-[10px] max-h-32 overflow-y-auto">
                    {debugLog.map((line, index) => <p key={index} className="whitespace-pre-wrap">{line}</p>)}
                </div>
            </details>
            {renderContent()}
        </div>
    );
};

export default HotelFinder;