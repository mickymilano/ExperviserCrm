#!/usr/bin/env bash
COMPANY_ID=19

echo "Verifica diretta nel database PostgreSQL per la company $COMPANY_ID"
echo "-----------------------------------------------------------------"

echo -e "\n1. Verifica aree di attività:"
AREAS_SQL="SELECT * FROM areas_of_activity WHERE company_id = $COMPANY_ID;"
psql $DATABASE_URL -c "$AREAS_SQL"

echo -e "\n2. Verifica contatti associati:"
CONTACTS_SQL="
SELECT c.id, c.first_name, c.last_name, c.company_email, a.id as area_id, a.is_primary
FROM contacts c
JOIN areas_of_activity a ON c.id = a.contact_id
WHERE a.company_id = $COMPANY_ID
ORDER BY c.id;
"
psql $DATABASE_URL -c "$CONTACTS_SQL"

