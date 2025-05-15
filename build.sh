#!/bin/bash

# Script di build per preparare l'applicazione per il deployment

echo "Avvio processo di build..."

# Pulisci le directory di build precedenti
echo "Pulizia delle directory di build precedenti..."
rm -rf dist
rm -rf public

# Build del frontend con Vite
echo "Compilazione del frontend con Vite..."
npx vite build --outDir public

# Build del backend con esbuild
echo "Compilazione del backend con esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Copia i file necessari per il deployment
echo "Copia dei file necessari per il deployment..."
cp -r public dist/
mkdir -p server/public
cp -r public/* server/public/

echo "Build completata con successo!"