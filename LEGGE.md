# Patto di Stabilità Funzionalità (LEGGE)

Questo documento serve a "mettere nero su bianco" le funzionalità chiave dell'applicazione che sono state ritenute essenziali dall'utente e che non devono essere rimosse o modificate sostanzialmente senza una discussione esplicita.

## Pagina Piano (Plan Page)

Le seguenti funzionalità della pagina "Plan" sono considerate fondamentali e devono essere sempre presenti e facilmente accessibili:

1.  **Controlli `+` e `-` per le Notti:** Ogni tappa del viaggio deve avere controlli interattivi (come pulsanti `+` e `-`) per aumentare o diminuire rapidamente il numero di notti. La modifica deve aggiornare automaticamente le date delle tappe successive.

2.  **Riepilogo Notti:** Un contatore ben visibile deve mostrare il totale delle notti pianificate rispetto al totale delle notti disponibili per il viaggio (es. "12 / 15 notti").

3.  **Pulsante "Parametri Alloggio":** Deve esserci un pulsante o un link chiaramente identificabile per accedere alla schermata dei filtri per la ricerca degli alloggi.

## Autenticazione (Login)

1.  **Stato Attuale:** La schermata di login è **temporaneamente disabilitata** per semplificare lo sviluppo e i test. L'applicazione utilizza un utente predefinito per caricare i dati.
2.  **Requisito Futuro:** Il sistema di login **deve essere riattivato** prima della pubblicazione (live/produzione) per garantire la sicurezza e la privacy dei dati utente.

## API Disabilitate in Sviluppo

Per migliorare le prestazioni e la velocità di sviluppo in ambienti come Google Studio, le seguenti API esterne sono state temporaneamente disabilitate. Prima di passare in produzione, è **fondamentale** riabilitarle seguendo le istruzioni fornite.

### 1. Google Gemini API (Intelligenza Artificiale)

- **Scopo:** Funzionalità AI come analisi, previsioni, generazione di itinerari e checklist, aggiunta rapida di spese, scansione ricevute.
- **Stato:** Disabilitata.
- **Come riabilitare:** In ogni file elencato di seguito, cercare il commento `// RIABILITARE API GEMINI` e rimuovere la linea di codice `return;` o il blocco di codice che impedisce l'esecuzione della chiamata API.
- **File interessati:**
  - `components/AIForecast.tsx` (in `generateForecast`)
  - `components/AIInsights.tsx` (in `generateInsights`)
  - `components/checklist/AIChecklistGenerator.tsx` (in `handleGenerate`)
  - `components/itinerary/AIItineraryGenerator.tsx` (in `handleGenerate`)
  - `components/itinerary/TravelTimeEstimator.tsx` (in `fetchTravelTime`)
  - `components/QuickExpense.tsx` (in `handleAddExpense`)
  - `components/ReceiptScanner.tsx` (in `handleCapture`)

### 2. API Geografiche (OpenStreetMap/Nominatim)

- **Scopo:** Convertire indirizzi in coordinate per visualizzare le mappe.
- **Stato:** Disabilitata (utilizza solo dati mock interni).
- **Come riabilitare:** Nel file `services/mapService.ts`, cercare il commento `// RIABILITARE API GEOGRAFICHE` e decommentare il blocco `try...catch` che contiene la chiamata `fetch` a Nominatim.
- **File interessato:**
  - `services/mapService.ts` (in `geocodeLocation`)

### 3. API Meteo (Open-Meteo)

- **Scopo:** Fornire previsioni meteo per l'itinerario.
- **Stato:** Disabilitata.
- **Come riabilitare:** Nel file `components/itinerary/ItineraryView.tsx`, cercare il commento `// RIABILITARE API METEO` all'interno della funzione `fetchWeatherData` e rimuovere la riga `setWeatherData(new Map()); return;`.
- **File interessato:**
  - `components/itinerary/ItineraryView.tsx` (in `useEffect` -> `fetchWeatherData`)

### 4. API Wiki (Wikipedia, Wikidata, Wikivoyage)

- **Scopo:** Recuperare informazioni su città, punti di interesse e guide di viaggio.
- **Stato:** Disabilitate.
- **Come riabilitare:** In ogni file di servizio elencato, cercare il commento `// RIABILITARE API WIKI` e rimuovere la riga `return ...;` che impedisce l'esecuzione della chiamata `fetch`.
- **File interessati:**
  - `services/guideService.ts` (in `fetchGuidesForCity`)
  - `services/poiService.ts` (in `fetchPoisForCity`)
  - `services/wikiService.ts` (in `fetchCityInfo`, `getWikipediaTitleFromWikidataId`, `fetchPoiDetails`)
