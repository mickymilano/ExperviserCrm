# Test completo CRM: crea dati, continua sui fallimenti, logga tutto
set +e
LOGFILE=crm_full_test.log
echo "=== CRM FULL-STACK TEST START $(date) ===" > $LOGFILE

BASE="http://localhost:5000/api"

# 1) 20 AZIENDE
echo ">> Creazione 20 aziende" >> $LOGFILE
for i in $(seq 1 20); do
  curl -s -X POST "$BASE/companies" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Company $i\",\"email\":\"company${i}@example.com\",\"phone\":\"+3912345678${i}\",\"fullAddress\":\"Via Test $i, Città\",\"status\":\"active\"}" \
    >> $LOGFILE 2>&1 \
    || echo "ERROR crea company $i" >> $LOGFILE
done

# 2) 20 CONTATTI (1 per azienda)
echo ">> Creazione 20 contatti" >> $LOGFILE
for i in $(seq 1 20); do
  curl -s -X POST "$BASE/contacts" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"Test\",\"lastName\":\"Contact $i\",\"email\":\"contact${i}@example.com\",\"phone\":\"+3912345679${i}\",\"companyId\":$i}" \
    >> $LOGFILE 2>&1 \
    || echo "ERROR crea contact $i" >> $LOGFILE
done

# 3) 10 LEAD
echo ">> Creazione 10 lead" >> $LOGFILE
for i in $(seq 1 10); do
  cid=$(( (i-1) % 20 + 1 ))
  curl -s -X POST "$BASE/leads" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"Lead\",\"lastName\":\"Test $i\",\"email\":\"lead${i}@example.com\",\"phone\":\"+3912345680${i}\",\"company\":\"Test Company $cid\",\"source\":\"Test\",\"notes\":\"Test Lead $i\",\"status\":\"new\"}" \
    >> $LOGFILE 2>&1 \
    || echo "ERROR crea lead $i" >> $LOGFILE
done

# 4) 10 DEAL
echo ">> Creazione 10 deal" >> $LOGFILE
for i in $(seq 1 10); do
  cid=$(( (i-1) % 20 + 1 ))
  curl -s -X POST "$BASE/deals" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Deal $i\",\"companyId\":$cid,\"contactId\":$cid,\"value\":10000,\"expectedCloseDate\":\"2025-06-30\",\"status\":\"active\"}" \
    >> $LOGFILE 2>&1 \
    || echo "ERROR crea deal $i" >> $LOGFILE
done

# 5) 5 SINERGIE
echo ">> Creazione 5 sinergie" >> $LOGFILE
for i in $(seq 1 5); do
  did=$i
  cid=$(( (i-1) % 20 + 10 ))
  curl -s -X POST "$BASE/synergies" \
    -H "Content-Type: application/json" \
    -d "{\"entityType\":\"deal\",\"entityId\":$did,\"targetType\":\"contact\",\"targetId\":$cid,\"strength\":5,\"description\":\"Referral synergy $i\",\"status\":\"active\"}" \
    >> $LOGFILE 2>&1 \
    || echo "ERROR crea sinergia $i" >> $LOGFILE
done

echo "=== TEST COMPLETO FINITO $(date) ===" >> $LOGFILE
echo "Log disponibile in $LOGFILE"