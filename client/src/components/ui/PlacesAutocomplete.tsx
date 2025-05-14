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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const onChangeRef = useRef(onChange); // Usiamo un ref per evitare che "onChange" causi render multipli
  const onCountrySelectRef = useRef(onCountrySelect); // Lo stesso per "onCountrySelect"

  // Aggiorniamo i ref quando le props cambiano
  useEffect(() => {
    onChangeRef.current = onChange;
    onCountrySelectRef.current = onCountrySelect;
  }, [onChange, onCountrySelect]);

  // Effetto per recuperare la chiave API
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getGoogleMapsApiKey();
        setApiKey(key);
        
        if (!key) {
          setError('API key non disponibile');
        }
      } catch (err) {
        console.error('Errore recupero Google Maps API key:', err);
        setError('Impossibile recuperare API key');
      }
    };
    
    fetchApiKey();
  }, []);

  // Effetto per caricare lo script Google Maps quando abbiamo la chiave API
  useEffect(() => {
    if (!apiKey) return;

    const initGoogleMaps = async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        setScriptLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Errore caricamento script Google Maps:', err);
        setError('Impossibile caricare Google Maps');
      }
    };

    initGoogleMaps();
  }, [apiKey]);

  // Effetto per inizializzare l'autocomplete quando lo script è caricato
  // IMPORTANTE: Riduciamo il numero di dipendenze per evitare re-inizializzazioni frequenti
  useEffect(() => {
    console.log('[PlacesAutocomplete] EFFECT RUNNING: Initializing/Re-initializing Autocomplete. ScriptLoaded:', 
      scriptLoaded, 'APIKey:', !!apiKey, 'InputRef:', !!inputRef.current);
      
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places) {
      console.log("[PlacesAutocomplete] Missing dependencies for autocomplete initialization", {
        scriptLoaded,
        inputElement: !!inputRef.current,
        googlePlaces: !!window.google?.maps?.places
      });
      return;
    }
    
    try {
      console.log("[PlacesAutocomplete] Initializing Google Maps Autocomplete with types:", types);
      
      // Pulisci eventuali istanze precedenti
      if (autocompleteRef.current) {
        console.log("[PlacesAutocomplete] Cleaning up previous instance");
        // Rimuoviamo eventuali listener ma senza usare clearInstanceListeners
        // che potrebbe non essere disponibile
      }

      // Configura le opzioni dell'autocomplete
      const options: google.maps.places.AutocompleteOptions = {
        fields: ['address_components', 'formatted_address', 'name', 'place_id', 'geometry'],
        componentRestrictions: { country: 'it' }
      };

      // Aggiungi i tipi di luogo se specificati
      if (types && types.length > 0) {
        options.types = types;
      }
      
      // Crea una nuova istanza di autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
      autocompleteRef.current = autocomplete;
      
      console.log("[PlacesAutocomplete] Autocomplete instance CREATED:", autocompleteRef.current);

      // FONDAMENTALE: Aggiungiamo il listener per l'evento place_changed
      const listener = autocomplete.addListener('place_changed', () => {
        console.log('[PlacesAutocomplete] place_changed EVENT FIRED!'); // Log cruciale
        
        if (!autocompleteRef.current) {
          console.error('[PlacesAutocomplete] autocompleteRef.current is NULL inside place_changed listener!');
          return;
        }
        
        const place = autocompleteRef.current.getPlace();
        console.log('[PlacesAutocomplete] place_changed - getPlace() result:', place);
        
        if (!place || !place.place_id) {
          console.warn("[PlacesAutocomplete] Invalid place selected or no place_id available");
          return;
        }
        
        // Determina il valore da utilizzare per il campo
        const valueToUse = place.name || place.formatted_address || value;
        console.log("[PlacesAutocomplete] Using value for field:", valueToUse);
        
        // Invoca il callback onChange con il valore e i dettagli del luogo
        // Utilizziamo onChangeRef.current per accedere alla versione più aggiornata
        if (onChangeRef.current) {
          console.log("[PlacesAutocomplete] Calling onChange callback with place data");
          onChangeRef.current(valueToUse, place);
        }
        
        // Gestisce il callback per il paese se specificato
        if (onCountrySelectRef.current && place.address_components) {
          const countryComponent = place.address_components.find(
            component => component.types.includes('country')
          );
          
          if (countryComponent) {
            console.log("[PlacesAutocomplete] Country component found:", countryComponent.long_name);
            onCountrySelectRef.current(countryComponent.long_name);
          }
        }
      });
      
      console.log('[PlacesAutocomplete] place_changed listener ADDED.');
      
      // Cleanup al dismount
      return () => {
        if (window.google?.maps?.event && listener) {
          console.log('[PlacesAutocomplete] CLEANUP: Removing place_changed listener.');
          window.google.maps.event.removeListener(listener);
          
          if (autocompleteRef.current) {
            console.log('[PlacesAutocomplete] CLEANUP: Setting Autocomplete instance to null.');
            // Rimuoviamo il riferimento all'istanza
            autocompleteRef.current = null;
          }
        }
      };
    } catch (err) {
      console.error('[PlacesAutocomplete] Error initializing Google Maps Autocomplete:', err);
      setError('Impossibile inizializzare Google Maps Autocomplete');
    }
  }, [scriptLoaded, types, apiKey]); // Rimosse dipendenze onChange, onCountrySelect, value

  // Gestisce l'aggiornamento manuale dell'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className="places-autocomplete relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        placeholder={placeholder}
        className={`${className}`}
        aria-label={placeholder}
        onChange={handleInputChange}
        autoComplete="off"
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        /* Stili per il dropdown di Google Maps Autocomplete */
        .pac-container {
          border-radius: 0.375rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 9999 !important;
        }
        .pac-item {
          padding: 0.5rem;
          cursor: pointer !important;
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