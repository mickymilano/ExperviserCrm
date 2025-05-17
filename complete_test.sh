#!/bin/bash
# Test completo con creazione token di test
set -e  # Interrompi in caso di errore

LOGFILE=complete_test.log
echo "=== TEST COMPLETO CRM $(date) ===" > $LOGFILE

BASE="http://localhost:5000/api"

# 1. Genera un token JWT manualmente
# In development mode possiamo creare un token con una chiave nota
JWT_SECRET="experviser-dev-secret"
TOKEN_PAYLOAD="{\"id\":1,\"username\":\"debug\",\"role\":\"super_admin\"}"
ENCODED_PAYLOAD=$(echo -n "$TOKEN_PAYLOAD" | base64 | tr -d '\n')
# Header standard per JWT
HEADER="{\"alg\":\"HS256\",\"typ\":\"JWT\"}"
ENCODED_HEADER=$(echo -n "$HEADER" | base64 | tr -d '\n')
# Signature (in un ambiente di test, useremo un placeholder)
SIGNATURE="test_signature"
TOKEN="${ENCODED_HEADER}.${ENCODED_PAYLOAD}.${SIGNATURE}"

echo "Token JWT generato: $TOKEN" >> $LOGFILE

# 2. CREAZIONE AZIENDA CON TOKEN DI TEST
echo ">> Creazione azienda con token test" >> $LOGFILE
RESPONSE=$(curl -s -X POST "$BASE/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Test Company JWT\",\"email\":\"test-jwt@example.com\",\"phone\":\"+391234567890\",\"fullAddress\":\"Via Test 123, Milano, Italia\",\"website\":\"https://testjwt.com\",\"status\":\"active\"}")

echo "Risposta: $RESPONSE" >> $LOGFILE

# 3. RECUPERA L'ELENCO DELLE AZIENDE
echo ">> Recupero elenco aziende" >> $LOGFILE
RESPONSE=$(curl -s -X GET "$BASE/companies" \
  -H "Authorization: Bearer $TOKEN")

echo "Risposta: ${RESPONSE:0:300}..." >> $LOGFILE

# 4. RECUPERA L'ELENCO DEI CONTATTI
echo ">> Recupero elenco contatti" >> $LOGFILE
RESPONSE=$(curl -s -X GET "$BASE/contacts" \
  -H "Authorization: Bearer $TOKEN")

echo "Risposta: ${RESPONSE:0:300}..." >> $LOGFILE

# Estrai il primo ID contatto disponibile
CONTACT_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "Primo ID contatto disponibile: $CONTACT_ID" >> $LOGFILE

# 5. RECUPERA L'ELENCO DEI DEAL
echo ">> Recupero elenco deal" >> $LOGFILE
RESPONSE=$(curl -s -X GET "$BASE/deals" \
  -H "Authorization: Bearer $TOKEN")

echo "Risposta: ${RESPONSE:0:300}..." >> $LOGFILE

# Estrai il primo ID deal disponibile
DEAL_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "Primo ID deal disponibile: $DEAL_ID" >> $LOGFILE

# 6. RECUPERA L'ELENCO DELLE AZIENDE
echo ">> Recupero elenco aziende" >> $LOGFILE
RESPONSE=$(curl -s -X GET "$BASE/companies" \
  -H "Authorization: Bearer $TOKEN")

echo "Risposta: ${RESPONSE:0:300}..." >> $LOGFILE

# Estrai il primo ID azienda disponibile
COMPANY_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo "Primo ID azienda disponibile: $COMPANY_ID" >> $LOGFILE

# 7. CREAZIONE SINERGIA
echo ">> Creazione sinergia con ID esistenti" >> $LOGFILE
TODAY=$(date +"%Y-%m-%d")

# Verifica che abbiamo ID validi
if [ -z "$CONTACT_ID" ] || [ -z "$COMPANY_ID" ] || [ -z "$DEAL_ID" ]; then
  echo "ERRORE: Impossibile ottenere ID validi per la creazione della sinergia" >> $LOGFILE
else
  echo "Utilizzo degli ID: contactId=$CONTACT_ID, companyId=$COMPANY_ID, dealId=$DEAL_ID" >> $LOGFILE
  
  PAYLOAD="{\"contactId\":$CONTACT_ID,\"companyId\":$COMPANY_ID,\"type\":\"Leadership\",\"description\":\"Sinergia di test completo\",\"status\":\"Active\",\"startDate\":\"$TODAY\",\"dealId\":$DEAL_ID}"
  echo "Payload sinergia: $PAYLOAD" >> $LOGFILE
  
  RESPONSE=$(curl -s -X POST "$BASE/synergies" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$PAYLOAD")
  
  echo "Risposta: $RESPONSE" >> $LOGFILE
  
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"incompleti"* ]]; then
    echo "ERROR: Creazione sinergia fallita" >> $LOGFILE
  else
    echo "OK: Sinergia creata con successo" >> $LOGFILE
    SYNERGY_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "ID Sinergia: $SYNERGY_ID" >> $LOGFILE
  fi
fi

echo "=== TEST COMPLETATO $(date) ===" >> $LOGFILE
echo "Log disponibile in $LOGFILE"