// services/guideService.ts

export interface Guide {
    title: string;
    url: string;
    description: string;
}

const guideCache = new Map<string, Guide[]>();

/**
 * Fetches travel guides and articles for a city from Italian Wikivoyage.
 * It uses the OpenSearch API for efficient lookup.
 * @param cityName The name of the city.
 * @returns A promise that resolves to an array of guides.
 */
export const fetchGuidesForCity = async (cityName: string): Promise<Guide[]> => {
    const normalizedCity = cityName.toLowerCase().trim();
    if (guideCache.has(normalizedCity)) {
        return guideCache.get(normalizedCity)!;
    }

    const url = `https://it.wikivoyage.org/w/api.php?action=opensearch&search=${encodeURIComponent(cityName)}&limit=10&namespace=0&format=json&origin=*`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Wikivoyage API request failed with status ${response.status}`);
        }
        const data = await response.json();
        
        // OpenSearch format: [searchTerm, [titles], [descriptions], [urls]]
        const titles = data[1];
        const descriptions = data[2];
        const urls = data[3];

        if (!titles || titles.length === 0) {
            guideCache.set(normalizedCity, []);
            return [];
        }

        const guides: Guide[] = titles.map((title: string, index: number) => ({
            title,
            description: descriptions[index],
            url: urls[index],
        }));

        guideCache.set(normalizedCity, guides);
        return guides;

    } catch (error) {
        console.error('[guideService] Failed to fetch guides from Wikivoyage:', error);
        return []; // Return empty array on error
    }
};
