// services/mapService.ts
export interface Coords {
    lat: number;
    lon: number;
}

// In-memory cache for geocoding results to improve performance and avoid rate-limiting.
const geocodeCache = new Map<string, Coords | null>();

/**
 * Geocodes a location string to latitude and longitude using Nominatim.
 * Results are cached in memory to speed up subsequent requests for the same location.
 * @param location The location string to geocode (e.g., "Rome, Italy").
 * @returns A promise that resolves to an object with lat/lon numbers, or null if not found.
 */
export const geocodeLocation = async (location: string): Promise<Coords | null> => {
    const cachedResult = geocodeCache.get(location);
    if (cachedResult !== undefined) {
        return cachedResult;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&accept-language=it`);
        
        if (!response.ok) {
            console.error(`Nominatim API returned status ${response.status} for location: ${location}`);
            geocodeCache.set(location, null);
            return null;
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            geocodeCache.set(location, coords);
            return coords;
        }
        
        geocodeCache.set(location, null);
        return null;
    } catch (error) {
        console.error(`Geocoding failed for ${location}:`, error);
        geocodeCache.set(location, null);
        return null;
    }
};
