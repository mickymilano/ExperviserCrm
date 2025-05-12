#!/bin/bash

# Script per resettare e popolare il database
echo "Attenzione: questo script resetterà il database e cancellerà tutti i dati!"
read -p "Sei sicuro di voler procedere? (y/n): " confirmation

if [[ $confirmation != "y" && $confirmation != "Y" ]]; then
    echo "Operazione annullata."
    exit 0
fi

echo "Esecuzione dello script di reset del database..."

# Pulizia completa del database
psql $DATABASE_URL -c "
DROP TABLE IF EXISTS synergies CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS areas_of_activity CASCADE;
DROP TABLE IF EXISTS contact_emails CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
"

# Reinizializzazione tabelle (il server le ricreerà automaticamente)
echo "Le tabelle sono state eliminate. Al prossimo riavvio del server verranno ricreate."

# Riavvio del server per ricreare le tabelle
echo "Dopo il riavvio del server, esegui ./db-seed.sh per popolare il database con i dati di esempio."