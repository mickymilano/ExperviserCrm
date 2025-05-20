import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Help topics array - these could be loaded from API in a future update
  const helpTopics = [
    {
      id: 1,
      category: 'Generale',
      title: 'Come iniziare con EXPERVISER CRM',
      content: `
        <p>Benvenuto in EXPERVISER CRM! Ecco alcuni passi per iniziare:</p>
        <ol>
          <li>Esplora la dashboard per una panoramica dei tuoi dati</li>
          <li>Aggiungi contatti e aziende per iniziare a costruire il tuo network</li>
          <li>Crea opportunità di business tramite la sezione Deals</li>
          <li>Utilizza la gestione Lead per potenziali clienti</li>
          <li>Scopri le Sinergie per sfruttare al meglio le tue relazioni di business</li>
        </ol>
      `,
    },
    {
      id: 2,
      category: 'Contatti',
      title: 'Gestione dei contatti',
      content: `
        <p>La sezione Contatti ti permette di:</p>
        <ul>
          <li>Registrare informazioni dettagliate su ogni contatto</li>
          <li>Associare contatti ad aziende</li>
          <li>Gestire email multiple per contatto con indicazione della email primaria</li>
          <li>Monitorare la storia delle comunicazioni</li>
          <li>Organizzare i contatti con tag personalizzati</li>
        </ul>
      `,
    },
    {
      id: 3,
      category: 'Aziende',
      title: 'Gestione delle aziende',
      content: `
        <p>Nella sezione Aziende puoi:</p>
        <ul>
          <li>Registrare informazioni complete sulle aziende</li>
          <li>Vedere tutti i contatti associati a un'azienda</li>
          <li>Monitorare le opportunità di business legate all'azienda</li>
          <li>Tenere traccia di note e attività relative all'azienda</li>
        </ul>
      `,
    },
    {
      id: 4,
      category: 'Opportunità',
      title: 'Gestione delle opportunità (Deals)',
      content: `
        <p>La sezione Deals ti aiuta a:</p>
        <ul>
          <li>Tracciare le tue opportunità di business attraverso un pipeline visuale</li>
          <li>Monitorare lo stato di avanzamento di ogni deal</li>
          <li>Calcolare il valore delle opportunità e previsioni di chiusura</li>
          <li>Associare deals a contatti, aziende e sinergie</li>
        </ul>
      `,
    },
    {
      id: 5,
      category: 'Lead',
      title: 'Gestione dei lead',
      content: `
        <p>Con la sezione Lead puoi:</p>
        <ul>
          <li>Registrare e qualificare potenziali clienti</li>
          <li>Monitorare la progressione dei lead nel processo di vendita</li>
          <li>Convertire lead in contatti quando approprato</li>
          <li>Gestire le attività di follow-up</li>
        </ul>
      `,
    },
    {
      id: 6,
      category: 'Sinergie',
      title: 'Cosa sono le sinergie e come utilizzarle',
      content: `
        <p>Le Sinergie in EXPERVISER CRM rappresentano connessioni strategiche tra:</p>
        <ul>
          <li>Contatti e aziende che hanno relazioni professionali</li>
          <li>Opportunità di business che coinvolgono più entità</li>
          <li>Network professionali che possono essere attivati per specifici scopi</li>
        </ul>
        <p>Le sinergie ti permettono di visualizzare e sfruttare strategicamente la rete di relazioni nel tuo CRM.</p>
      `,
    },
    {
      id: 7,
      category: 'Email',
      title: 'Gestione delle email',
      content: `
        <p>La funzionalità email ti consente di:</p>
        <ul>
          <li>Gestire fino a 4 account email differenti</li>
          <li>Inviare email direttamente dal CRM</li>
          <li>Associare email a contatti, aziende e opportunità</li>
          <li>Utilizzare template personalizzati</li>
          <li>Impostare firme diverse per ogni account</li>
        </ul>
      `,
    },
    {
      id: 8,
      category: 'Calendario',
      title: 'Utilizzo del calendario',
      content: `
        <p>Il calendario integrato ti permette di:</p>
        <ul>
          <li>Pianificare appuntamenti e meeting</li>
          <li>Collegare eventi a contatti, aziende e opportunità</li>
          <li>Ricevere notifiche per eventi imminenti</li>
          <li>Visualizzare gli impegni in diverse modalità (giorno, settimana, mese)</li>
        </ul>
      `,
    }
  ];

  // Filter topics based on search query
  const filteredTopics = searchQuery
    ? helpTopics.filter(topic => 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        topic.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : helpTopics;

  return (
    <div className="container py-6 max-w-5xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro Assistenza</h1>
          <p className="text-muted-foreground mt-2">
            Trova risposte e guide su come utilizzare al meglio EXPERVISER CRM
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Cerca nella documentazione..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar - categories */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-lg shadow p-4">
              <h3 className="font-medium text-lg mb-3">Categorie</h3>
              <nav className="space-y-1">
                {Array.from(new Set(helpTopics.map(t => t.category))).map(category => (
                  <button
                    key={category}
                    className="text-left block w-full px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setSearchQuery(category)}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main content - help topics */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-lg shadow p-4">
              <h3 className="font-medium text-lg mb-3">
                {searchQuery ? `Risultati per: "${searchQuery}"` : 'Argomenti principali'}
              </h3>
              
              {filteredTopics.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Nessun risultato trovato per "{searchQuery}".
                  </p>
                  <button 
                    className="mt-2 text-primary hover:underline"
                    onClick={() => setSearchQuery('')}
                  >
                    Cancella la ricerca
                  </button>
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredTopics.map(topic => (
                    <AccordionItem key={topic.id} value={topic.id.toString()} className="border rounded-md px-4">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="text-left">
                          <div className="text-sm text-muted-foreground">{topic.category}</div>
                          <div className="font-medium">{topic.title}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div dangerouslySetInnerHTML={{ __html: topic.content }} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}