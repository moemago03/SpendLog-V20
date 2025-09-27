// services/wikiService.ts
import { Poi } from './poiService';

export interface WikiInfo {
    extract: string;
    pageId: number;
}

export interface PoiDetail extends WikiInfo {
    imageUrl?: string;
    pageUrl?: string;
}

const wikiCache = new Map<string, WikiInfo | null>();
const poiDetailCache = new Map<string, PoiDetail | null>();

/**
 * Fetches a summary/extract for a given city from the Italian Wikipedia API.
 * @param cityName The name of the city.
 * @returns A promise resolving to WikiInfo object or null if not found.
 */
export const fetchCityInfo = async (cityName: string): Promise<WikiInfo | null> => {
    // RIABILITARE API WIKI: Rimuovere la riga sottostante per riattivare le informazioni sulla città.
    return null;

    const normalizedCity = cityName.toLowerCase().trim();
    if (wikiCache.has(normalizedCity)) {
        return wikiCache.get(normalizedCity)!;
    }
    
    const url = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&origin=*&redirects=1&titles=${encodeURIComponent(cityName)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Wikipedia API request failed');
        const data = await response.json();

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId && pages[pageId] && !pages[pageId].missing) {
            const info: WikiInfo = {
                extract: pages[pageId].extract,
                pageId: parseInt(pageId),
            };
            wikiCache.set(normalizedCity, info);
            return info;
        }
        
        wikiCache.set(normalizedCity, null);
        return null;

    } catch (error) {
        console.error('[wikiService] Failed to fetch city info:', error);
        wikiCache.set(normalizedCity, null);
        return null;
    }
};

/**
 * Gets the Italian Wikipedia page title from a Wikidata item ID.
 * @param wikidataId The Wikidata Q-ID (e.g., "Q83737").
 * @returns The page title string or null.
 */
const getWikipediaTitleFromWikidataId = async (wikidataId: string): Promise<string | null> => {
    // RIABILITARE API WIKI: Rimuovere la riga sottostante.
    return null;

    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=sitelinks&format=json&origin=*`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        return data.entities[wikidataId]?.sitelinks?.itwiki?.title || null;
    } catch (error) {
        console.error("Failed to get sitelink from Wikidata", error);
        return null;
    }
}


/**
 * Fetches detailed information for a Point of Interest (POI) from Wikipedia,
 * using its Wikidata ID for accuracy if available.
 * @param poi The POI object from poiService.
 * @returns A promise resolving to a PoiDetail object or null.
 */
export const fetchPoiDetails = async (poi: Poi): Promise<PoiDetail | null> => {
    // RIABILITARE API WIKI: Rimuovere la riga sottostante.
    return null;

    const cacheKey = poi.id || poi.name.toLowerCase().trim();
    if (poiDetailCache.has(cacheKey)) {
        return poiDetailCache.get(cacheKey)!;
    }

    let pageTitle = poi.name;
    // If we have a Wikidata ID, use it to get the exact Wikipedia page title for reliability
    if (poi.id) {
        const titleFromId = await getWikipediaTitleFromWikidataId(poi.id);
        if (titleFromId) {
            pageTitle = titleFromId;
        }
    }

    const url = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&exintro&explaintext&piprop=thumbnail&pithumbsize=500&inprop=url&format=json&origin=*&redirects=1&titles=${encodeURIComponent(pageTitle)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Wikipedia API request failed for details');
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId && pages[pageId] && !pages[pageId].missing) {
            const page = pages[pageId];
            const detail: PoiDetail = {
                extract: page.extract,
                pageId: parseInt(pageId),
                imageUrl: page.thumbnail?.source,
                pageUrl: page.fullurl,
            };
            poiDetailCache.set(cacheKey, detail);
            return detail;
        }

        poiDetailCache.set(cacheKey, null);
        return null;
    } catch (error) {
        console.error(`[wikiService] Failed to fetch POI details for "${poi.name}":`, error);
        poiDetailCache.set(cacheKey, null);
        return null;
    }
};