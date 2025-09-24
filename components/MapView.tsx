import React, { useState, useEffect } from 'react';

interface MapViewProps {
    location: string;
}

interface Coords {
    lat: string;
    lon: string;
}

const geocodeLocation = async (location: string): Promise<Coords | null> => {
    try {
        const response = await fetch(`httpshttps://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=it`);
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
    const [coords, setCoords] = useState<Coords | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const geocode = async () => {
            setIsLoading(true);
            const result = await geocodeLocation(location);
            setCoords(result);
            setIsLoading(false);
        };
        geocode();
    }, [location]);

    const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;

    const renderContent = () => {
        if (isLoading) {
             return (
                <div className="w-full h-full bg-surface-variant flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">map</span>
                </div>
            );
        }

        if (!coords) {
            return (
                 <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">wrong_location</span>
                    <p className="text-sm font-semibold text-on-surface-variant">Impossibile caricare la mappa.</p>
                </div>
            );
        }

        const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lon}&zoom=15&size=600x400&maptype=mapnik&markers=${coords.lat},${coords.lon},red-pushpin`;

        return (
            <img
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                alt={`Mappa di ${location}`}
                src={staticMapUrl}
                className="object-cover w-full h-full"
            />
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

export default MapView;
