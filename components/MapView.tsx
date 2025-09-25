import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { geocodeLocation, Coords } from '../services/mapService';

interface MapViewProps {
    location: string;
}

const MapView: React.FC<MapViewProps> = ({ location }) => {
    const [coords, setCoords] = useState<Coords | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [key, setKey] = useState(Date.now()); // Key to force re-render of MapContainer on location change

    useEffect(() => {
        const geocode = async () => {
            setIsLoading(true);
            const result = await geocodeLocation(location);
            setCoords(result);
            setKey(Date.now()); // Change key to remount map with new center
            setIsLoading(false);
        };
        geocode();
    }, [location]);

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
                <p className="text-xs text-on-surface-variant/70">Posizione non trovata.</p>
            </div>
        );
    }
    
    return (
        <div className="w-full h-full rounded-xl overflow-hidden border border-outline/20">
            <MapContainer 
                key={key} 
                center={[coords.lat, coords.lon]} 
                zoom={14} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coords.lat, coords.lon]}>
                    <Popup>{location}</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapView;