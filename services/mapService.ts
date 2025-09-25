// services/mapService.ts
export interface Coords {
    lat: number;
    lon: number;
}

const mockLocations: { [key: string]: Coords } = {
    // From mock expenses & itinerary
    'trastevere, roma, italia': { lat: 41.8897, lon: 12.4692 },
    'khaosan road, bangkok, thailandia': { lat: 13.7588, lon: 100.4973 },
    'baia di ha long, vietnam': { lat: 20.9102, lon: 107.0754 },
    'yaowarat road, bangkok, thailandia': { lat: 13.7410, lon: 100.5106 },
    'siam bts station, bangkok': { lat: 13.7463, lon: 100.5341 },
    'hanoi old quarter, vietnam': { lat: 21.0339, lon: 105.8506 },
    'bar del corso, roma, italia': { lat: 41.9056, lon: 12.4823 },
    'museo d\'arte moderna, roma, italia': { lat: 41.9178, lon: 12.4764 },
    'na phra lan rd, bangkok': { lat: 13.7516, lon: 100.4925 },
    'na phra lan rd, phra borom maha ratchawang, phra nakhon, bangkok 10200, thailandia': { lat: 13.7516, lon: 100.4925 },
    '158 thanon wang doem, wat arun, bangkok yai, bangkok 10600, thailandia': { lat: 13.7437, lon: 100.4890 },
    '2 sanam chai rd, phra borom maha ratchawang, phra nakhon, bangkok 10200, thailandia': { lat: 13.7460, lon: 100.4930 },
    'kamphaeng phet 2 rd, chatuchak, bangkok 10900, thailandia': { lat: 13.8010, lon: 100.5492 },
    'grande palazzo reale': { lat: 13.7516, lon: 100.4925 },
    'wat arun (tempio dell\'alba)': { lat: 13.7437, lon: 100.4890 },
    'wat pho (tempio del buddha sdraiato)': { lat: 13.7460, lon: 100.4930 },
    'mercato del fine settimana di chatuchak': { lat: 13.8010, lon: 100.5492 },
    // From explore view cities/countries
    'bangkok': { lat: 13.7563, lon: 100.5018 },
    'thailandia': { lat: 13.7563, lon: 100.5018 },
    'vietnam': { lat: 16.1667, lon: 107.8333 },
    'cambogia': { lat: 12.5657, lon: 104.9910 },
    'italia': { lat: 41.8719, lon: 12.5674 },
    'bologna': { lat: 44.4949, lon: 11.3426 },
};


// In-memory cache for geocoding results to improve performance and avoid rate-limiting.
const geocodeCache = new Map<string, Coords | null>();

/**
 * Geocodes a location string to latitude and longitude using local mock data.
 * Results are cached in memory to speed up subsequent requests for the same location.
 * @param location The location string to geocode (e.g., "Rome, Italy").
 * @returns A promise that resolves to an object with lat/lon numbers, or null if not found.
 */
export const geocodeLocation = async (location: string): Promise<Coords | null> => {
    const normalizedLocation = location.toLowerCase().trim();
    if (geocodeCache.has(normalizedLocation)) {
        return geocodeCache.get(normalizedLocation)!;
    }

    // Use mock data instead of calling an external API
    const mockCoord = mockLocations[normalizedLocation];
    if (mockCoord) {
        geocodeCache.set(normalizedLocation, mockCoord);
        return mockCoord;
    }
    
    // Fallback for partial matches (e.g., "Wat Arun" instead of full address)
    for (const key in mockLocations) {
        if (key.includes(normalizedLocation)) {
            const partialMatchCoord = mockLocations[key];
            geocodeCache.set(normalizedLocation, partialMatchCoord);
            return partialMatchCoord;
        }
    }
    
    console.warn(`[Mock Geocoding] No coordinates found for: "${location}"`);
    geocodeCache.set(normalizedLocation, null);
    return null;
};