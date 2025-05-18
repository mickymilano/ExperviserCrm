#!/usr/bin/env bash
TOKEN=$(node -e "require('jsonwebtoken').sign({id:1,username:'debug',role:'super_admin'},'experviser-dev-secret',{expiresIn:'1h'}, (err, token) => console.log(token))")
COMPANY_ID=19  # ID fisso di EasyPoke
NAME="EasyPoke_Test_$(date +%s)"
echo "Creo contatto $NAME per azienda $COMPANY_ID"

# Crea contatto associato all'azienda EasyPoke
curl -s -X POST http://localhost:5000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\":\"$NAME\",
    \"lastName\":\"User\",
    \"companyEmail\":\"$NAME@example.com\",
    \"companyId\":$COMPANY_ID
  }"

echo -e "\nAttendo propagazione... (2 secondi)"
sleep 2

# Verifica se il contatto è stato associato all'azienda
echo "Verifico associazione..."
CONTACTS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/companies/$COMPANY_ID/contacts)
echo "Contatti trovati: $CONTACTS"

if echo "$CONTACTS" | grep -q "$NAME"; then
  echo "✅ SUCCESSO: Contatto $NAME trovato nell'elenco dell'azienda!"
else
  echo "❌ ERRORE: Contatto $NAME NON trovato nell'elenco dell'azienda"
fi
