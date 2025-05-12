#!/bin/bash

# Script per eseguire il seed del database
echo "Esecuzione dello script di seed del database..."
npx tsx migrations/seed-database.ts

echo "Completato."