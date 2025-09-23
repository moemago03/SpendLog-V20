import React, { useState, useEffect, useMemo } from 'react';

interface MultiPointMapViewProps {
    locations: string[];
}

interface Coords {
    lat: string;
    lon: string;
}

const geocodeLocation = async (location: string): Promise<Coords | null> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=it`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: data[0].lat, lon: data[0].lon };
        }
        return null;
    } catch (error) {
        console.error(`Geocoding failed for ${location}:`, error);
        return null;
    }
};


const MultiPointMapView: React.FC<MultiPointMapViewProps> = ({ locations }) => {
    const [coordsList, setCoordsList] = useState<Coords[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const geocodeAll = async () => {
            if (locations.length === 0) {
                setIsLoading(false);
                setCoordsList([]);
                return;
            }
            setIsLoading(true);
            const uniqueLocations = [...new Set(locations)]; // Avoid duplicate API calls
            const promises = uniqueLocations.map(geocodeLocation);
            const results = await Promise.all(promises);
            const validCoords = results.filter((c): c is Coords => c !== null);
            setCoordsList(validCoords);
            setIsLoading(false);
        };
        geocodeAll();
    }, [locations]);

    const navigateUrl = useMemo(() => {
        const url = new URL('https://www.google.com/maps/dir/?api=1');
        if (locations.length > 0) {
            url.searchParams.append('destination', locations[locations.length - 1]);
            if (locations.length > 1) {
                url.searchParams.append('waypoints', locations.slice(0, -1).join('|'));
            }
        }
        return url.toString();
    }, [locations]);

    if (!locations || locations.length === 0) {
        return (
             <div className="w-full h-full rounded-2xl bg-surface-variant flex items-center justify-center">
                <div className="text-center p-4">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-2">map</span>
                    <p className="font-semibold text-on-surface-variant">Nessun luogo da mostrare</p>
                </div>
            </div>
        );
    }
    
    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="w-full h-full bg-surface-variant flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">map</span>
                </div>
            );
        }

        if (coordsList.length === 0) {
            return (
                 <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">wrong_location</span>
                    <p className="text-sm font-semibold text-on-surface-variant">Impossibile caricare la mappa.</p>
                </div>
            );
        }

        const markersQuery = coordsList
            .map(coords => `${coords.lat},${coords.lon},red-pushpin`)
            .join('|');
        
        // This service does not auto-fit bounds, so we center on the first location
        // which is sufficient for a daily or weekly itinerary overview.
        const center = `${coordsList[0].lat},${coordsList[0].lon}`;
        const zoom = coordsList.length > 1 ? '11' : '15'; // Zoom out if there are multiple points

        const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${center}&zoom=${zoom}&size=600x400&maptype=mapnik&markers=${markersQuery}`;

        return (
            <>
                <img
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    alt="Mappa con più luoghi"
                    src={staticMapUrl}
                    className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/50 text-white rounded-full text-sm font-semibold">
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                        <span>Visualizza Percorso</span>
                    </div>
                </div>
            </>
        );
    };

    return (
        <a 
            href={navigateUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full h-full rounded-xl overflow-hidden border border-outline/20 group relative"
        >
            {renderContent()}
        </a>
    );
};

export default MultiPointMapView;
