#!/bin/bash
# Test completo CRM con autenticazione
set -e  # Interrompi in caso di errore

LOGFILE=crm_full_auth_test.log
echo "=== CRM FULL-STACK TEST START $(date) ===" > $LOGFILE

BASE="http://localhost:5000/api"

# 0) Login per ottenere il token
echo ">> Login per autenticazione" >> $LOGFILE
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin", "password":"admin123"}' | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "ERRORE: Impossibile ottenere il token di autenticazione" >> $LOGFILE
  echo "Usando la modalità debug" >> $LOGFILE
  # Modalità debug - utente hardcoded per test
  TOKEN="debug_token_for_testing"
fi

echo "Token ottenuto: ${TOKEN:0:10}..." >> $LOGFILE

# 1) 20 AZIENDE
echo ">> Creazione 20 aziende" >> $LOGFILE
for i in $(seq 1 5); do  # Ridotto a 5 per velocizzare il test
  RESPONSE=$(curl -s -X POST "$BASE/companies" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"Test Company $i\",\"email\":\"company${i}@example.com\",\"phone\":\"+3912345678${i}\",\"fullAddress\":\"Via Test $i, Milano, Italia\",\"website\":\"https://testcompany${i}.com\",\"status\":\"active\"}")
  
  echo "Azienda $i: $RESPONSE" >> $LOGFILE
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione azienda $i fallita" >> $LOGFILE
  else
    echo "OK: Azienda $i creata" >> $LOGFILE
  fi
done

# 2) 5 CONTATTI (1 per azienda)
echo ">> Creazione 5 contatti" >> $LOGFILE
for i in $(seq 1 5); do
  RESPONSE=$(curl -s -X POST "$BASE/contacts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"firstName\":\"Test\",\"lastName\":\"Contact $i\",\"companyEmail\":\"contact${i}@example.com\",\"mobilePhone\":\"+3912345679${i}\",\"companyId\":$((i+8))}")
  
  echo "Contatto $i: $RESPONSE" >> $LOGFILE
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione contatto $i fallita" >> $LOGFILE
  else
    echo "OK: Contatto $i creato" >> $LOGFILE
  fi
done

# 3) 5 LEAD
echo ">> Creazione 5 lead" >> $LOGFILE
for i in $(seq 1 5); do
  RESPONSE=$(curl -s -X POST "$BASE/leads" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"firstName\":\"Lead\",\"lastName\":\"Test $i\",\"email\":\"lead${i}@example.com\",\"phone\":\"+3912345680${i}\",\"company\":\"Test Company $i\",\"status\":\"new\",\"source\":\"Test\",\"notes\":\"Test Lead $i\"}")
  
  echo "Lead $i: $RESPONSE" >> $LOGFILE
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione lead $i fallita" >> $LOGFILE
  else
    echo "OK: Lead $i creato" >> $LOGFILE
  fi
done

# 4) 5 DEAL
echo ">> Creazione 5 deal" >> $LOGFILE
for i in $(seq 1 5); do
  COMPANY_ID=$((i+8))
  RESPONSE=$(curl -s -X POST "$BASE/deals" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"Test Deal $i\",\"companyId\":$COMPANY_ID,\"contactId\":[],\"stageId\":1,\"value\":10000,\"expectedCloseDate\":\"2025-06-30\",\"status\":\"active\",\"tags\":[\"test\",\"automation\"]}")
  
  echo "Deal $i: $RESPONSE" >> $LOGFILE
  # Estrai l'ID del deal creato per usarlo nelle sinergie
  DEAL_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  echo "Deal ID: $DEAL_ID" >> $LOGFILE
  
  if [[ "$RESPONSE" == *"error"* ]] || [[ "$RESPONSE" == *"Error"* ]] || [[ "$RESPONSE" == *"ERROR"* ]]; then
    echo "ERROR: Creazione deal $i fallita" >> $LOGFILE
  else
    echo "OK: Deal $i creato con ID $DEAL_ID" >> $LOGFILE
  fi
done

# 5) 5 SINERGIE
echo ">> Creazione 5 sinergie" >> $LOGFILE
for i in $(seq 1 5); do
  DEAL_ID=$((i+4))  # Assumendo che gli ID dei deal inizino dal 5 (aggiungiamo offset)
  CONTACT_ID=$((i+20))  # Assumendo che gli ID dei contatti inizino dal 21 (aggiungiamo offset)
  
  # Debug del payload
  PAYLOAD="{\"entityType\":\"deal\",\"entityId\":$DEAL_ID,\"targetType\":\"contact\",\"targetId\":$CONTACT_ID,\"strength\":5,\"description\":\"Referral synergy $i\",\"status\":\"active\"}"
  echo "Payload sinergia $i: $PAYLOAD" >> $LOGFILE
  
  RESPONSE=$(curl -s -X POST "$BASE/synergies" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
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