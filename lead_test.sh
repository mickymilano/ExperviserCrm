#!/bin/bash

# Test API endpoints per i Lead
# Necessita di autenticazione JWT

# Impostazioni
API_BASE="http://localhost:5000"
TIMESTAMP=$(date +%s)
# Token di autenticazione (generato con node generate_token.js)
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJkZWJ1ZyIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc0NzUwNTMwOCwiZXhwIjoxNzQ3NTkxNzA4fQ.Uo37JZIV6tQoL0XPBsmFeR6TFOSQaGEEoLey1ModJLg"
AUTH_HEADER="Authorization: Bearer ${AUTH_TOKEN}"

# Generate test data
echo "=== Preparazione dati di test ==="
TEST_NAME="Mario"
TEST_LASTNAME="Rossi_${TIMESTAMP}"
TEST_COMPANY="TestCompany_${TIMESTAMP}"
TEST_EMAIL="mario.rossi_${TIMESTAMP}@test.com"

# TEST 1: Crea un nuovo lead (POST /api/leads)
echo -e "\n=== Test 1: Creazione Lead ==="
CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/leads" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -d "{\"firstName\":\"${TEST_NAME}\",\"lastName\":\"${TEST_LASTNAME}\",\"company\":\"${TEST_COMPANY}\",\"email\":\"${TEST_EMAIL}\",\"status\":\"new\",\"notes\":\"Test Lead creato automaticamente\"}")

echo "Risposta: $CREATE_RESPONSE"

# Estrai l'ID del lead creato
LEAD_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$LEAD_ID" ]; then
  echo "ERRORE: Impossibile ottenere l'ID del lead creato"
  exit 1
fi

echo "Lead creato con ID: $LEAD_ID"

# TEST 2: Ottieni il lead creato (GET /api/leads/:id)
echo -e "\n=== Test 2: Recupero Lead ==="
GET_RESPONSE=$(curl -s -X GET "${API_BASE}/api/leads/${LEAD_ID}" \
  -H "${AUTH_HEADER}")

echo "Risposta: $GET_RESPONSE"

# TEST 3: Aggiorna il lead con PATCH (PATCH /api/leads/:id)
echo -e "\n=== Test 3: Aggiornamento Lead con PATCH ==="
PATCH_RESPONSE=$(curl -s -X PATCH "${API_BASE}/api/leads/${LEAD_ID}" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -d "{\"lastName\":\"Bianchi_${TIMESTAMP}\",\"status\":\"contacted\"}")

echo "Risposta: $PATCH_RESPONSE"

# TEST 4: Verifica modifiche
echo -e "\n=== Test 4: Verifica aggiornamento ==="
VERIFY_RESPONSE=$(curl -s -X GET "${API_BASE}/api/leads/${LEAD_ID}" \
  -H "${AUTH_HEADER}")

echo "Risposta: $VERIFY_RESPONSE"

# TEST 5: Converti il lead in contatto
echo -e "\n=== Test 5: Conversione Lead in Contatto ==="
CONVERT_RESPONSE=$(curl -s -X POST "${API_BASE}/api/leads/${LEAD_ID}/convert" \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}")

echo "Risposta: $CONVERT_RESPONSE"

# Estrai l'ID del contatto creato
CONTACT_ID=$(echo $CONVERT_RESPONSE | grep -o '"contactId":[0-9]*' | cut -d':' -f2)
COMPANY_ID=$(echo $CONVERT_RESPONSE | grep -o '"companyId":[0-9]*' | cut -d':' -f2)

echo "Lead convertito in contatto ID: $CONTACT_ID e azienda ID: $COMPANY_ID"

# TEST 6: Verifica che il lead sia stato contrassegnato come convertito
echo -e "\n=== Test 6: Verifica stato lead dopo conversione ==="
LEAD_STATUS_RESPONSE=$(curl -s -X GET "${API_BASE}/api/leads/${LEAD_ID}" \
  -H "${AUTH_HEADER}")

echo "Risposta: $LEAD_STATUS_RESPONSE"

# TEST 7: Elimina il lead (DELETE /api/leads/:id)
# Commentato per non perdere i dati di test
# echo -e "\n=== Test 7: Eliminazione Lead ==="
# DELETE_RESPONSE=$(curl -s -X DELETE "${API_BASE}/api/leads/${LEAD_ID}" \
#   -H "${AUTH_HEADER}")
# echo "Risposta: $DELETE_RESPONSE"

echo -e "\n=== Test completati ==="