#!/usr/bin/env bash
COMPANY_ID=19

echo "Verifica diretta delle aree di attività nel database PostgreSQL"
echo "-------------------------------------------------------------"

# Verifica le aree di attività associate alla company
echo -e "\nAree di attività per company ID $COMPANY_ID:"
AREAS_SQL="SELECT * FROM areas_of_activity WHERE company_id = $COMPANY_ID;"
psql $DATABASE_URL -c "$AREAS_SQL"

# Lista dei contact_id associati
echo -e "\nLista di contact_id associati alla company $COMPANY_ID:"
CONTACT_IDS_SQL="SELECT contact_id FROM areas_of_activity WHERE company_id = $COMPANY_ID;"
psql $DATABASE_URL -c "$CONTACT_IDS_SQL"

# Conta totale 
echo -e "\nNumero totale di contatti associati alla company $COMPANY_ID:"
COUNT_SQL="SELECT COUNT(*) FROM areas_of_activity WHERE company_id = $COMPANY_ID;"
psql $DATABASE_URL -c "$COUNT_SQL"

