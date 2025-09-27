# Patto di Stabilità Funzionalità (LEGGE)

Questo documento serve a "mettere nero su bianco" le funzionalità chiave dell'applicazione che sono state ritenute essenziali dall'utente e che non devono essere rimosse o modificate sostanzialmente senza una discussione esplicita.

## Pagina Piano (Plan Page)

Le seguenti funzionalità della pagina "Plan" sono considerate fondamentali e devono essere sempre presenti e facilmente accessibili:

1.  **Controlli `+` e `-` per le Notti:** Ogni tappa del viaggio deve avere controlli interattivi (come pulsanti `+` e `-`) per aumentare o diminuire rapidamente il numero di notti. La modifica deve aggiornare automaticamente le date delle tappe successive.

2.  **Riepilogo Notti:** Un contatore ben visibile deve mostrare il totale delle notti pianificate rispetto al totale delle notti disponibili per il viaggio (es. "12 / 15 notti").

3.  **Pulsante "Parametri Alloggio":** Deve esserci un pulsante o un link chiaramente identificabile per accedere alla schermata dei filtri per la ricerca degli alloggi.

## Autenticazione (Login)

1.  **Stato Attuale:** Il sistema di login, precedentemente disabilitato per facilitare lo sviluppo, è **in fase di riattivazione**. Stiamo implementando l'accesso tramite account Google.
2.  **Requisito Futuro:** Il sistema di login deve essere pienamente operativo per garantire la sicurezza e la privacy dei dati utente.

## Funzionalità AI (Google Gemini)

1.  **Stato Attuale:** Le funzionalità basate su Intelligenza Artificiale (come analisi, previsioni, generazione di itinerari e checklist) sono **attive e operative**.
2.  **Configurazione:** Utilizzano una Chiave API gestita tramite variabili d'ambiente (`.env.production`) e configurata per accettare richieste esclusivamente dal dominio di produzione.

---

## Architettura e Configurazioni Chiave

Questa sezione documenta decisioni architetturali e passaggi di configurazione non standard che sono vitali per la manutenibilità e la ricostruzione del progetto.

### 1. Configurazione Google Sign-In (Android)

Per far funzionare l'autenticazione Google su Android, sono necessari due passaggi manuali che non sono tracciati da Git:

- **Keystore:** È necessario generare un file `debug.keystore` (o usare quello esistente) per ottenere una firma digitale **SHA-1**.
- **`google-services.json`**: Questo file, generato dalla console Firebase/Google Cloud, deve essere ottenuto registrando l'app Android (`com.spendilog.app`) e la sua firma SHA-1. Il file deve essere posizionato in `android/app/google-services.json`.

**ATTENZIONE:** Senza questo file, la build Android non potrà autenticarsi con Google, anche se compila con successo.

### 2. Sistema di Routing Personalizzato

L'applicazione **non utilizza un router standard** come `react-router` o `IonRouterOutlet`. La navigazione all'interno dell'app autenticata è gestita da un sistema personalizzato basato sullo stato di React, che si trova in `App.tsx`.

- **Componente Principale:** `AuthenticatedApp` in `App.tsx`.
- **Logica di Routing:** La variabile di stato `currentView` determina quale componente principale visualizzare (`Dashboard`, `ItineraryView`, `ProfileScreen`, etc.).
- **Aggiungere una Vista:** Per aggiungere una nuova schermata principale, è necessario modificare il tipo `AppView` (in `types.ts`) e aggiungere la nuova vista all'oggetto `mainViews` nella funzione `renderContent` di `AuthenticatedApp`.

### 3. Implementazione della Privacy Policy

La pagina della Privacy Policy è implementata con una logica di rendering condizionale direttamente in `App.tsx`.

- **Attivazione:** Un link nella `LoginScreen.tsx` imposta lo stato `showingPrivacy` a `true` nel componente `App`.
- **Visualizzazione:** Quando `showingPrivacy` è `true`, l'intero flusso dell'app viene sostituito dal componente `PrivacyPolicy`.
- **Uscita:** Il componente `PrivacyPolicy` riceve una funzione `onBack` che reimposta lo stato `showingPrivacy` a `false`, riportando l'utente alla schermata di login.

### 4. Convenzioni UI/UX

Per mantenere un'esperienza utente coerente e un aspetto nativo, si è deciso di preferire i componenti dell'interfaccia utente forniti da Ionic.

- **Esempio:** I dialoghi di conferma (alert) devono essere implementati utilizzando l'hook `useIonAlert` da `@ionic/react` invece della funzione `window.confirm()` del browser. Questo garantisce che i dialoghi abbiano lo stesso stile del resto dell'applicazione.
