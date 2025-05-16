describe('Branch Module Tests', () => {
  const login = () => {
    // Simula un login bypassando l'UI
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        username: 'admin',
        password: 'admin123'
      }
    }).then((response) => {
      // Verifica che il login sia avvenuto con successo
      expect(response.status).to.eq(200);
      // Salva il token nella localStorage per le future richieste
      localStorage.setItem('token', response.body.token);
    });
  };

  beforeEach(() => {
    // Esegui il login prima di ogni test
    login();
    
    // Intercetta le richieste API delle filiali
    cy.intercept('GET', '/api/branches').as('getBranches');
    cy.intercept('POST', '/api/branches').as('createBranch');
    cy.intercept('PUT', '/api/branches/*').as('updateBranch');
    cy.intercept('DELETE', '/api/branches/*').as('deleteBranch');

    // Intercetta la richiesta delle aziende per il dropdown
    cy.intercept('GET', '/api/companies').as('getCompanies');
    
    // Visita la pagina delle filiali
    cy.visit('/branches');
    cy.wait('@getBranches');
  });

  it('dovrebbe visualizzare la pagina delle filiali con il messaggio iniziale', () => {
    // Verifica il titolo della pagina
    cy.contains('h1', 'Filiali').should('be.visible');
    
    // Verifica il pulsante di aggiunta
    cy.contains('button', 'Aggiungi Filiale').should('be.visible');
    
    // Verifica il campo di ricerca
    cy.get('input[placeholder="Cerca filiali..."]').should('be.visible');
    
    // Verifica il messaggio quando non ci sono filiali
    cy.contains('Nessuna filiale trovata').should('be.visible');
    cy.contains('Inizia aggiungendo la tua prima filiale').should('be.visible');
  });

  it('dovrebbe creare una nuova filiale', () => {
    // Clic sul pulsante per aggiungere una filiale
    cy.contains('button', 'Aggiungi Filiale').click();
    
    // Verifica che il modale si apra
    cy.contains('Aggiungi Filiale').should('be.visible');
    cy.wait('@getCompanies');
    
    // Compila il form
    cy.get('input[name="name"]').type('Filiale Test');
    cy.get('[id^="react-select"]').click(); // Seleziona la prima azienda dal dropdown
    cy.get('[id^="react-select-option"]').first().click();
    cy.get('input[name="address"]').type('Via Test 123');
    cy.get('input[name="city"]').type('Milano');
    cy.get('input[name="postalCode"]').type('20100');
    cy.get('input[name="email"]').type('filiale.test@example.com');
    cy.get('input[name="phone"]').type('02 1234567');
    
    // Salva la filiale
    cy.contains('button', 'Crea Filiale').click();
    cy.wait('@createBranch');
    
    // Verifica che il modale si chiuda e che appaia il toast di conferma
    cy.contains('Filiale creata').should('be.visible');
    
    // Verifica che la nuova filiale appaia nella lista
    cy.wait('@getBranches');
    cy.contains('Filiale Test').should('be.visible');
    cy.contains('Milano').should('be.visible');
  });

  it('dovrebbe modificare una filiale esistente', () => {
    // Assumiamo che ci sia almeno una filiale creata dal test precedente
    cy.get('[data-cy="branch-card"]').first().within(() => {
      cy.get('[data-cy="branch-edit-button"]').click();
    });
    
    // Verifica che il modale di modifica si apra
    cy.contains('Modifica Filiale').should('be.visible');
    
    // Modifica alcuni campi
    cy.get('input[name="name"]').clear().type('Filiale Test Modificata');
    cy.get('input[name="city"]').clear().type('Roma');
    
    // Salva le modifiche
    cy.contains('button', 'Aggiorna Filiale').click();
    cy.wait('@updateBranch');
    
    // Verifica che il modale si chiuda e che appaia il toast di conferma
    cy.contains('Filiale aggiornata').should('be.visible');
    
    // Verifica che la filiale aggiornata appaia nella lista
    cy.wait('@getBranches');
    cy.contains('Filiale Test Modificata').should('be.visible');
    cy.contains('Roma').should('be.visible');
  });

  it('dovrebbe visualizzare i dettagli di una filiale', () => {
    // Clic sul pulsante per vedere i dettagli
    cy.get('[data-cy="branch-view-button"]').first().click();
    
    // Verifica che la pagina di dettaglio si carichi
    cy.url().should('include', '/branches/');
    cy.contains('Informazioni Filiale').should('be.visible');
    
    // Verifica che i dettagli siano visualizzati
    cy.contains('Filiale Test Modificata').should('be.visible');
    cy.contains('Roma').should('be.visible');
    
    // Verifica la presenza del pulsante di modifica
    cy.contains('button', 'Modifica Filiale').should('be.visible');
  });

  it('dovrebbe eliminare una filiale', () => {
    // Intercetta la finestra di conferma
    cy.on('window:confirm', () => true);
    
    // Clic sul dropdown e poi sul pulsante elimina
    cy.get('[data-cy="branch-card"]').first().within(() => {
      cy.get('[data-cy="branch-menu-button"]').click();
    });
    cy.contains('Elimina Filiale').click();
    
    // Attendi la richiesta di eliminazione
    cy.wait('@deleteBranch');
    
    // Verifica che la filiale non sia più presente
    cy.wait('@getBranches');
    cy.contains('Filiale Test Modificata').should('not.exist');
  });

  it('dovrebbe validare correttamente i campi del form', () => {
    // Clic sul pulsante per aggiungere una filiale
    cy.contains('button', 'Aggiungi Filiale').click();
    
    // Prova a salvare senza inserire il nome (campo obbligatorio)
    cy.contains('button', 'Crea Filiale').click();
    
    // Verifica che compaia il messaggio di errore
    cy.contains('Il nome è obbligatorio').should('be.visible');
    
    // Inserisci un'email non valida
    cy.get('input[name="email"]').type('email-non-valida');
    cy.contains('button', 'Crea Filiale').click();
    
    // Verifica che compaia il messaggio di errore per l'email
    cy.contains('Email non valida').should('be.visible');
    
    // Chiudi il modale
    cy.contains('button', 'Annulla').click();
  });
});