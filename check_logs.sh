#!/usr/bin/env bash
TOKEN=$(node -e "require('jsonwebtoken').sign({id:1,username:'debug',role:'super_admin'},'experviser-dev-secret',{expiresIn:'1h'}, (err, token) => console.log(token))")
COMPANY_ID=19

# Verifica diretta dei contatti
echo "Verifica diretta dei contatti con l'API v2:"
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/v2/companies/$COMPANY_ID/contacts
