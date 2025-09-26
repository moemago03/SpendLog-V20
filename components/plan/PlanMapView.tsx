import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { geocodeLocation, Coords } from '../../services/mapService';

interface PlanMapViewProps {
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
            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true });
            }
        }
    }, [points, map]);
    return null;
};

const PlanMapView: React.FC<PlanMapViewProps> = ({ locations }) => {
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
        return <div className="w-full h-full bg-surface-variant animate-pulse" />;
    }
    
    if (points.length === 0) {
        return (
             <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                <div className="text-center p-4">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-2">map</span>
                    <p className="font-semibold text-on-surface-variant">Aggiungi una tappa</p>
                </div>
            </div>
        );
    }

    const polylinePositions = points.map(p => [p.coords.lat, p.coords.lon] as [number, number]);

    return (
        <MapContainer 
            center={[points[0].coords.lat, points[0].coords.lon]} 
            zoom={4} 
            scrollWheelZoom={false}
            zoomControl={false}
            dragging={false}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
            />
            {points.map((point, index) => (
                <Marker key={index} position={[point.coords.lat, point.coords.lon]}>
                    <Popup>{point.location}</Popup>
                </Marker>
            ))}
            {polylinePositions.length > 1 && (
                <Polyline positions={polylinePositions} color="#3B82F6" weight={3} />
            )}
            <BoundsUpdater points={points} />
        </MapContainer>
    );
};

export default PlanMapView;