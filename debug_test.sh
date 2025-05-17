#!/bin/bash
# Test utilizzando la modalità di debug authentication
set -e  # Interrompi in caso di errore

LOGFILE=debug_test.log
echo "=== CRM FULL-STACK TEST USANDO DEBUG AUTH $(date) ===" > $LOGFILE

BASE="http://localhost:5000/api"

# Test di creazione di una company usando la modalità debug
echo ">> Test modalità debug - creazione company" >> $LOGFILE
response=$(curl -s -X POST "$BASE/companies" \
  -H "Content-Type: application/json" \
  -H "X-Debug-Mode: true" \
  -d '{"name":"Debug Company","email":"debug@example.com","phone":"+391234567890","fullAddress":"Via Debug 123, Milano, Italia","website":"https://debugcompany.com","status":"active"}')

echo "Risposta: $response" >> $LOGFILE

# Controlla se abbiamo un indizio su come attivare la modalità debug
if [[ "$response" == *"debug"* ]]; then
  echo "Modalità debug menzionata nella risposta" >> $LOGFILE
fi

# Se la risposta contiene "debug_token" proviamo a utilizzarlo
if [[ "$response" == *"debug_token"* ]]; then
  debug_token=$(echo $response | grep -o '"debug_token":"[^"]*' | sed 's/"debug_token":"//')
  echo "Debug token trovato: $debug_token" >> $LOGFILE
fi

echo "=== TEST DEBUG COMPLETATO $(date) ===" >> $LOGFILE
echo "Log disponibile in $LOGFILE"