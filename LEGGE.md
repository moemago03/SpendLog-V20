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
