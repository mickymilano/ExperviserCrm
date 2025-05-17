#!/bin/bash
# Test completo con JWT token valido
set -e  # Interrompi in caso di errore

LOGFILE=jwt_test.log
echo "=== TEST COMPLETO CRM CON JWT VALIDO $(date) ===" > $LOGFILE

BASE="http://localhost:5000/api"

# Token JWT generato manualmente
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJkZWJ1ZyIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc0NzQ5OTU0MiwiZXhwIjoxNzQ3NTg1OTQyfQ.r4La_rdG-dauWWgmLVa3hGvXw9qKcvTu8B_HIQbTFjc"

echo "Utilizzo JWT token: ${TOKEN:0:20}..." >> $LOGFILE

# 1. RECUPERA AZIENDE ESISTENTI
echo ">> Recupero elenco aziende" >> $LOGFILE
COMPANIES_RESPONSE=$(curl -s -X GET "$BASE/companies" \
  -H "Authorization: Bearer $TOKEN")

if [[ "$COMPANIES_RESPONSE" == *"error"* ]] || [[ "$COMPANIES_RESPONSE" == *"Token non valido"* ]]; then
  echo "ERROR: Impossibile recuperare le aziende" >> $LOGFILE
  echo "$COMPANIES_RESPONSE" >> $LOGFILE
else
  echo "OK: Aziende recuperate" >> $LOGFILE
  # Estrai il primo ID azienda
  COMPANY_ID=$(echo $COMPANIES_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
  echo "Primo ID azienda disponibile: $COMPANY_ID" >> $LOGFILE
fi

# 2. RECUPERA CONTATTI ESISTENTI
echo ">> Recupero elenco contatti" >> $LOGFILE
CONTACTS_RESPONSE=$(curl -s -X GET "$BASE/contacts" \
  -H "Authorization: Bearer $TOKEN")

if [[ "$CONTACTS_RESPONSE" == *"error"* ]] || [[ "$CONTACTS_RESPONSE" == *"Token non valido"* ]]; then
  echo "ERROR: Impossibile recuperare i contatti" >> $LOGFILE
  echo "$CONTACTS_RESPONSE" >> $LOGFILE
else
  echo "OK: Contatti recuperati" >> $LOGFILE
  # Estrai il primo ID contatto
  CONTACT_ID=$(echo $CONTACTS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
  echo "Primo ID contatto disponibile: $CONTACT_ID" >> $LOGFILE
fi

# 3. RECUPERA DEAL ESISTENTI
echo ">> Recupero elenco deal" >> $LOGFILE
DEALS_RESPONSE=$(curl -s -X GET "$BASE/deals" \
  -H "Authorization: Bearer $TOKEN")

if [[ "$DEALS_RESPONSE" == *"error"* ]] || [[ "$DEALS_RESPONSE" == *"Token non valido"* ]]; then
  echo "ERROR: Impossibile recuperare i deal" >> $LOGFILE
  echo "$DEALS_RESPONSE" >> $LOGFILE
else
  echo "OK: Deal recuperati" >> $LOGFILE
  # Estrai il primo ID deal
  DEAL_ID=$(echo $DEALS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
  echo "Primo ID deal disponibile: $DEAL_ID" >> $LOGFILE
fi

# 4. CREAZIONE AZIENDA DI TEST
echo ">> Creazione azienda di test" >> $LOGFILE
COMPANY_RESPONSE=$(curl -s -X POST "$BASE/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"JWT Test Company\",\"email\":\"jwt-test@example.com\",\"phone\":\"+391234567890\",\"fullAddress\":\"Via Test JWT 123, Milano, Italia\",\"website\":\"https://jwttest.com\",\"status\":\"active\"}")

if [[ "$COMPANY_RESPONSE" == *"error"* ]] || [[ "$COMPANY_RESPONSE" == *"Token non valido"* ]]; then
  echo "ERROR: Creazione azienda fallita" >> $LOGFILE
  echo "$COMPANY_RESPONSE" >> $LOGFILE
else
  echo "OK: Azienda creata" >> $LOGFILE
  NEW_COMPANY_ID=$(echo $COMPANY_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
  echo "Nuovo ID azienda: $NEW_COMPANY_ID" >> $LOGFILE
fi

# Verifica che abbiamo ID validi per proseguire con il test
if [ -z "$CONTACT_ID" ] || [ -z "$COMPANY_ID" ] || [ -z "$DEAL_ID" ]; then
  echo "ATTENZIONE: Uno o più ID mancanti, utilizzo valori di fallback" >> $LOGFILE
  # Valori di fallback (se esistono nel database)
  [ -z "$COMPANY_ID" ] && COMPANY_ID=9
  [ -z "$CONTACT_ID" ] && CONTACT_ID=1
  [ -z "$DEAL_ID" ] && DEAL_ID=1
  echo "ID di fallback: companyId=$COMPANY_ID, contactId=$CONTACT_ID, dealId=$DEAL_ID" >> $LOGFILE
fi

# 5. CREAZIONE SINERGIA
echo ">> Creazione sinergia con ID esistenti" >> $LOGFILE
TODAY=$(date +"%Y-%m-%d")

echo "Utilizzo degli ID: contactId=$CONTACT_ID, companyId=$COMPANY_ID, dealId=$DEAL_ID" >> $LOGFILE

PAYLOAD="{\"contactId\":$CONTACT_ID,\"companyId\":$COMPANY_ID,\"type\":\"Leadership\",\"description\":\"Sinergia di test JWT\",\"status\":\"Active\",\"startDate\":\"$TODAY\",\"dealId\":$DEAL_ID}"
echo "Payload sinergia: $PAYLOAD" >> $LOGFILE

SYNERGY_RESPONSE=$(curl -s -X POST "$BASE/synergies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PAYLOAD")

echo "Risposta creazione sinergia: $SYNERGY_RESPONSE" >> $LOGFILE

if [[ "$SYNERGY_RESPONSE" == *"error"* ]] || [[ "$SYNERGY_RESPONSE" == *"incompleti"* ]] || [[ "$SYNERGY_RESPONSE" == *"Token non valido"* ]]; then
  echo "ERROR: Creazione sinergia fallita" >> $LOGFILE
else
  echo "OK: Sinergia creata con successo" >> $LOGFILE
  SYNERGY_ID=$(echo $SYNERGY_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "ID Sinergia: $SYNERGY_ID" >> $LOGFILE
fi

echo "=== TEST COMPLETATO $(date) ===" >> $LOGFILE
echo "Log disponibile in $LOGFILE"