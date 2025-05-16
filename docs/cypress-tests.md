# Test End-to-End con Cypress

Questo documento descrive come eseguire i test end-to-end per il modulo Branch (Filiali) di Experviser CRM.

## Prerequisiti

- Assicurarsi che l'applicazione sia in esecuzione (`npm run dev`)
- Cypress è già installato come dipendenza di sviluppo

## Esecuzione dei test

Per eseguire i test con l'interfaccia Cypress:

```bash
npx cypress open
```

Per eseguire i test in modalità headless (senza interfaccia grafica):

```bash
npx cypress run
```

## Test implementati

I test end-to-end per il modulo Branch verificano:

1. **Visualizzazione pagina iniziale**
   - Verifica che la pagina delle filiali si carichi correttamente
   - Controlla la presenza dei componenti principali (titolo, pulsante di aggiunta, campo di ricerca)
   - Verifica lo stato iniziale con messaggio "Nessuna filiale trovata"

2. **Creazione di una nuova filiale**
   - Apre il modale di creazione
   - Compila tutti i campi richiesti (inclusi profili social LinkedIn e Instagram)
   - Salva la filiale e verifica che appaia nella lista

3. **Modifica di una filiale esistente**
   - Seleziona una filiale esistente
   - Modifica i campi principali
   - Salva le modifiche e verifica l'aggiornamento nella lista

4. **Visualizzazione dettagli di una filiale**
   - Naviga alla pagina di dettaglio di una filiale
   - Verifica che tutti i dati vengano visualizzati correttamente

5. **Eliminazione di una filiale**
   - Trova una filiale esistente
   - Esegue l'operazione di eliminazione
   - Verifica che la filiale venga rimossa dalla lista

6. **Validazione dei campi del form**
   - Testa i requisiti di validazione (campi obbligatori, formati email, URL LinkedIn e Instagram, ecc.)
   - Verifica i messaggi di errore per tutti i campi, compresi quelli per i profili social

## Struttura dei test

I test sono organizzati nel file `cypress/e2e/branches.spec.ts` e seguono le best practice di Cypress:

- Utilizzo di `cy.intercept()` per intercettare e monitorare le chiamate API
- Simulazione del flusso utente (clic, inserimento testo, ecc.)
- Assertions per verificare lo stato dell'applicazione dopo ogni azione

## Personalizzazione dei test

Per adattare i test alle specifiche esigenze del tuo ambiente:

- Modifica la funzione `login()` se utilizzi un sistema di autenticazione diverso
- Aggiorna i selettori CSS/data-attributes se la struttura HTML è cambiata
- Aggiungi nuovi test per coprire casi edge o funzionalità aggiuntive