import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Converti import.meta.url in __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funzione che calcola il percorso relativo tra due file
function getRelativePath(fromFilePath, toImportPath) {
  let absoluteImportPath;
  
  // Gestisci diversi tipi di alias
  if (toImportPath.startsWith('@/')) {
    // Rimuovi il prefisso '@/' e aggiungi 'client/src/'
    absoluteImportPath = toImportPath.replace('@/', 'client/src/');
  } else if (toImportPath.startsWith('@shared/')) {
    // Rimuovi il prefisso '@shared/' e aggiungi 'shared/'
    absoluteImportPath = toImportPath.replace('@shared/', 'shared/');
  } else if (toImportPath.startsWith('@assets/')) {
    // Rimuovi il prefisso '@assets/' e aggiungi 'attached_assets/'
    absoluteImportPath = toImportPath.replace('@assets/', 'attached_assets/');
  } else {
    return toImportPath; // Non modificare altri tipi di import
  }
  
  // Calcola il percorso relativo
  const fromDir = path.dirname(fromFilePath);
  let relativePath = path.relative(fromDir, absoluteImportPath);
  
  // Assicurati che inizi con ./ o ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }
  
  return relativePath;
}

// Funzione principale per convertire gli import in un file
function convertImportsInFile(filePath) {
  try {
    // Leggi il contenuto del file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Cerca tutte le importazioni con alias (@/, @shared/, @assets/)
    const importRegex = /from\s+['"](@[^\/]+\/[^'"]+)['"]/g;
    const matches = [...content.matchAll(importRegex)];
    
    if (matches.length === 0) {
      return; // Nessuna corrispondenza, salta questo file
    }
    
    console.log(`Elaborazione di ${filePath}, trovati ${matches.length} import da convertire`);
    
    // Sostituisci ogni importazione con il percorso relativo
    matches.forEach(match => {
      const fullMatch = match[0]; // L'intera stringa 'from "@.../path/to/module"'
      const importPath = match[1]; // Il percorso di importazione completo '@.../path/to/module'
      const relativePath = getRelativePath(filePath, importPath);
      
      // Crea la nuova stringa di importazione
      const newImport = fullMatch.replace(importPath, relativePath);
      
      // Sostituisci nel contenuto
      content = content.replace(fullMatch, newImport);
      
      console.log(`  Convertito: ${importPath} -> ${relativePath}`);
    });
    
    // Scrivi il contenuto aggiornato nel file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`File ${filePath} aggiornato con successo.\n`);
    
  } catch (error) {
    console.error(`Errore nell'elaborazione del file ${filePath}:`, error);
  }
}

// Funzione per processare tutti i file
async function processAllFiles() {
  try {
    // Trova tutti i file TypeScript e JavaScript in client/src
    const files = await glob('client/src/**/*.{ts,tsx,js,jsx}');
    
    console.log(`Trovati ${files.length} file da processare.\n`);
    
    // Converti gli import in ogni file
    files.forEach(convertImportsInFile);
    
    console.log('Conversione completata!');
    
  } catch (error) {
    console.error('Errore durante l\'elaborazione dei file:', error);
  }
}

// Esegui lo script
processAllFiles();