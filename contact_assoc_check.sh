#!/usr/bin/env bash
# Genera un token di debug valido
TOKEN=$(node -e "import('jsonwebtoken').then(jwt=>console.log(jwt.default.sign({id:1,username:'debug',role:'super_admin'},'experviser-dev-secret',{expiresIn:'1h'})))")

# Recupera l'ID dell'azienda EasyPoke (modifica il filtro se serve)
COMPANY_ID=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/companies | jq '.[]|select(.name=="EasyPoke").id')

i=1
while true; do
  NAME="TestContact_$i"
  echo "[$(date +%T)] Tentativo #$i: creo contatto $NAME per azienda $COMPANY_ID"

  # Crea un nuovo contatto
  CONTACT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/contacts \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"firstName\":\"$NAME\",
      \"lastName\":\"User\",
      \"companyEmail\":\"${NAME}@example.com\"
    }")
  
  # Estrae l'ID del contatto creato
  CONTACT_ID=$(echo $CONTACT_RESPONSE | jq '.id')
  echo "Contatto creato con ID: $CONTACT_ID"
  
  # Crea l'area di attività (associazione contatto-azienda)
  if [ -n "$CONTACT_ID" ]; then
    echo "Creazione area di attività per contatto $CONTACT_ID e azienda $COMPANY_ID"
    curl -s -X POST http://localhost:5000/api/areas-of-activity \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"contactId\": $CONTACT_ID,
        \"companyId\": $COMPANY_ID,
        \"role\": \"Employee\",
        \"isPrimary\": true
      }" >/dev/null
  else
    echo "Errore: impossibile ottenere l'ID del contatto"
  fi

  # Attendi mezzo secondo e rileggi la lista
  sleep 0.5
  COUNT=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/companies/$COMPANY_ID/contacts | jq "[.[]|select(.firstName==\"$NAME\")] | length")

  if [ "$COUNT" -ge 1 ]; then
    echo "✅ Contatto $NAME trovato in azienda EasyPoke!"
    break
  else
    echo "❌ Contatto $NAME NON trovato, riprovo..."
    i=$((i+1))
    sleep 0.5
  fi
done