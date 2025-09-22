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

## 2. Google Maps Static API

- **Scopo:** Utilizzata per visualizzare mappe statiche (non interattive) per singole o multiple location.
  - Mappa per un singolo luogo (`MapView.tsx`).
  - Mappa con il percorso di più eventi (`MultiPointMapView.tsx`).
- **Endpoint:** `https://maps.googleapis.com/maps/api/staticmap`.
- **Stato attuale:** **Attiva** (richiede una `API_KEY` valida che sia abilitata anche per l'API Maps Static).

## 3. API Meteo (Es. OpenWeatherMap, WeatherAPI)

- **Scopo:** Fornire previsioni meteo giornaliere reali per le date selezionate nell'itinerario.
- **Endpoint:** Da definire (es. `api.openweathermap.org`).
- **Stato attuale:** **Simulata**. Attualmente, viene mostrato un meteo generato casualmente in `ItineraryView.tsx`. Sarà necessario sostituire la funzione di simulazione con una vera chiamata API.

## 4. API Tassi di Cambio (Es. exchangerate-api.com)

- **Scopo:** Fornire tassi di cambio valutari in tempo reale per il convertitore e per i calcoli del budget.
- **Endpoint:** Da definire (es. `v6.exchangerate-api.com`).
- **Stato attuale:** **Simulata**. I tassi di cambio sono attualmente basati su valori statici definiti in `constants.ts` e gestiti tramite `CurrencyContext.tsx`.
