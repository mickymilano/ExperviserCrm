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
  
  console.log('[PlacesAutocomplete] Component RENDERED. Props received (value):', value, 'apiKey available:', !!apiKey, 'scriptLoaded:', scriptLoaded);
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
    console.log('[PlacesAutocomplete] Autocomplete Initialization EFFECT RUNNING. Dependencies: scriptLoaded:', 
      scriptLoaded, 'apiKey:', !!apiKey, 'types:', types, 'inputRef.current:', !!inputRef.current);

    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places || !apiKey) {
      console.warn('[PlacesAutocomplete] ABORTING Autocomplete init: Missing dependencies.');
      return;
    }
    
    try {
      console.log("[PlacesAutocomplete] Initializing Google Maps Autocomplete with types:", types);
      
      // Pulisci eventuali istanze precedenti
      if (autocompleteRef.current) {
        console.log('[PlacesAutocomplete] Previous autocomplete instance exists, will be replaced');
        // Non proviamo a usare clearInstanceListeners che potrebbe causare errori
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
      
      // Gestione eventi tastiera
      inputRef.current!.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          e.stopPropagation();
          if (autocompleteRef.current) {
            try {
              // @ts-ignore
              window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
            } catch (err) {
              console.error('[PlacesAutocomplete] Error triggering place_changed event:', err);
            }
          }
        }
        // ArrowUp/Down lasciali passare (non fare e.preventDefault())
      });
      
      console.log("[PlacesAutocomplete] Autocomplete instance CREATED:", autocompleteRef.current);
      
      // Gestione click/touch sul container del dropdown
      // Aggiungi un gestore di eventi globale per catturare tutti i click sui suggerimenti
      const clickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isPacItem = target.closest('.pac-item');
        const isPacContainer = target.closest('.pac-container');
        
        if (isPacItem || isPacContainer) {
          e.preventDefault();
          e.stopPropagation();
          
          // Evita che l'evento di click possa chiudere il modal
          e.stopImmediatePropagation();
          
          console.log('[PlacesAutocomplete] Intercettato click su suggerimento:', target);
          
          if (isPacItem && autocompleteRef.current) {
            try {
              // @ts-ignore
              window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
            } catch (err) {
              console.error('[PlacesAutocomplete] Error triggering place_changed on click:', err);
            }
          }
        }
      };
      
      // Aggiungi il listener globale
      document.addEventListener('click', clickHandler, true);
      document.addEventListener('touchend', clickHandler, true);
      
      // Pulisci i listener quando il componente viene smontato
      cleanupRef.current.push(() => {
        document.removeEventListener('click', clickHandler, true);
        document.removeEventListener('touchend', clickHandler, true);
      });
      
      setTimeout(() => {
        const container = document.querySelector('.pac-container');
        if (container) {
          console.log('[PlacesAutocomplete] Container trovato, aggiungo gestori eventi');
          
          // Aggiungi il gestore al container stesso (aggiuntivo rispetto al gestore globale)
          container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const item = (e.target as HTMLElement).closest('.pac-item');
            if (item && autocompleteRef.current) {
              try {
                // @ts-ignore
                window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
              } catch (err) {
                console.error('[PlacesAutocomplete] Error triggering place_changed on click:', err);
              }
            }
          }, true);
          
          container.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const item = (e.target as HTMLElement).closest('.pac-item');
            if (item && autocompleteRef.current) {
              try {
                // @ts-ignore
                window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
              } catch (err) {
                console.error('[PlacesAutocomplete] Error triggering place_changed on touchend:', err);
              }
            }
          }, true);
        }
      }, 1000); // Attendi che il container venga creato

      // FONDAMENTALE: Aggiungiamo il listener per l'evento place_changed
      const listener = autocomplete.addListener('place_changed', () => {
        // Non possiamo usare stopPropagation qui perchè l'evento place_changed non fornisce un evento DOM
        console.log('[PlacesAutocomplete] place_changed EVENT DETECTED!'); // Log cruciale
        
        if (!autocompleteRef.current) {
          console.error('[PlacesAutocomplete] ERROR: autocompleteRef.current is NULL/undefined inside place_changed listener!');
          return;
        }
        
        const place = autocompleteRef.current.getPlace();
        console.log('[PlacesAutocomplete] place_changed - getPlace() raw result:', JSON.stringify(place, null, 2));
        
        if (!place || !place.place_id) {
          console.warn('[PlacesAutocomplete] place_changed - Invalid place or no place_id. Current input value:', inputRef.current?.value);
          return;
        }
        
        // Determina il valore da utilizzare per il campo
        const valueToUse = place.name || place.formatted_address || value;
        console.log('[PlacesAutocomplete] place_changed - Value to use for form:', valueToUse, 'Calling parent onChange...');
        
        // Invoca il callback onChange con il valore e i dettagli del luogo
        // Utilizziamo onChangeRef.current per accedere alla versione più aggiornata
        if (onChangeRef.current) {
          console.log("[PlacesAutocomplete] Calling onChange callback with place data");
          
          // Aggiunto fix per impedire la chiusura del modal
          const origValue = value;
          setTimeout(() => {
            try {
              // Evita di fare blur perché può causare la chiusura prematura
              onChangeRef.current(valueToUse, place);
              
              console.log('[PlacesAutocomplete] onChange callback eseguito con successo');
              
              // Attendi un po' prima di chiudere il dropdown
              setTimeout(() => {
                try {
                  // Rimuovi manualmente la classe pac-container solo se necessario
                  const containers = document.querySelectorAll('.pac-container');
                  console.log('[PlacesAutocomplete] Rimozione pac-containers:', containers.length);
                } catch(err) {
                  console.error('[PlacesAutocomplete] Errore pulizia finale:', err);
                }
              }, 500);
            } catch(err) {
              console.error('[PlacesAutocomplete] Errore in onChange:', err);
              // In caso di errore, ripristina almeno il valore visibile
              if (inputRef.current) {
                inputRef.current.value = origValue;
              }
            }
          }, 0);
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
      
      console.log('[PlacesAutocomplete] place_changed listener ADDED successfully.');
      
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
  }, [scriptLoaded, apiKey, types, onChange, onCountrySelect]); // Per diagnostica, includiamo temporaneamente onChange e onCountrySelect

  // Gestisce l'aggiornamento manuale dell'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Evita che la selezione del testo chiuda il modale
    e.stopPropagation();
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div 
      className="places-autocomplete relative"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Input
        ref={inputRef}
        id={id}
        value={value}
        placeholder={placeholder}
        className={`${className}`}
        aria-label={placeholder}
        onChange={handleInputChange}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        onSelect={(e) => e.stopPropagation()}
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
          pointer-events: auto !important;
        }
        .pac-item {
          padding: 0.5rem;
          cursor: pointer !important;
          pointer-events: auto !important;
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