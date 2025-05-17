#!/bin/bash
# Test specifico per le sinergie
set -e  # Interrompi in caso di errore

LOGFILE=synergy_test.log
echo "=== TEST SINERGIE $(date) ===" > $LOGFILE

BASE="http://localhost:5000/api"
TODAY=$(date +"%Y-%m-%d")

# Test di creazione di una sinergia usando il formato corretto
echo ">> Test creazione sinergia - formato corretto" >> $LOGFILE
PAYLOAD="{\"contactId\":21,\"companyId\":9,\"type\":\"Leadership\",\"description\":\"Sinergia di test automatico\",\"status\":\"Active\",\"startDate\":\"$TODAY\",\"dealId\":5}"
echo "Payload: $PAYLOAD" >> $LOGFILE

response=$(curl -s -X POST "$BASE/synergies" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "Risposta: $response" >> $LOGFILE

# Controlla la risposta
if [[ "$response" == *"error"* ]] || [[ "$response" == *"Error"* ]] || [[ "$response" == *"incompleti"* ]]; then
  echo "ERROR: Creazione sinergia fallita" >> $LOGFILE
else
  echo "OK: Sinergia creata con successo" >> $LOGFILE
  # Estrai l'ID della sinergia creata
  SYNERGY_ID=$(echo $response | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "ID Sinergia: $SYNERGY_ID" >> $LOGFILE
  
  # Test di ottenimento della sinergia appena creata
  if [ ! -z "$SYNERGY_ID" ]; then
    echo ">> Test ottenimento sinergia con ID $SYNERGY_ID" >> $LOGFILE
    GET_RESPONSE=$(curl -s -X GET "$BASE/synergies/$SYNERGY_ID")
    echo "Risposta GET: $GET_RESPONSE" >> $LOGFILE
  fi
fi

echo "=== TEST COMPLETATO $(date) ===" >> $LOGFILE
echo "Log disponibile in $LOGFILE"