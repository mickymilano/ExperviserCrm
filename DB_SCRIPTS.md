# Script di Gestione Database per EXPERVISER CRM

Questo documento descrive gli script disponibili per la gestione del database nel progetto EXPERVISER CRM.

## Script Disponibili

### Seeding del Database (`./db-seed.sh`)

Lo script `db-seed.sh` popola il database con dati di esempio per:
- Utenti (superadmin e utente test)
- Fasi della pipeline
- Aziende
- Contatti
- Email dei contatti
- Associazioni tra contatti e aziende
- Lead
- Deal
- Sinergie

**Uso:**
```bash
./db-seed.sh
```

### Reset del Database (`./db-reset.sh`)

Lo script `db-reset.sh` resetta completamente il database, eliminando tutte le tabelle e i dati.

**Uso:**
```bash
./db-reset.sh
```

**Nota:** Dopo aver eseguito questo script, sarà necessario riavviare il server e poi eseguire `./db-seed.sh` per ripopolare il database.

## Struttura delle relazioni nel database

Il database ha la seguente struttura di relazioni:

1. **Contatti e Aziende**: relazione molti-a-molti tramite la tabella `areas_of_activity`
   - Un contatto può lavorare per più aziende con ruoli diversi
   - Un'azienda può avere molti contatti

2. **Email e Contatti**: relazione uno-a-molti
   - Un contatto può avere più email di tipi diversi
   - Ogni email è associata a un solo contatto

3. **Deal, Contatti e Aziende**:
   - Un deal è associato a un contatto e un'azienda
   - Il contatto e l'azienda possono essere coinvolti in più deal

4. **Sinergie, Deal, Contatti e Aziende**:
   - Una sinergia collega un deal, un contatto e un'azienda
   - Rappresenta l'opportunità di business che coinvolge tutte e tre le entità