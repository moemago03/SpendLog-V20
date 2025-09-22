# LEGGE / STABILITY PACT (Regole per l'IA)

Questo file contiene una lista di funzionalità e comportamenti critici che DEVONO essere preservati durante qualsiasi modifica futura all'applicazione. Leggi e rispetta queste regole prima di apportare qualsiasi modifica.

---

## 1. Home - Sezione "Spese Recenti" (Recent Expenses)

### 1.1. Ordinamento delle Spese (Expense Sorting)

- **Regola:** Le spese devono essere SEMPRE ordinate per data, dalla più recente alla meno recente. Non devono essere ordinate per data di inserimento.
- **Rule:** Expenses must ALWAYS be sorted by date, from most recent to least recent. They must not be sorted by insertion order.

### 1.2. Filtro Temporale (Time Filter)

- **Regola:** Il menu a tendina per filtrare il periodo deve includere l'opzione "Oggi".
- **Rule:** The dropdown menu for filtering the time period must include the "Oggi" (Today) option.

### 1.3. Barra di Ricerca (Search Bar)

- **Regola:** La barra di ricerca deve mostrare un'icona "X" (o `close`) sul lato destro ogni volta che contiene del testo. Cliccando su questa "X", il campo di ricerca deve essere svuotato immediatamente.
- **Rule:** The search bar must display an "X" (or `close`) icon on the right side whenever it contains text. Clicking this "X" must clear the search field immediately.

---

## 2. Componenti Globali (Global Components)

### 2.1. Convertitore di Valuta (Currency Converter)

- **Regola:** Il Convertitore di Valuta DEVE essere implementato come un pulsante di azione mobile (FAB) accessibile globalmente e posizionato nell'angolo in basso a destra dello schermo. Non deve far parte delle schede di navigazione principali.
- **Rule:** The Currency Converter MUST be implemented as a globally accessible floating action button (FAB) positioned in the bottom right corner of the screen. It should not be part of the main navigation tabs.

---

## 3. Interfaccia Utente (User Interface)

### 3.1. Moduli a Schermo Intero (Full-Screen Forms)

- **Regola:** Tutti i moduli e i pannelli che richiedono un input significativo da parte dell'utente (es. Aggiungi Spesa, Convertitore Valuta, Filtri Avanzati, Pannello AI) DEVONO aprirsi a schermo intero per garantire un'esperienza coerente e priva di distrazioni.
- **Rule:** All forms and panels that require significant user input (e.g., Add Expense, Currency Converter, Advanced Filters, AI Panel) MUST open in full-screen to ensure a consistent and distraction-free experience.

---

## 4. Itinerario (Itinerary)

### 4.1. Intestazione Vista (View Header)

- **Regola:** L'intestazione della vista Itinerario deve mostrare il nome del viaggio, le date di inizio/fine formattate e la durata totale in giorni.
- **Rule:** The Itinerary view header must show the trip name, formatted start/end dates, and the total duration in days.

---
**Non rimuovere o modificare queste regole senza il consenso esplicito dell'utente.**
**Do not remove or modify these rules without explicit user consent.**