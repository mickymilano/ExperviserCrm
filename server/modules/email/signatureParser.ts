import * as cheerio from 'cheerio';

interface SignatureData {
  name?: string;
  position?: string;
  company?: string;
  phone?: string;
  mobilePhone?: string;
  officePhone?: string;
  email?: string;
  website?: string;
  address?: string;
  linkedin?: string;
  rawText?: string;
}

/**
 * Estrae i dati da una firma email in formato testo o HTML
 */
export function extractSignatureData(textBody: string, htmlBody: string): SignatureData {
  // Prima prova a estrarre dalla versione HTML (più strutturata)
  const htmlData = htmlBody ? extractFromHtml(htmlBody) : {};
  
  // Poi estrai dalla versione testuale (come fallback o per dati aggiuntivi)
  const textData = extractFromText(textBody);
  
  // Unisci i dati dando precedenza alla versione HTML quando disponibile
  return {
    ...textData,
    ...htmlData,
    rawText: findSignatureText(textBody)
  };
}

/**
 * Estrae i dati da una firma in formato HTML
 */
function extractFromHtml(html: string): Partial<SignatureData> {
  const data: Partial<SignatureData> = {};
  
  try {
    // Carica l'HTML con cheerio
    const $ = cheerio.load(html);
    
    // Cerca blocchi di firma comuni
    const signatureBlocks = $('div.signature, .signature, div[data-smartmail="gmail_signature"]');
    
    if (signatureBlocks.length > 0) {
      // Se abbiamo trovato un blocco firma, estrai i dati da lì
      const signatureHtml = signatureBlocks.html() || '';
      const signatureText = signatureBlocks.text();
      
      // Estrai i dati dal testo della firma
      const extractedData = extractFromText(signatureText);
      Object.assign(data, extractedData);
      
      // Cerca link specifici (email, telefono, sito web)
      signatureBlocks.find('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        
        if (href.startsWith('mailto:')) {
          data.email = href.replace('mailto:', '').split('?')[0];
        } else if (href.startsWith('tel:')) {
          // Determina se è cellulare o fisso in base al contenuto
          const phoneNumber = href.replace('tel:', '').replace(/[^+0-9]/g, '');
          if (text.toLowerCase().includes('cell') || text.toLowerCase().includes('mobile')) {
            data.mobilePhone = phoneNumber;
          } else if (text.toLowerCase().includes('office') || text.toLowerCase().includes('ufficio')) {
            data.officePhone = phoneNumber;
          } else {
            data.phone = phoneNumber;
          }
        } else if (href.includes('linkedin.com')) {
          data.linkedin = href;
        } else if (isWebsiteUrl(href) && !href.includes('linkedin.com')) {
          data.website = href;
        }
      });
      
      // Cerca nome e posizione nei primi elementi
      let possibleNamePosition = '';
      signatureBlocks.find('p, div, span').slice(0, 3).each((i, el) => {
        const text = $(el).text().trim();
        if (text && !possibleNamePosition && text.length < 50 && !text.includes('@') && !isWebsiteUrl(text)) {
          possibleNamePosition = text;
        }
      });
      
      // Dividi il testo per trovare nome e posizione
      if (possibleNamePosition) {
        const lines = possibleNamePosition.split(/\n|\r|<br>/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          // Il primo elemento è probabilmente il nome
          if (!data.name) data.name = lines[0];
          // Il secondo elemento è probabilmente la posizione
          if (lines.length > 1 && !data.position) data.position = lines[1];
        }
      }
    } else {
      // Se non troviamo un blocco firma esplicito, cerca alla fine dell'email
      const allParagraphs = $('p, div');
      // Prendi gli ultimi 5 paragrafi che potrebbero contenere una firma
      const lastParagraphs = allParagraphs.slice(Math.max(0, allParagraphs.length - 5));
      
      let signatureHtml = '';
      lastParagraphs.each((i, el) => {
        const text = $(el).text().trim();
        // Verifica se sembra una firma (contiene email, telefono, o un nome formattato)
        if (text.includes('@') || /tel[:.]/i.test(text) || /^\s*[A-Z][a-z]+\s+[A-Z][a-z]+\s*$/.test(text)) {
          signatureHtml += $(el).html() || '';
        }
      });
      
      if (signatureHtml) {
        const $sig = cheerio.load(signatureHtml);
        const extractedData = extractFromText($sig.text());
        Object.assign(data, extractedData);
      }
    }
  } catch (error) {
    console.error('Errore durante l\'analisi HTML della firma:', error);
  }
  
  return data;
}

/**
 * Estrae i dati da una firma in formato testo
 */
