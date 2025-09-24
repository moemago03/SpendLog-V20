import React, { useState, useEffect, useMemo, useRef } from 'react';

declare var L: any; // Declare Leaflet global

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
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const [coordsList, setCoordsList] = useState<Coords[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        setIsMapReady(false); // Reset map readiness when locations change
        const geocodeAll = async () => {
            if (locations.length === 0) {
                setIsLoading(false);
                setCoordsList([]);
                return;
            }
            setIsLoading(true);
            const uniqueLocations = [...new Set(locations)];
            const promises = uniqueLocations.map(geocodeLocation);
            const results = await Promise.all(promises);
            const validCoords = results.filter((c): c is Coords => c !== null);
            setCoordsList(validCoords);
            setIsLoading(false);
        };
        geocodeAll();
    }, [locations]);

    useEffect(() => {
        if (isLoading || coordsList.length === 0 || !mapContainerRef.current) {
            return;
        }

        if (mapRef.current) {
            mapRef.current.remove();
        }

        const map = L.map(mapContainerRef.current, { zoomControl: true });
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const markers = coordsList.map(coords => {
            return L.marker([parseFloat(coords.lat), parseFloat(coords.lon)]);
        });

        if (markers.length > 0) {
            const featureGroup = L.featureGroup(markers).addTo(map);
            map.fitBounds(featureGroup.getBounds().pad(0.2));
        }
        
        map.whenReady(() => {
            const timer = setTimeout(() => {
                map.invalidateSize();
                setIsMapReady(true);
            }, 100);
             return () => clearTimeout(timer);
        });
        
        return () => {
            if(mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };

    }, [isLoading, coordsList]);

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
    
    if (!isLoading && coordsList.length === 0) {
        return (
             <div className="w-full h-full rounded-xl bg-surface-variant flex flex-col items-center justify-center p-4 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">wrong_location</span>
                <p className="text-sm font-semibold text-on-surface-variant">Impossibile caricare la mappa.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full rounded-xl overflow-hidden border border-outline/20 relative">
            <div 
                ref={mapContainerRef} 
                className={`w-full h-full z-10 transition-opacity duration-500 ${isMapReady ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Skeleton loader overlays the map container until map is ready */}
            {!isMapReady && (
                <div className="absolute inset-0 w-full h-full bg-surface-variant flex items-center justify-center animate-pulse z-20">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">map</span>
                </div>
            )}
        </div>
    );
};

export default MultiPointMapView;