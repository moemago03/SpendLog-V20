import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { geocodeLocation, Coords } from '../../services/mapService';

interface MultiPointMapViewProps {
    locations: string[];
}

interface Point {
    location: string;
    coords: Coords;
}

const BoundsUpdater: React.FC<{ points: Point[] }> = ({ points }) => {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const bounds = points.map(p => [p.coords.lat, p.coords.lon] as [number, number]);
            if (bounds.length > 1) {
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
            } else {
                map.setView(bounds[0], 14);
            }
        }
    }, [points, map]);
    return null;
};

const MultiPointMapView: React.FC<MultiPointMapViewProps> = ({ locations }) => {
    const [points, setPoints] = useState<Point[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const geocodeAll = async () => {
            if (!locations || locations.length === 0) {
                setPoints([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            
            const uniqueLocations = [...new Set(locations)];
            // FIX: Cast `uniqueLocations` to `string[]` to resolve a TypeScript type inference issue.
            // This ensures `loc` is correctly typed as `string` within the async map callback.
            const promises = (uniqueLocations as string[]).map(async (loc) => ({
                location: loc,
                coords: await geocodeLocation(loc)
            }));

            const results = await Promise.all(promises);
            const validPoints = results.filter(r => r.coords !== null) as Point[];
            
            setPoints(validPoints);
            setIsLoading(false);
        };
        geocodeAll();
    }, [locations]);

    if (isLoading) {
        return (
            <div className="w-full h-full rounded-2xl bg-surface-variant flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">map</span>
            </div>
        );
    }
    
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
    
    if (points.length === 0) {
        return (
             <div className="w-full h-full rounded-xl bg-surface-variant flex flex-col items-center justify-center p-4 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">wrong_location</span>
                <p className="text-sm font-semibold text-on-surface-variant">Impossibile caricare la mappa.</p>
                <p className="text-xs text-on-surface-variant/70">Nessuna delle posizioni fornite è stata trovata.</p>
             </div>
        );
    }

    return (
        <div className="w-full h-full rounded-xl overflow-hidden border border-outline/20 relative">
            <MapContainer 
                center={[points[0].coords.lat, points[0].coords.lon]} 
                zoom={10} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {points.map((point, index) => (
                    <Marker key={`${point.coords.lat}-${point.coords.lon}-${index}`} position={[point.coords.lat, point.coords.lon]}>
                         <Popup>{point.location}</Popup>
                    </Marker>
                ))}
                <BoundsUpdater points={points} />
            </MapContainer>
        </div>
    );
};

export default MultiPointMapView;