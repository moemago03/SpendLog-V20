# API Richieste per la Pubblicazione

Questo file documenta le API esterne necessarie per il funzionamento completo dell'applicazione in un ambiente di produzione.

## 1. Google Gemini API

- **Scopo:** Utilizzata per tutte le funzionalità di intelligenza artificiale, tra cui:
  - Generazione di itinerari (`AIItineraryGenerator.tsx`).
  - Analisi e previsioni delle spese (`AIInsights.tsx`, `AIForecast.tsx`).
  - Aggiunta rapida di spese tramite linguaggio naturale (`QuickExpense.tsx`).
- **Endpoint:** `@google/genai` SDK.
- **Modelli usati:** `gemini-2.5-flash`.
- **Stato attuale:** **Attiva** (richiede una `API_KEY` valida nell'ambiente di esecuzione).

## 2. OpenStreetMap APIs (via Leaflet.js)

- **Scopo:** Fornire mappe interattive e dati geografici.
  - **Tile Server:** Utilizzato da Leaflet.js per visualizzare le mattonelle della mappa. L'URL predefinito `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` è usato in tutta l'app.
  - **Nominatim Geocoding:** Utilizzato per convertire indirizzi testuali (es. "Colosseo, Roma") in coordinate geografiche (latitudine/longitudine) per posizionare i marcatori sulla mappa.
- **Componenti interessati:** `MapView.tsx`, `MultiPointMapView.tsx`, e di conseguenza `ItineraryMapView.tsx` e `ExpenseMapView.tsx`.
- **Stato attuale:** **Attiva**. Non richiede una API key, ma è soggetta a una policy di utilizzo equo.

## 3. API Meteo (Open-Meteo)

- **Scopo:** Fornire previsioni meteo giornaliere reali per le date selezionate nell'itinerario.
- **Endpoint:** `api.open-meteo.com`.
- **Stato attuale:** **Attiva**. Utilizza l'API di Open-Meteo, che non richiede chiave per uso base, per recuperare i dati meteorologici.

## 4. API Tassi di Cambio (Es. exchangerate-api.com)

- **Scopo:** Fornire tassi di cambio valutari in tempo reale per il convertitore e per i calcoli del budget.
- **Endpoint:** Da definire (es. `v6.exchangerate-api.com`).
- **Stato attuale:** **Simulata**. I tassi di cambio sono attualmente basati su valori statici definiti in `constants.ts` e gestiti tramite `CurrencyContext.tsx`.