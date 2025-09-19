import React, { useMemo } from 'react';
import { ExploreCity, Attraction } from '../../types';

interface CityDetailModalProps {
    city: ExploreCity;
    onClose: () => void;
}

const Section: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <section className="py-4">
        <h3 className="flex items-center gap-3 text-2xl font-bold text-on-surface mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
            {title}
        </h3>
        {children}
    </section>
);

const CityDetailModal: React.FC<CityDetailModalProps> = ({ city, onClose }) => {
    
    const attractionsWithCoords = useMemo(() => {
        return city.attractions.filter(a => a.lat != null && a.lng != null);
    }, [city.attractions]);

    const mapHtmlContent = useMemo(() => {
        if (attractionsWithCoords.length === 0) return '';

        // Safely stringify the data to inject it into the script
        const markersJson = JSON.stringify(attractionsWithCoords.map(a => ({
            lat: a.lat,
            lng: a.lng,
            name: a.name,
            type: a.type
        })));

        // Create a self-contained HTML document with Leaflet.js to display multiple markers
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Map of ${city.name}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
            <style>
              body { margin: 0; padding: 0; }
              #map { height: 100vh; width: 100vw; background-color: #f0f0f0; }
              .leaflet-popup-content-wrapper { border-radius: 8px; }
              .leaflet-popup-content b { font-size: 1.1em; }
            </style>
          </head>
          <body>
            <div id="map"></div>
            <script>
              const markersData = ${markersJson};
              const map = L.map('map');
              
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 18,
              }).addTo(map);

              if (markersData.length > 0) {
                const markerGroup = L.featureGroup();
                markersData.forEach(markerInfo => {
                  const marker = L.marker([markerInfo.lat, markerInfo.lng])
                    .bindPopup('<b>' + markerInfo.name + '</b><br>' + markerInfo.type);
                  markerGroup.addLayer(marker);
                });
                markerGroup.addTo(map);
                map.fitBounds(markerGroup.getBounds().pad(0.1));
              }
            </script>
          </body>
          </html>
        `;
    }, [attractionsWithCoords, city.name]);

    const googleMapsUrl = useMemo(() => {
        if (attractionsWithCoords.length === 0) return '';
        const baseUrl = 'https://www.google.com/maps/dir/';
        // Create a route that visits all attractions
        const waypoints = attractionsWithCoords.map(a => `${a.lat},${a.lng}`).join('/');
        return `${baseUrl}${waypoints}`;
    }, [attractionsWithCoords]);

    return (
        <div 
            className="fixed inset-0 bg-background z-50 animate-[slide-up_0.4s_cubic-bezier(0.25,1,0.5,1)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-detail-title"
        >
            <div className="h-full w-full overflow-y-auto">
                <header 
                    className="relative h-60 w-full flex-shrink-0"
                >
                    <img src={city.image} alt={city.name} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                        <h1 id="city-detail-title" className="text-white text-5xl font-bold tracking-tight">{city.name}</h1>
                        <p className="text-white/80 text-lg mt-1">{city.description}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                        aria-label="Chiudi"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>
                
                <main className="p-6 space-y-4 divide-y divide-surface-variant">
                    <Section icon="location_on" title="Cosa Vedere">
                        <div className="space-y-4">
                            {city.attractions.map(attraction => (
                                <div key={attraction.name} className="p-4 bg-surface-variant/60 rounded-xl">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="font-semibold text-on-surface">{attraction.name}</p>
                                            <p className="text-xs text-on-surface-variant">{attraction.type}</p>
                                        </div>
                                        <p className="text-sm font-medium bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full flex-shrink-0">{attraction.estimatedCost}</p>
                                    </div>
                                    <p className="text-sm text-on-surface-variant mt-2">{attraction.description}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                    
                    {attractionsWithCoords.length > 0 && (
                        <Section icon="map" title="Mappa">
                            <div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-surface-variant">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    loading="lazy"
                                    srcDoc={mapHtmlContent}
                                    title={`Mappa di ${city.name}`}
                                    className="border-0"
                                ></iframe>
                            </div>
                            <div className="mt-4 text-center">
                                <a
                                    href={googleMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95"
                                >
                                    <span className="material-symbols-outlined">navigation</span>
                                    Avvia Navigazione
                                </a>
                            </div>
                        </Section>
                    )}

                    <Section icon="directions_run" title="Cosa Fare">
                        <ul className="space-y-3 pl-2">
                            {city.activities.map((activity, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-secondary mt-1">arrow_right</span>
                                    <p className="text-on-surface-variant">{activity}</p>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section icon="payments" title="Costi Stimati (al giorno)">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                            <div className="p-4 bg-surface-variant rounded-xl">
                                <p className="text-sm text-on-surface-variant">Basso</p>
                                <p className="font-bold text-lg text-on-surface">{city.dailyCostEstimate.low}</p>
                            </div>
                            <div className="p-4 bg-surface-variant rounded-xl">
                                <p className="text-sm text-on-surface-variant">Medio</p>
                                <p className="font-bold text-lg text-on-surface">{city.dailyCostEstimate.medium}</p>
                            </div>
                            <div className="p-4 bg-surface-variant rounded-xl">
                                <p className="text-sm text-on-surface-variant">Alto</p>
                                <p className="font-bold text-lg text-on-surface">{city.dailyCostEstimate.high}</p>
                            </div>
                        </div>
                    </Section>
                </main>
            </div>
             <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-\\[slide-up_0\\.4s_cubic-bezier\\(0\\.25,1,0\\.5,1\\)\\] {
                    animation: slide-up 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                }
            `}</style>
        </div>
    );
};

export default CityDetailModal;