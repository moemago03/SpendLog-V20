// services/poiService.ts
import { geocodeLocation } from './mapService';

export interface Poi {
    id: string; // Wikidata Q identifier (e.g., "Q83737")
    name: string;
    lat?: number;
    lon?: number;
    imageUrl?: string;
}

const poiCache = new Map<string, Poi[]>();
const FETCH_TIMEOUT = 8000; // 8 seconds

/**
 * Fetches high-quality Points of Interest (POIs) for a city using Wikidata.
 * It specifically looks for notable places like museums, monuments, and parks
 * that have an associated Italian or English Wikipedia page, ensuring relevance.
 * @param cityName The name of the city.
 * @returns A promise that resolves to an array of high-quality POIs.
 */
export const fetchPoisForCity = async (cityName: string): Promise<Poi[]> => {
    // RIABILITARE API WIKI: Rimuovere la riga sottostante per riattivare la ricerca di POI.
    return [];

    const normalizedCity = cityName.toLowerCase().trim();
    if (poiCache.has(normalizedCity)) {
        return poiCache.get(normalizedCity)!;
    }

    const cityCoords = await geocodeLocation(cityName);
    if (!cityCoords) {
        console.error(`[poiService] Could not geocode city: ${cityName}`);
        poiCache.set(normalizedCity, []);
        return [];
    }
    
    // SPARQL query to find notable tourist attractions (museums, monuments, parks, etc.)
    // with a Wikipedia page, prioritizing Italian and English names.
    const sparqlQuery = `
        SELECT ?item ?itemLabel ?itemDescription ?coords ?image (MIN(?sitelink) AS ?sitelink_it)
        WHERE {
          SERVICE wikibase:around {
            ?item wdt:P625 ?coords .
            bd:serviceParam wikibase:center "Point(${cityCoords.lon} ${cityCoords.lat})"^^geo:wktLiteral .
            bd:serviceParam wikibase:radius "10" . # 10 km radius
          }
          
          # Filter for specific types of tourist attractions
          VALUES ?type {
            wd:Q33506     # museum
            wd:Q4989906    # monument
            wd:Q22698      # park
            wd:Q811979     # landmark
            wd:Q16560      # palace
            wd:Q483110     # castle
            wd:Q12518      # cathedral
            wd:Q16970      # church building
            wd:Q570116     # archaeological site
          }
          ?item wdt:P31 ?type .
          
          # Ensure it has an Italian Wikipedia page to guarantee notability
          ?sitelink schema:about ?item;
            schema:inLanguage "it";
            schema:isPartOf <https://it.wikipedia.org/>.
          
          OPTIONAL { ?item wdt:P18 ?image . }
          
          SERVICE wikibase:label { bd:serviceParam wikibase:language "it,en". }
        }
        GROUP BY ?item ?itemLabel ?itemDescription ?coords ?image
        LIMIT 50
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/sparql-results+json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Wikidata query failed with status ${response.status}`);
        }
        const data = await response.json();

        const pois: Poi[] = data.results.bindings.map((binding: any): Poi => {
            const wikidataUrl = binding.item.value;
            const qId = wikidataUrl.substring(wikidataUrl.lastIndexOf('/') + 1);
            
            // Construct a usable image URL from the Wikimedia Commons URL
            let imageUrl: string | undefined = undefined;
            if (binding.image?.value) {
                const filename = binding.image.value.substring(binding.image.value.lastIndexOf('/') + 1);
                imageUrl = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(decodeURIComponent(filename))}&width=400`;
            }

            return {
                id: qId,
                name: binding.itemLabel.value,
                imageUrl: imageUrl,
            };
        });

        poiCache.set(normalizedCity, pois);
        return pois;
        
    } catch (error: any) {
        clearTimeout(timeoutId);
         if (error.name === 'AbortError') {
             console.error('[poiService] Wikidata request for POIs timed out.');
        } else {
            console.error('[poiService] Failed to fetch POIs from Wikidata:', error);
        }
        return [];
    }
};