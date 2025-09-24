import React, { useState, useEffect, useRef } from 'react';

declare var L: any; // Declare Leaflet global

interface MapViewProps {
    location: string;
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

const MapView: React.FC<MapViewProps> = ({ location }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null); // To hold the map instance
    const [coords, setCoords] = useState<Coords | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        setIsMapReady(false);
        const geocode = async () => {
            setIsLoading(true);
            const result = await geocodeLocation(location);
            setCoords(result);
            setIsLoading(false);
        };
        geocode();
    }, [location]);

    useEffect(() => {
        if (isLoading || !coords || !mapContainerRef.current) {
            return;
        }
        
        if (mapRef.current) {
             mapRef.current.remove();
        }

        const lat = parseFloat(coords.lat);
        const lon = parseFloat(coords.lon);

        const map = L.map(mapContainerRef.current).setView([lat, lon], 15);
        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map);

        map.whenReady(() => {
            const timer = setTimeout(() => {
                map.invalidateSize();
                setIsMapReady(true);
            }, 100);
            return () => clearTimeout(timer);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isLoading, coords]);
    
    if (isLoading) {
        return (
            <div className="w-full h-full rounded-xl overflow-hidden border border-outline/20 relative">
                <div className="absolute inset-0 w-full h-full bg-surface-variant flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">map</span>
                </div>
            </div>
        );
    }
    
    if (!coords) {
        return (
            <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center p-4 text-center rounded-xl">
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
            {!isMapReady && (
                <div className="absolute inset-0 w-full h-full bg-surface-variant flex items-center justify-center animate-pulse z-20">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">map</span>
                </div>
            )}
        </div>
    );
};

export default MapView;