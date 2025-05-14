import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { getGoogleMapsApiKey } from '@/lib/environment';

// Definisce le proprietà del componente
interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onCountrySelect?: (country: string) => void;
  types?: string[]; // Array di tipi di luoghi supportati da Google (es. ['address', 'establishment'])
}

// Versione semplificata di caricamento script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Se Google Maps è già caricato, risolvi immediatamente
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Google Maps già disponibile');
      resolve();
      return;
    }

    // Rimuovi script esistenti per evitare duplicati
    document.querySelectorAll('script[src*="maps.googleapis.com"]')
      .forEach(script => script.remove());
    
    // Crea nuovo script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    
    // Gestisci caricamento ed errori
    script.onload = () => {
      console.log('Google Maps caricato con successo');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Errore caricamento Google Maps API');
      reject(new Error('Impossibile caricare Google Maps API'));
    };
    
    // Aggiungi script al documento
    document.head.appendChild(script);
  });
};

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Cerca indirizzo...',
  className = '',
  id,
  onCountrySelect,
  types = ['establishment']
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placesApiLoaded, setPlacesApiLoaded] = useState(false);

  // Effetto per caricare la chiave API e lo script Google Maps
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        // Ottieni la chiave API
        const apiKey = await getGoogleMapsApiKey();
        
        if (!apiKey) {
          setError('API key non disponibile');
          return;
        }
        
        // Carica lo script Google Maps
        await loadGoogleMapsScript(apiKey);
        setScriptLoaded(true);
        setPlacesApiLoaded(!!window.google?.maps?.places);
        setError(null);
      } catch (err) {
        console.error('Errore inizializzazione Google Maps:', err);
        setError('Impossibile inizializzare Google Maps');
      }
    };
    
    initializeGoogleMaps();
  }, []);

  // Inizializza autocomplete quando lo script è caricato
  useEffect(() => {
    // Esci se lo script non è caricato o manca l'input
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places) {
      return;
    }
    
    try {
      console.log("Initializing autocomplete with types:", types);

      // Configura le opzioni di Autocomplete
      const options: google.maps.places.AutocompleteOptions = {
        fields: ['address_components', 'formatted_address', 'name', 'place_id', 'geometry'],
        componentRestrictions: { country: 'it' }
      };

      // Aggiungi i tipi di luogo se specificati
      if (types && types.length > 0) {
        options.types = types;
      }
      
      // Crea l'istanza di autocomplete con le opzioni specificate
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
      
      // Salva il riferimento
      autocompleteRef.current = autocomplete;
      
      // Aggiungi listener per i cambiamenti di place
      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log("Place selected:", place);
        
        // Verifica che abbiamo un place valido
        if (!place || !place.place_id) {
          console.warn("No valid place received from Autocomplete");
          return;
        }
        
        // Usa l'indirizzo formattato, il nome o il valore corrente
        const valueToUse = place.name || place.formatted_address || value;
        console.log("Using value:", valueToUse);
        
        // Chiama il callback di onChange con i dettagli completi del place
        onChange(valueToUse, place);
        
        // Estrai e notifica il paese se richiesto
        if (onCountrySelect && place.address_components) {
          const countryComponent = place.address_components.find(
            component => component.types.includes('country')
          );
          
          if (countryComponent) {
            console.log("Country found:", countryComponent.long_name);
            onCountrySelect(countryComponent.long_name);
          }
        }
      });
      
      // Cleanup al dismount
      return () => {
        if (window.google && window.google.maps && window.google.maps.event) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      console.error('Errore inizializzazione autocomplete:', err);
      setError('Impossibile inizializzare l\'autocomplete');
    }
  }, [scriptLoaded, onChange, onCountrySelect, types, value]);

  return (
    <div className="places-autocomplete relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        placeholder={placeholder}
        className={`${className} ${placesApiLoaded ? 'pac-target-input' : ''}`}
        aria-label={placeholder}
        onChange={(e) => {
          // Chiama onChange solo per gli input manuali
          onChange(e.target.value);
        }}
        autoComplete="off"
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        /* Stili per il dropdown di Google Places Autocomplete */
        .pac-container {
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 9999;
        }
        .pac-item {
          padding: 0.5rem;
          cursor: pointer;
        }
        .pac-item:hover {
          background-color: #f7fafc;
        }
        .pac-item-selected {
          background-color: #edf2f7;
        }
      `}} />
    </div>
  );
}