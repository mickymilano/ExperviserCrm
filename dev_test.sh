#!/bin/bash
# Test completo CRM in modalità development senza token
set -e  # Interrompi in caso di errore

LOGFILE=dev_test.log
echo "=== CRM DEV MODE TEST START $(date) ===" > $LOGFILE

BASE="http://localhost:5000/api"

# Imposta la modalità NODE_ENV=development (dovrebbe già essere impostata)
export NODE_ENV=development

# 1) CREAZIONE 5 AZIENDE
echo ">> Creazione 5 aziende" >> $LOGFILE
for i in $(seq 1 5); do
  RESPONSE=$(curl -s -X POST "$BASE/companies" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"DevTest Company $i\",\"email\":\"devtest${i}@example.com\",\"phone\":\"+3912345678${i}\",\"fullAddress\":\"Via Test $i, Milano, Italia\",\"website\":\"https://testcompany${i}.com\",\"status\":\"active\"}")
  
  echo "Azienda $i: $RESPONSE" >> $LOGFILE
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione azienda $i fallita" >> $LOGFILE
  else
    echo "OK: Azienda $i creata" >> $LOGFILE
    # Estrai l'id per usarlo nei contatti
    COMPANY_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Company ID: $COMPANY_ID" >> $LOGFILE
  fi
done

# 2) CREAZIONE 5 CONTATTI
echo ">> Creazione 5 contatti" >> $LOGFILE
for i in $(seq 1 5); do
  COMPANY_ID=$((i+20))  # Ipotizzo che gli ID partano da un certo valore
  RESPONSE=$(curl -s -X POST "$BASE/contacts" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"DevTest\",\"lastName\":\"Contact $i\",\"companyEmail\":\"devcontact${i}@example.com\",\"mobilePhone\":\"+3912345679${i}\",\"companyId\":$COMPANY_ID}")
  
  echo "Contatto $i: $RESPONSE" >> $LOGFILE
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione contatto $i fallita" >> $LOGFILE
  else
    echo "OK: Contatto $i creato" >> $LOGFILE
    CONTACT_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Contact ID: $CONTACT_ID" >> $LOGFILE
  fi
done

# 3) CREAZIONE 5 DEAL
echo ">> Creazione 5 deal" >> $LOGFILE
for i in $(seq 1 5); do
  COMPANY_ID=$((i+20))  # Usa le aziende create prima
  RESPONSE=$(curl -s -X POST "$BASE/deals" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"DevTest Deal $i\",\"companyId\":$COMPANY_ID,\"contactId\":[],\"stageId\":1,\"value\":10000,\"expectedCloseDate\":\"2025-06-30\",\"status\":\"active\",\"tags\":[\"test\",\"automation\"]}")
  
  echo "Deal $i: $RESPONSE" >> $LOGFILE
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione deal $i fallita" >> $LOGFILE
  else
    echo "OK: Deal $i creato" >> $LOGFILE
    DEAL_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Deal ID: $DEAL_ID" >> $LOGFILE
  fi
done

# 4) CREAZIONE 5 SINERGIE
echo ">> Creazione 5 sinergie" >> $LOGFILE
for i in $(seq 1 5); do
  DEAL_ID=$((i+10))  # Usa gli ID dei deal creati prima (con offset)
  CONTACT_ID=$((i+30))  # Usa gli ID dei contatti creati prima (con offset)
  
  # Debug del payload
  PAYLOAD="{\"entityType\":\"deal\",\"entityId\":$DEAL_ID,\"targetType\":\"contact\",\"targetId\":$CONTACT_ID,\"strength\":5,\"description\":\"DevTest synergy $i\",\"status\":\"active\"}"
  echo "Payload sinergia $i: $PAYLOAD" >> $LOGFILE
  
  RESPONSE=$(curl -s -X POST "$BASE/synergies" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")
  
  echo "Sinergia $i: $RESPONSE" >> $LOGFILE
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione sinergia $i fallita" >> $LOGFILE
  else
    echo "OK: Sinergia $i creata" >> $LOGFILE
  fi
done

echo "=== TEST COMPLETO FINITO $(date) ===" >> $LOGFILE
echo "Log disponibile in $LOGFILE"
echo "Test completato. Risultati dettagliati nel file $LOGFILE"