import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle, isNotionConfigured } from "./notion";

// Verifica se le variabili d'ambiente sono impostate
if (!isNotionConfigured()) {
    console.log("Configurazione Notion incompleta. Imposta NOTION_INTEGRATION_SECRET e NOTION_PAGE_URL nelle variabili d'ambiente.");
    process.exit(0);
}

// Funzione per configurare i database Notion per il CRM
async function setupNotionDatabases() {
    try {
        console.log("Inizializzazione database Notion...");

        // Database Contatti
        await createDatabaseIfNotExists("Contatti", {
            Nome: {
                title: {}
            },
            Cognome: {
                rich_text: {}
            },
            Email: {
                email: {}
            },
            Telefono: {
                phone_number: {}
            },
            Ruolo: {
                rich_text: {}
            },
            Azienda: {
                rich_text: {}
            },
            Note: {
                rich_text: {}
            },
            UltimoContatto: {
                date: {}
            },
            Stato: {
                select: {
                    options: [
                        { name: "Attivo", color: "green" },
                        { name: "Inattivo", color: "gray" },
                        { name: "Lead", color: "blue" },
                        { name: "Cliente", color: "purple" }
                    ]
                }
            }
        });

        // Database Aziende
        await createDatabaseIfNotExists("Aziende", {
            Nome: {
                title: {}
            },
            Email: {
                email: {}
            },
            Telefono: {
                phone_number: {}
            },
            Indirizzo: {
                rich_text: {}
            },
            Settore: {
                select: {
                    options: [
                        { name: "Tecnologia", color: "blue" },
                        { name: "Finanza", color: "green" },
                        { name: "Manifatturiero", color: "orange" },
                        { name: "Servizi", color: "purple" },
                        { name: "Altro", color: "gray" }
                    ]
                }
            },
            Dimensione: {
                select: {
                    options: [
                        { name: "1-10", color: "blue" },
                        { name: "11-50", color: "green" },
                        { name: "51-200", color: "yellow" },
                        { name: "201-500", color: "orange" },
                        { name: "500+", color: "red" }
                    ]
                }
            },
            AnnoFondazione: {
                number: {}
            },
            SitoWeb: {
                url: {}
            },
            Note: {
                rich_text: {}
            }
        });

        // Database Opportunità
        await createDatabaseIfNotExists("Opportunità", {
            Nome: {
                title: {}
            },
            Valore: {
                number: {
                    format: "euro"
                }
            },
            Azienda: {
                rich_text: {}
            },
            Contatto: {
                rich_text: {}
            },
            Fase: {
                select: {
                    options: [
                        { name: "Lead", color: "blue" },
                        { name: "Qualificato", color: "green" },
                        { name: "Proposta", color: "yellow" },
                        { name: "Negoziazione", color: "orange" },
                        { name: "Vinta", color: "purple" },
                        { name: "Persa", color: "red" }
                    ]
                }
            },
            DataCreazione: {
                date: {}
            },
            DataChiusuraPrevista: {
                date: {}
            },
            Stato: {
                select: {
                    options: [
                        { name: "Attiva", color: "green" },
                        { name: "Vinta", color: "blue" },
                        { name: "Persa", color: "red" },
                        { name: "Sospesa", color: "gray" }
                    ]
                }
            },
            Note: {
                rich_text: {}
            }
        });

        console.log("Database Notion inizializzati con successo.");

    } catch (error) {
        console.error("Errore nell'inizializzazione dei database Notion:", error);
        throw error;
    }
}

// Funzione per creare dati di esempio
async function createSampleData() {
    try {
        console.log("Creazione dati di esempio in Notion...");

        // Ottieni i database 
        const contattiDb = await findDatabaseByTitle("Contatti");
        const aziendeDb = await findDatabaseByTitle("Aziende");
        const opportunitaDb = await findDatabaseByTitle("Opportunità");

        if (!contattiDb || !aziendeDb || !opportunitaDb) {
            throw new Error("Impossibile trovare i database richiesti.");
        }

        // Esempio di azienda
        const aziendaResponse = await notion.pages.create({
            parent: {
                database_id: aziendeDb.id
            },
            properties: {
                Nome: {
                    title: [
                        {
                            text: {
                                content: "Tech Solutions Italia"
                            }
                        }
                    ]
                },
                Email: {
                    email: "info@techsolutionsitalia.it"
                },
                Telefono: {
                    phone_number: "+39 02 1234567"
                },
                Indirizzo: {
                    rich_text: [
                        {
                            text: {
                                content: "Via Roma 123, Milano"
                            }
                        }
                    ]
                },
                Settore: {
                    select: {
                        name: "Tecnologia"
                    }
                },
                Dimensione: {
                    select: {
                        name: "11-50"
                    }
                },
                AnnoFondazione: {
                    number: 2010
                },
                SitoWeb: {
                    url: "https://www.techsolutionsitalia.it"
                },
                Note: {
                    rich_text: [
                        {
                            text: {
                                content: "Azienda specializzata in soluzioni cloud per PMI."
                            }
                        }
                    ]
                }
            }
        });

        // Esempio di contatto
        const contattoResponse = await notion.pages.create({
            parent: {
                database_id: contattiDb.id
            },
            properties: {
                Nome: {
                    title: [
                        {
                            text: {
                                content: "Marco"
                            }
                        }
                    ]
                },
                Cognome: {
                    rich_text: [
                        {
                            text: {
                                content: "Rossi"
                            }
                        }
                    ]
                },
                Email: {
                    email: "marco.rossi@techsolutionsitalia.it"
                },
                Telefono: {
                    phone_number: "+39 345 1234567"
                },
                Ruolo: {
                    rich_text: [
                        {
                            text: {
                                content: "CTO"
                            }
                        }
                    ]
                },
                Azienda: {
                    rich_text: [
                        {
                            text: {
                                content: "Tech Solutions Italia"
                            }
                        }
                    ]
                },
                Stato: {
                    select: {
                        name: "Cliente"
                    }
                },
                UltimoContatto: {
                    date: {
                        start: new Date().toISOString()
                    }
                }
            }
        });

        // Esempio di opportunità
        await notion.pages.create({
            parent: {
                database_id: opportunitaDb.id
            },
            properties: {
                Nome: {
                    title: [
                        {
                            text: {
                                content: "Migrazione Cloud Azure"
                            }
                        }
                    ]
                },
                Valore: {
                    number: 25000
                },
                Azienda: {
                    rich_text: [
                        {
                            text: {
                                content: "Tech Solutions Italia"
                            }
                        }
                    ]
                },
                Contatto: {
                    rich_text: [
                        {
                            text: {
                                content: "Marco Rossi"
                            }
                        }
                    ]
                },
                Fase: {
                    select: {
                        name: "Proposta"
                    }
                },
                DataCreazione: {
                    date: {
                        start: new Date().toISOString()
                    }
                },
                DataChiusuraPrevista: {
                    date: {
                        start: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString()
                    }
                },
                Stato: {
                    select: {
                        name: "Attiva"
                    }
                }
            }
        });

        console.log("Dati di esempio creati con successo in Notion.");

    } catch (error) {
        console.error("Errore nella creazione dei dati di esempio:", error);
    }
}

// Esegui la configurazione
if (require.main === module) {
    setupNotionDatabases()
        .then(() => createSampleData())
        .then(() => {
            console.log("Setup Notion completato!");
            process.exit(0);
        })
        .catch(error => {
            console.error("Setup Notion fallito:", error);
            process.exit(1);
        });
}

export { setupNotionDatabases, createSampleData };