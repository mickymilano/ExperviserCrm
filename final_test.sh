#!/usr/bin/env bash
TOKEN=$(node -e "require('jsonwebtoken').sign({id:1,username:'debug',role:'super_admin'},'experviser-dev-secret',{expiresIn:'1h'}, (err, token) => console.log(token))")
COMPANY_ID=19  # ID fisso di EasyPoke
NAME="EasyPoke_Final_$(date +%s)"
echo "Creo contatto $NAME per azienda $COMPANY_ID"

# Crea contatto associato all'azienda EasyPoke
RESPONSE=$(curl -s -X POST http://localhost:5000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\":\"$NAME\",
    \"lastName\":\"Final\",
    \"companyEmail\":\"$NAME@example.com\",
    \"companyId\":$COMPANY_ID
  }")

echo -e "\nRisposta creazione contatto: $RESPONSE"
CONTACT_ID=$(echo $RESPONSE | grep -oP '"id":\s*\K\d+')
echo "ID del contatto creato: $CONTACT_ID"

echo -e "\nVerifica aree di attività nel database:"
AREAS_SQL="SELECT * FROM areas_of_activity WHERE contact_id = $CONTACT_ID;"
psql $DATABASE_URL -c "$AREAS_SQL"

echo -e "\nConteggio totale contatti per questa azienda nel database:"
COUNT_SQL="SELECT COUNT(*) FROM areas_of_activity WHERE company_id = $COMPANY_ID;"
psql $DATABASE_URL -c "$COUNT_SQL"

