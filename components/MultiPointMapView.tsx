import React from 'react';

interface MultiPointMapViewProps {
    locations: string[];
}

const MultiPointMapView: React.FC<MultiPointMapViewProps> = ({ locations }) => {
    // Switched to Google Static Maps API to provide a clean map with only the required pins,
    // solving the issues of clutter (POIs) and missing pins from the previous implementation.
    // NOTE: This assumes window.GEMINI_API_KEY is also valid for the Google Maps Static API.
    const apiKey = (window as any).GEMINI_API_KEY;
    
    const markersQuery = locations
        .slice(0, 15) // Static API has a URL length limit, so cap the markers
        .map(loc => `markers=color:red%7C${encodeURIComponent(loc)}`)
        .join('&');

    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&maptype=roadmap&${markersQuery}&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${apiKey}`;
    
    // Generate a directions URL for the "View on Map" link
    const navigateUrl = new URL('https://www.google.com/maps/dir/?api=1');
    if (locations.length > 0) {
        navigateUrl.searchParams.append('destination', locations[locations.length - 1]);
        if (locations.length > 1) {
            navigateUrl.searchParams.append('waypoints', locations.slice(0, -1).join('|'));
        }
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
    
    return (
        <a 
            href={navigateUrl.toString()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full h-full rounded-xl overflow-hidden border border-outline/20 group relative"
        >
             {apiKey ? (
                <img
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    alt="Mappa statica con più luoghi"
                    src={staticMapUrl}
                    className="object-cover w-full h-full"
                />
            ) : (
                 <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center p-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">map</span>
                    <p className="text-sm font-semibold text-on-surface-variant">La visualizzazione della mappa richiede una configurazione API.</p>
                </div>
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/50 text-white rounded-full text-sm font-semibold">
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    <span>Visualizza Percorso</span>
                </div>
            </div>
        </a>
    );
};

export default MultiPointMapView;