#!/usr/bin/env bash
TOKEN=$(node -e "require('jsonwebtoken').sign({id:1,username:'debug',role:'super_admin'},'experviser-dev-secret',{expiresIn:'1h'}, (err, token) => console.log(token))")
COMPANY_ID=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/companies | jq '.[]|select(.name=="EasyPoke").id')
i=1
while true; do
  NAME="EasyPoke_Test_$i"
  echo "[$(date +%T)] Tentativo #$i: creo $NAME"
  curl -s -X POST http://localhost:5000/api/contacts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"$NAME\",\"lastName\":\"User\",\"companyEmail\":\"$NAME@example.com\",\"companyId\":$COMPANY_ID}" > /dev/null
  sleep 0.5
  FOUND=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/companies/$COMPANY_ID/contacts | jq "[.[]|select(.firstName==\"$NAME\")]|length")
  if [ "$FOUND" -gt 0 ]; then
    echo "✅ $NAME associato correttamente a EasyPoke!"
    break
  else
    echo "❌ $NAME NON trovato, riprovo..."
    i=$((i+1))
    sleep 0.5
  fi
done
