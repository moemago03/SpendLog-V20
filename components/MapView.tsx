import React, { useState, useEffect } from 'react';

interface MapViewProps {
    location: string;
}

interface Coords {
    lat: string;
    lon: string;
}

const MapView: React.FC<MapViewProps> = ({ location }) => {
    const [coords, setCoords] = useState<Coords | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const geocode = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Using Nominatim for free, open-source geocoding
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=it`);
                if (!response.ok) {
                    throw new Error('Servizio di geocodifica non raggiungibile.');
                }
                const data = await response.json();
                if (data && data.length > 0) {
                    setCoords({ lat: data[0].lat, lon: data[0].lon });
                } else {
                    throw new Error('Luogo non trovato.');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        geocode();
    }, [location]);

    const encodedLocation = encodeURIComponent(location);
    const navigateUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="w-full h-full bg-surface-variant flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">map</span>
                </div>
            );
        }
        if (error || !coords) {
            return (
                <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">wrong_location</span>
                    <p className="text-sm font-semibold text-on-surface-variant">Impossibile caricare la mappa per questo luogo.</p>
                </div>
            );
        }
        
        const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lon}&zoom=16&size=600x400&maptype=mapnik&markers=${coords.lat},${coords.lon},red-pushpin`;

        return (
            <>
                <img
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    alt={`Mappa di ${location}`}
                    src={staticMapUrl}
                    className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/50 text-white rounded-full text-sm font-semibold">
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                        <span>Visualizza su Mappa</span>
                    </div>
                </div>
            </>
        );
    };

    return (
        <a href={navigateUrl} target="_blank" rel="noopener noreferrer" className="block aspect-video w-full rounded-xl overflow-hidden border border-outline/20 group relative">
            {renderContent()}
        </a>
    );
};

export default MapView;