function extractFromText(text: string): Partial<SignatureData> {
  const data: Partial<SignatureData> = {};
  
  // Prima cerca la parte che contiene la firma
  const signatureText = findSignatureText(text);
  if (!signatureText) return data;
  
  // Array di righe della firma
  const lines = signatureText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  
  // Estrai nome (generalmente la prima riga non vuota che non è un'email o URL)
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    if (lines[i] && !lines[i].includes('@') && !isWebsiteUrl(lines[i]) && !isPhoneNumber(lines[i])) {
      data.name = lines[i];
      break;
    }
  }
  
  // Estrai posizione (generalmente la seconda riga dopo il nome)
  if (data.name) {
    const nameIndex = lines.findIndex(line => line === data.name);
    if (nameIndex >= 0 && nameIndex + 1 < lines.length) {
      const nextLine = lines[nameIndex + 1];
      if (!nextLine.includes('@') && !isWebsiteUrl(nextLine) && !isPhoneNumber(nextLine)) {
        data.position = nextLine;
      }
    }
  }
  
  // Estrai nome azienda (cerca dopo la posizione, di solito la terza riga)
  if (data.position) {
    const positionIndex = lines.findIndex(line => line === data.position);
    if (positionIndex >= 0 && positionIndex + 1 < lines.length) {
      const nextLine = lines[positionIndex + 1];
      if (!nextLine.includes('@') && !isWebsiteUrl(nextLine) && !isPhoneNumber(nextLine)) {
        data.company = nextLine;
      }
    }
  }
  
  // Estrai email
  const emailMatch = signatureText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) {
    data.email = emailMatch[0];
  }
  
  // Estrai telefono
  const phoneMatches = [
    // Formato internazionale
    ...signatureText.matchAll(/(?:Tel|Ph|Phone|T)(?:one)?[\s.:-]+(\+\d[\d\s.-]{6,})/gi),
    // Formato mobile/cellulare
    ...signatureText.matchAll(/(?:Mob|Cell|Mobile|M)(?:ile)?[\s.:-]+(\+?\d[\d\s.-]{6,})/gi),
    // Formato generico
    ...signatureText.matchAll(/\b(?:\+\d{1,4}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?)?(?:\d{1,5}[\s.-]?\d{1,5})\b/g)
  ];
  
  if (phoneMatches.length > 0) {
    for (const match of phoneMatches) {
      if (match[0].toLowerCase().includes('mob') || match[0].toLowerCase().includes('cell')) {
        data.mobilePhone = match[1] || match[0].replace(/[^\d+]/g, '');
      } else if (match[0].toLowerCase().includes('tel') || match[0].toLowerCase().includes('phone')) {
        data.officePhone = match[1] || match[0].replace(/[^\d+]/g, '');
      } else if (!data.phone) {
        data.phone = match[0].replace(/[^\d+]/g, '');
      }
    }
  }
  
  // Estrai sito web
  const urlMatch = signatureText.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?:\/[^\s]*)?/i);
  if (urlMatch && !urlMatch[0].includes('linkedin.com')) {
    data.website = urlMatch[0];
  }
  
  // Estrai LinkedIn
  const linkedinMatch = signatureText.match(/(?:linkedin\.com\/in\/|linkedin\.com\/company\/)([^\s\/]+)/i);
  if (linkedinMatch) {
    data.linkedin = `https://www.linkedin.com/in/${linkedinMatch[1]}`;
  }
  
  // Estrai indirizzo
  // Cerca righe che sembrano contenere un indirizzo
  for (let i = 0; i < lines.length; i++) {
    // Cerca pattern comuni di indirizzi (numeri civici, CAP, etc.)
    if (/\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+/.test(lines[i]) || // Via Roma 123, Milano
        /\d{5}\s+[A-Za-z\s]+/.test(lines[i])) {              // 20123 Milano
      data.address = lines[i];
      // Prova a includere anche la riga successiva se sembra parte dell'indirizzo
      if (i + 1 < lines.length && /^[A-Za-z\s]+,\s*[A-Za-z\s]+$/.test(lines[i + 1])) {
        data.address += ', ' + lines[i + 1];
      }
      break;
    }
  }
  
  return data;
}

/**
 * Identifica la parte del testo che contiene la firma
 */
function findSignatureText(text: string): string {
  // Pulisci il testo
  const cleanText = text.trim();
  
  // Cerca separatori comuni di firma
  const signatureSeparators = [
    /^--\s*$/m,                // -- 
    /^-{2,}\s*$/m,             // ---- 
    /^_{2,}\s*$/m,             // ____ 
    /^={2,}\s*$/m,             // ==== 
    /^[*]{2,}\s*$/m,           // **** 
    /^[|]{2,}\s*$/m,           // |||| 
    /^Best Regards,\s*$/mi,    // Best Regards,
    /^Regards,\s*$/mi,         // Regards,
    /^Cordiali saluti,\s*$/mi, // Cordiali saluti,
    /^Saluti,\s*$/mi,          // Saluti,
    /^Cordialmente,\s*$/mi     // Cordialmente,
  ];
  
  // Cerca il separatore nella email
  for (const separator of signatureSeparators) {
    const match = cleanText.match(separator);
    if (match && match.index !== undefined) {
      // Estrai tutto ciò che viene dopo il separatore
      return cleanText.substring(match.index + match[0].length).trim();
    }
  }
  
  // Se non troviamo un separatore esplicito, prendi le ultime 10 righe
  const lines = cleanText.split(/\r?\n/);
  if (lines.length > 10) {
    return lines.slice(-10).join('\n').trim();
  }
  
  // Se l'email è corta, considera l'intero testo
  return cleanText;
}

/**
 * Verifica se una stringa è un URL
 */
function isWebsiteUrl(text: string): boolean {
  return /^(https?:\/\/|www\.)[^\s]+\.[^\s]+$/i.test(text);
}

/**
 * Verifica se una stringa è un numero di telefono
 */
function isPhoneNumber(text: string): boolean {
  return /^[+\d\s().-]{7,}$/.test(text.trim());
}