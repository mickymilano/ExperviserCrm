#!/bin/bash
# Test funzionalità email nel CRM

LOGFILE=email_test.log
echo "=== TEST MODULO EMAIL $(date) ===" > $LOGFILE

# Genera token JWT per autenticazione
echo "Generazione token di autenticazione..." | tee -a $LOGFILE
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { id: 1, username: 'debug', role: 'super_admin' },
  'experviser-dev-secret',
  { expiresIn: '1h' }
);
console.log(token);
")

echo "Token generato: $TOKEN" >> $LOGFILE
AUTH_HEADER="Authorization: Bearer $TOKEN"

# Funzioni di supporto
function test_step() {
  echo -e "\n=== STEP: $1 ===" | tee -a $LOGFILE
}

function check_emails_for_entity() {
  local entity_type=$1
  local entity_id=$2
  local entity_name=$3
  
  echo "Verifica email per $entity_name (ID: $entity_id, tipo: $entity_type)" | tee -a $LOGFILE
  
  RESPONSE=$(curl -s -X GET "http://localhost:5000/api/emails?entityType=$entity_type&entityId=$entity_id" \
    -H "$AUTH_HEADER")
  
  EMAIL_COUNT=$(echo $RESPONSE | grep -o '"id"' | wc -l)
  echo "Trovate $EMAIL_COUNT email associate" | tee -a $LOGFILE
  echo "Risposta API: ${RESPONSE:0:300}..." >> $LOGFILE
  
  # Simula invio di un'email
  test_step "Creazione email per $entity_name"
  
  TIMESTAMP=$(date +%s)
  SEND_RESPONSE=$(curl -s -X POST "http://localhost:5000/api/emails" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{
      \"subject\": \"Test $entity_type $TIMESTAMP\",
      \"content\": \"<p>Email di test per $entity_type ID: $entity_id</p>\",
      \"to\": [\"test@example.com\"],
      \"from\": \"system@experviser.com\",
      \"entityType\": \"$entity_type\",
      \"entityId\": $entity_id
    }")
  
  echo "Risposta creazione email: $SEND_RESPONSE" >> $LOGFILE
  
  # Verifica che l'email sia stata creata
  NEW_EMAIL_ID=$(echo $SEND_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  if [ -z "$NEW_EMAIL_ID" ]; then
    echo "❌ Errore nella creazione dell'email per $entity_type" | tee -a $LOGFILE
  else 
    echo "✅ Email creata con ID: $NEW_EMAIL_ID" | tee -a $LOGFILE
  fi
}

# 1. Trova un contatto esistente
test_step "Ricerca di un contatto esistente"
RESPONSE=$(curl -s -X GET "http://localhost:5000/api/contacts?limit=1" \
  -H "$AUTH_HEADER")

CONTACT_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
CONTACT_NAME=$(echo $RESPONSE | grep -o '"firstName":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
CONTACT_NAME="$CONTACT_NAME $(echo $RESPONSE | grep -o '"lastName":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')"

echo "Contatto selezionato: $CONTACT_NAME (ID: $CONTACT_ID)" | tee -a $LOGFILE

# 2. Trova un'azienda esistente
test_step "Ricerca di un'azienda esistente"
RESPONSE=$(curl -s -X GET "http://localhost:5000/api/companies?limit=1" \
  -H "$AUTH_HEADER")

COMPANY_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
COMPANY_NAME=$(echo $RESPONSE | grep -o '"name":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')

echo "Azienda selezionata: $COMPANY_NAME (ID: $COMPANY_ID)" | tee -a $LOGFILE

# 3. Trova un deal esistente
test_step "Ricerca di un deal esistente"
RESPONSE=$(curl -s -X GET "http://localhost:5000/api/deals?limit=1" \
  -H "$AUTH_HEADER")

DEAL_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
DEAL_NAME=$(echo $RESPONSE | grep -o '"title":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')

echo "Deal selezionato: $DEAL_NAME (ID: $DEAL_ID)" | tee -a $LOGFILE

# 4. Trova una filiale esistente
test_step "Ricerca di una filiale esistente"
RESPONSE=$(curl -s -X GET "http://localhost:5000/api/branches?limit=1" \
  -H "$AUTH_HEADER")

BRANCH_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
BRANCH_NAME=$(echo $RESPONSE | grep -o '"name":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')

echo "Filiale selezionata: $BRANCH_NAME (ID: $BRANCH_ID)" | tee -a $LOGFILE

# 5. Trova un lead esistente
test_step "Ricerca di un lead esistente"
RESPONSE=$(curl -s -X GET "http://localhost:5000/api/leads?limit=1" \
  -H "$AUTH_HEADER")

LEAD_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
LEAD_NAME=$(echo $RESPONSE | grep -o '"firstName":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
LEAD_NAME="$LEAD_NAME $(echo $RESPONSE | grep -o '"lastName":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')"
if [ -z "$LEAD_NAME" ]; then
  LEAD_NAME=$(echo $RESPONSE | grep -o '"companyName":"[^"]*"' | head -1 | cut -d':' -f2 | tr -d '"')
fi

echo "Lead selezionato: $LEAD_NAME (ID: $LEAD_ID)" | tee -a $LOGFILE

# 6. Testa email per ogni entità
if [ ! -z "$CONTACT_ID" ]; then
  test_step "Test email per contatto"
  check_emails_for_entity "contact" "$CONTACT_ID" "$CONTACT_NAME"
fi

if [ ! -z "$COMPANY_ID" ]; then
  test_step "Test email per azienda"
  check_emails_for_entity "company" "$COMPANY_ID" "$COMPANY_NAME"
fi

if [ ! -z "$DEAL_ID" ]; then
  test_step "Test email per deal"
  check_emails_for_entity "deal" "$DEAL_ID" "$DEAL_NAME"
fi

if [ ! -z "$BRANCH_ID" ]; then
  test_step "Test email per filiale"
  check_emails_for_entity "branch" "$BRANCH_ID" "$BRANCH_NAME"
fi

if [ ! -z "$LEAD_ID" ]; then
  test_step "Test email per lead"
  check_emails_for_entity "lead" "$LEAD_ID" "$LEAD_NAME"
fi

# Riepilogo
test_step "Riepilogo test"
echo "Test completato con successo!" | tee -a $LOGFILE
echo "Entità testate:" | tee -a $LOGFILE
[ ! -z "$CONTACT_ID" ] && echo "- Contatto: $CONTACT_NAME (ID: $CONTACT_ID)" | tee -a $LOGFILE
[ ! -z "$COMPANY_ID" ] && echo "- Azienda: $COMPANY_NAME (ID: $COMPANY_ID)" | tee -a $LOGFILE
[ ! -z "$DEAL_ID" ] && echo "- Deal: $DEAL_NAME (ID: $DEAL_ID)" | tee -a $LOGFILE
[ ! -z "$BRANCH_ID" ] && echo "- Filiale: $BRANCH_NAME (ID: $BRANCH_ID)" | tee -a $LOGFILE
[ ! -z "$LEAD_ID" ] && echo "- Lead: $LEAD_NAME (ID: $LEAD_ID)" | tee -a $LOGFILE

echo "Log completo disponibile in: $LOGFILE" | tee -a $LOGFILE
