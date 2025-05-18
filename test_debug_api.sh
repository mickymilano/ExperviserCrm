#!/usr/bin/env bash
TOKEN=$(node -e "require('jsonwebtoken').sign({id:1,username:'debug',role:'super_admin'},'experviser-dev-secret',{expiresIn:'1h'}, (err, token) => console.log(token))")
COMPANY_ID=19

echo "Testo l'endpoint di debug per la company $COMPANY_ID"
echo "--------------------------------------------------------"

RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/debug/companies/$COMPANY_ID/contacts)

echo -e "\nRisposta JSON completa:\n"
echo "$RESPONSE" | jq '.'

COUNT=$(echo "$RESPONSE" | jq '.count')

echo -e "\nRiepilogo:"
echo "- Relazioni trovate: $COUNT"

if [ "$COUNT" -gt 0 ]; then
  echo -e "\nDati delle aree di attività trovate:"
  echo "$RESPONSE" | jq '.data[].area_id, .data[].contact_id, .data[].first_name, .data[].last_name'
else
  echo -e "\nNon ci sono contatti associati a questa azienda nel database."
fi
