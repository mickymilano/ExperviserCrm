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
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossibile caricare Google Maps API'));
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
  types = ['geocode', 'establishment']
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [internalValue, setInternalValue] = useState(value);
  
  // Utilizziamo refs per i callbacks per evitare re-render inutili
  const onChangeRef = useRef(onChange);
  const onCountrySelectRef = useRef(onCountrySelect);
  
  // Aggiorniamo i ref quando le props cambiano
  useEffect(() => {
    onChangeRef.current = onChange;
    onCountrySelectRef.current = onCountrySelect;
  }, [onChange, onCountrySelect]);
  
  // Aggiorna il valore interno quando il valore della prop cambia
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Effetto per recuperare la chiave API
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getGoogleMapsApiKey();
        setApiKey(key);
        if (!key) setError('API key non disponibile');
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
  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places || !apiKey) {
      return;
    }
    
    try {
      console.log("[PlacesAutocomplete] Initializing Google Maps Autocomplete");
      
      // Pulizia di container pre-esistenti per evitare problemi
      try {
        document.querySelectorAll('.pac-container').forEach(container => {
          if (container && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        });
      } catch (err) {
        console.error('[PlacesAutocomplete] Error cleaning up existing containers:', err);
      }
      
      // Configura le opzioni dell'autocomplete
      const options: google.maps.places.AutocompleteOptions = {
        fields: ['address_components', 'formatted_address', 'name', 'place_id', 'geometry'],
        componentRestrictions: { country: 'it' }
      };

      if (types && types.length > 0) {
        options.types = types;
      }
      
      // Crea una nuova istanza di autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
      autocompleteRef.current = autocomplete;
      
      // FONDAMENTALE: Aggiungiamo il listener per l'evento place_changed
      const placeChangedHandler = () => {
        try {
          console.log('[PlacesAutocomplete] place_changed event triggered!');
          
          if (!autocompleteRef.current) {
            console.error('[PlacesAutocomplete] No autocomplete reference');
            return;
          }
          
          const place = autocompleteRef.current.getPlace();
          if (!place || !place.place_id) {
            console.warn('[PlacesAutocomplete] Invalid place selected');
            return;
          }
          
          console.log('[PlacesAutocomplete] Place selected:', place.name || place.formatted_address);
          
          // Per la barra di ricerca, mostra sia il nome che l'indirizzo separati da una virgola
          const valueToUse = place.name 
            ? `${place.name}${place.formatted_address ? `, ${place.formatted_address}` : ''}`
            : (place.formatted_address || value);
          
          // Aggiorna il valore interno
          setInternalValue(valueToUse);
        
          // Invoca il callback onChange con il valore e i dettagli
          if (onChangeRef.current) {
            console.log('[PlacesAutocomplete] Calling onChange callback');
            setTimeout(() => {
              onChangeRef.current!(valueToUse, place);
            }, 100);
          }
          
          // Gestisce il callback per il paese se specificato
          if (onCountrySelectRef.current && place.address_components) {
            const countryComponent = place.address_components.find(
              component => component.types.includes('country')
            );
            
            if (countryComponent) {
              onCountrySelectRef.current(countryComponent.long_name);
            }
          }
        } catch (error) {
          console.error('[PlacesAutocomplete] Error in place_changed handler:', error);
        }
      };
      
      // Aggiungi il listener
      const listener = autocomplete.addListener('place_changed', placeChangedHandler);
      console.log('[PlacesAutocomplete] place_changed listener added');
      
      // Aggiungiamo gestori eventi per catturare i click sui suggerimenti
      setTimeout(() => {
        try {
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            console.log('[PlacesAutocomplete] Found .pac-container, adding event handlers');
            
            // Impedisci che i click nel container si propaghino e chiudano il modale
            pacContainer.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              
              // Trova l'elemento .pac-item più vicino (il suggerimento su cui si è fatto clic)
              const pacItem = (e.target as HTMLElement).closest('.pac-item');
              if (pacItem && autocompleteRef.current) {
                console.log('[PlacesAutocomplete] Click su .pac-item, triggering place_changed');
                setTimeout(() => {
                  if (autocompleteRef.current) {
                    // @ts-ignore
                    window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
                  }
                }, 100);
              }
            }, true);
            
            // Impedisci che il container si chiuda quando si interagisce con esso
            pacContainer.addEventListener('mousedown', (e) => {
              e.stopPropagation();
            }, true);
            
            // Gestori eventi specifici per dispositivi touch
            ['touchstart', 'touchend'].forEach(eventType => {
              pacContainer.addEventListener(eventType, (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const pacItem = (e.target as HTMLElement).closest('.pac-item');
                if (pacItem && autocompleteRef.current) {
                  console.log(`[PlacesAutocomplete] ${eventType} su .pac-item, triggering place_changed`);
                  setTimeout(() => {
                    if (autocompleteRef.current) {
                      // @ts-ignore
                      window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
                    }
                  }, 100);
                }
              }, true);
            });
          } else {
            console.warn('[PlacesAutocomplete] No .pac-container found');
          }
        } catch (err) {
          console.error('[PlacesAutocomplete] Error setting up container event handlers:', err);
        }
      }, 1000);
      
      // Aggiungi anche un listeners globale per catturare tutti i click sui suggerimenti
      const handlePacEvent = (e: Event) => {
        const target = e.target as HTMLElement;
        const isPacItem = target.closest('.pac-item');
        const isPacContainer = target.closest('.pac-container');
        
        if (isPacItem || isPacContainer) {
          console.log('[PlacesAutocomplete] Global handler caught event on pac element');
          e.stopPropagation();
          e.preventDefault();
          
          if (e instanceof MouseEvent) e.stopImmediatePropagation();
          
          if (isPacItem && autocompleteRef.current) {
            console.log('[PlacesAutocomplete] Global handler triggering place_changed');
            setTimeout(() => {
              if (autocompleteRef.current) {
                // @ts-ignore
                window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
              }
            }, 100);
          }
        }
      };
      
      // Aggiungi listeners globali
      document.addEventListener('click', handlePacEvent, true);
      document.addEventListener('touchstart', handlePacEvent, true);
      document.addEventListener('touchend', handlePacEvent, true);
      
      // Cleanup al dismount
      return () => {
        try {
          console.log('[PlacesAutocomplete] Cleaning up');
          
          // Rimuovi i listener globali
          document.removeEventListener('click', handlePacEvent, true);
          document.removeEventListener('touchstart', handlePacEvent, true);
          document.removeEventListener('touchend', handlePacEvent, true);
          
          // Rimuovi il listener di place_changed
          if (window.google?.maps?.event && listener) {
            window.google.maps.event.removeListener(listener);
          }
          
          // Pulisci l'istanza di autocomplete
          if (autocompleteRef.current && window.google?.maps?.event) {
            // @ts-ignore
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            autocompleteRef.current = null;
          }
          
          // Rimuovi eventuali container PAC rimasti
          try {
            document.querySelectorAll('.pac-container').forEach(container => {
              if (container && container.parentNode) {
                container.parentNode.removeChild(container);
              }
            });
          } catch (err) {
            // Ignora errori di pulizia
          }
        } catch (cleanupErr) {
          console.error('[PlacesAutocomplete] Error during cleanup:', cleanupErr);
        }
      };
    } catch (error) {
      console.error('[PlacesAutocomplete] Error initializing autocomplete:', error);
    }
  }, [scriptLoaded, apiKey, types, value]);
  
  // Gestisce l'aggiornamento manuale dell'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };
  
  // Gestisce l'interazione con l'input
  const handleInputInteraction = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  return (
    <div className={`relative w-full ${error ? 'has-error' : ''}`}>
      <Input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onClick={handleInputInteraction}
        onTouchStart={handleInputInteraction}
        placeholder={placeholder}
        className={className}
        id={id}
        autoComplete="off"
      />
      {error && (
        <p className="text-sm text-red-500 pt-1">{error}</p>
      )}
    </div>
  );
}