import React from 'react';

interface MapViewProps {
    location: string;
}

const MapView: React.FC<MapViewProps> = ({ location }) => {
    // Switched to Google Static Maps API to hide POIs and provide a cleaner view.
    // The map is non-interactive but links to the full interactive Google Maps.
    // NOTE: This assumes window.GEMINI_API_KEY is also valid for the Google Maps Static API.
    const apiKey = (window as any).GEMINI_API_KEY;
    
    // URL-encode all parts for safety
    const encodedLocation = encodeURIComponent(location);
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedLocation}&zoom=17&size=600x400&maptype=roadmap&markers=color:red%7C${encodedLocation}&style=feature:poi|visibility:off&style=feature:transit|visibility:off&key=${apiKey}`;
    const navigateUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

    return (
        <a href={navigateUrl} target="_blank" rel="noopener noreferrer" className="block aspect-video w-full rounded-xl overflow-hidden border border-outline/20 group relative">
            {apiKey ? (
                <img
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    alt={`Mappa statica di ${location}`}
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
                    <span>Visualizza su Google Maps</span>
                </div>
            </div>
        </a>
    );
};

export default MapView;