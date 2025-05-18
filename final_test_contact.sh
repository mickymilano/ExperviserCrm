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
    \"lastName\":\"User\",
    \"companyEmail\":\"$NAME@example.com\",
    \"companyId\":$COMPANY_ID
  }")

echo -e "\nRisposta creazione contatto: $RESPONSE"
CONTACT_ID=$(echo $RESPONSE | grep -oP '"id":\s*\K\d+')
echo "ID del contatto creato: $CONTACT_ID"

# Verifica che il contatto esista nel database
echo -e "\nVerifica direttamente il contatto nel database:"
CONTACT_SQL="SELECT * FROM contacts WHERE id = $CONTACT_ID;"
echo "SQL: $CONTACT_SQL"
psql $DATABASE_URL -c "$CONTACT_SQL"

# Verifica che l'area di attività esista nel database
echo -e "\nVerifica area di attività nel database:"
AREA_SQL="SELECT * FROM areas_of_activity WHERE contact_id = $CONTACT_ID;"
echo "SQL: $AREA_SQL"
psql $DATABASE_URL -c "$AREA_SQL"

echo -e "\nAttendo propagazione... (3 secondi)"
sleep 3

# Verifica se il contatto è stato associato all'azienda
echo -e "\nVerifico associazione nell'API:"
CONTACTS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/companies/$COMPANY_ID/contacts)
echo "Contatti trovati per azienda $COMPANY_ID:"
echo "$CONTACTS" | jq '.'

if echo "$CONTACTS" | grep -q "$NAME"; then
  echo "✅ SUCCESSO: Contatto $NAME trovato nell'elenco dell'azienda!"
else
  echo "❌ ERRORE: Contatto $NAME NON trovato nell'elenco dell'azienda"
fi
