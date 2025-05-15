import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { getGoogleMapsApiKey } from '@/lib/environment';
import { logError, logMessage } from '@/lib/errorTracking';

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

// Definizione dell'interfaccia per PlaceAutocompleteElement
// Per garantire compatibilità con TypeScript anche se non è inclusa nelle definizioni standard
declare global {
  namespace google.maps.places {
    class PlaceAutocompleteElement extends HTMLElement {
      constructor(options?: PlaceAutocompleteElementOptions);
      value: string;
      getPlace(): PlaceResult;
      addEventListener(type: string, listener: EventListener): void;
      removeEventListener(type: string, listener: EventListener): void;
    }

    interface PlaceAutocompleteElementOptions {
      types?: string[];
      fields?: string[];
      componentRestrictions?: {
        country?: string | string[];
      };
      placeholder?: string;
    }
  }
}

// Dichiariamo la callback globale per TypeScript
declare global {
  interface Window {
    initGoogleMaps?: () => void;
    gmpAutocompleteLoaded?: boolean;
  }
}

// Versione migliorata di caricamento script con supporto esplicito per nuove API
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Prima verificare se l'API è già stata caricata
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('[PlacesAutocomplete] Google Maps API già caricata');
      resolve();
      return;
    }

    console.log('[PlacesAutocomplete] Caricando Google Maps API...');
    
    // Rimuovi eventuali callback globali precedenti
    if (window.initGoogleMaps) {
      console.log('[PlacesAutocomplete] Rimuovo callback precedente');
    }
    
    // Definiamo una callback globale per quando Google Maps è pronto
    window.initGoogleMaps = () => {
      console.log('[PlacesAutocomplete] Google Maps API caricata tramite callback');
      resolve();
    };
    
    // NON rimuoviamo script precedenti, invece usiamo un nuovo ID per lo script
    const scriptId = 'google-maps-script-' + new Date().getTime();
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    // Utilizziamo callback parameter per compatibilità massima
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error('[PlacesAutocomplete] Errore nel caricamento Google Maps API');
      reject(new Error('Impossibile caricare Google Maps API'));
    };
    
    document.head.appendChild(script);
    
    // Aggiungiamo un timeout per sicurezza
    setTimeout(() => {
      if (!window.google?.maps?.places) {
        console.error('[PlacesAutocomplete] Timeout caricamento Google Maps API');
        reject(new Error('Timeout caricamento Google Maps API'));
      }
    }, 10000);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [internalValue, setInternalValue] = useState(value);
  const [autoCompleteInitialized, setAutoCompleteInitialized] = useState(false);
  
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
    if (value !== internalValue) {
      setInternalValue(value);
      
      // Aggiorna anche il valore nel componente Google se è stato inizializzato
      if (autocompleteRef.current && autoCompleteInitialized) {
        autocompleteRef.current.value = value;
      }
    }
  }, [value, autoCompleteInitialized, internalValue]);

  // Effetto per recuperare la chiave API
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getGoogleMapsApiKey();
        setApiKey(key);
        
        // Registriamo in Sentry se la chiave è disponibile o meno (senza esporre la chiave)
        if (!key) {
          setError('API key non disponibile');
          logError(new Error('Google Maps API key non disponibile'), {
            component: 'PlacesAutocomplete',
            field: id || 'unknown',
            types: types?.join(',')
          });
        } else {
          logMessage('Google Maps API key recuperata con successo', {
            component: 'PlacesAutocomplete',
            field: id || 'unknown'
          });
        }
      } catch (err) {
        console.error('Errore recupero Google Maps API key:', err);
        setError('Impossibile recuperare API key');
        logError(err, {
          component: 'PlacesAutocomplete',
          field: id || 'unknown',
          action: 'fetchApiKey'
        });
      }
    };
    
    fetchApiKey();
  }, [id, types]);

  // Effetto per caricare lo script Google Maps quando abbiamo la chiave API
  useEffect(() => {
    if (!apiKey) return;

    const initGoogleMaps = async () => {
      try {
        await loadGoogleMapsScript(apiKey);
        console.log('[PlacesAutocomplete] Script Google Maps caricato con successo');
        setScriptLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Errore caricamento script Google Maps:', err);
        setError('Impossibile caricare Google Maps');
        logError(err, {
          component: 'PlacesAutocomplete',
          action: 'loadScript'
        });
      }
    };

    initGoogleMaps();
  }, [apiKey]);

  // Setup dell'autocomplete usando la versione legacy (ma funzionante) di Autocomplete
  const setupLegacyAutocomplete = () => {
    if (!scriptLoaded || !containerRef.current || !window.google?.maps?.places) {
      return undefined;
    }
    
    try {
      console.log('[PlacesAutocomplete] Initializing legacy Google Maps Autocomplete');
      
      // Assicurati che il container sia vuoto e contiene un input
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        
        // Creiamo un nuovo input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = internalValue;
        input.placeholder = placeholder;
        input.className = className || '';
        input.id = id || 'places-autocomplete-input';
        input.autocomplete = 'off';
        
        containerRef.current.appendChild(input);
        
        // Inizializza l'autocomplete sul nuovo input
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          fields: ['address_components', 'formatted_address', 'name', 'place_id', 'geometry'],
          componentRestrictions: { country: 'it' },
          types: types
        });
        
        // Gestisci l'evento place_changed
        const placeChangedListener = autocomplete.addListener('place_changed', () => {
          try {
            console.log('[PlacesAutocomplete] Legacy place_changed triggered');
            
            const place = autocomplete.getPlace();
            if (!place || !place.place_id) {
              console.warn('[PlacesAutocomplete] Invalid place selected');
              return;
            }
            
            // Per la barra di ricerca, mostra sia il nome che l'indirizzo
            const valueToUse = place.name 
              ? `${place.name}${place.formatted_address ? `, ${place.formatted_address}` : ''}`
              : (place.formatted_address || internalValue);
            
            // Aggiorna il valore interno
            setInternalValue(valueToUse);
            input.value = valueToUse;
            
            // Invoca il callback onChange con il valore e i dettagli
            if (onChangeRef.current) {
              console.log('[PlacesAutocomplete] Calling onChange callback with place');
              onChangeRef.current(valueToUse, place);
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
            console.error('[PlacesAutocomplete] Error in legacy place_changed handler:', error);
          }
        });
        
        // Aggiungi gestori eventi per assicurare l'interazione all'interno dei modali
        input.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        
        input.addEventListener('touchstart', (e) => {
          e.stopPropagation();
        });
        
        input.addEventListener('input', (e) => {
          const newValue = (e.target as HTMLInputElement).value;
          setInternalValue(newValue);
          if (onChangeRef.current) onChangeRef.current(newValue);
        });
        
        // Aggiungiamo gestori eventi per catturare i click sui suggerimenti
        setTimeout(() => {
          try {
            const pacContainer = document.querySelector('.pac-container');
            if (pacContainer) {
              console.log('[PlacesAutocomplete] Found .pac-container, adding event handlers');
              
              // Impedisci che i click nel container si propaghino e chiudano il modale
              pacContainer.addEventListener('click', (e) => {
                e.stopPropagation();
              });
              
              pacContainer.addEventListener('mousedown', (e) => {
                e.stopPropagation();
              });
              
              ['touchstart', 'touchend'].forEach(eventType => {
                pacContainer.addEventListener(eventType, (e) => {
                  e.stopPropagation();
                });
              });
            } else {
              console.warn('[PlacesAutocomplete] No .pac-container found');
            }
          } catch (err) {
            console.error('[PlacesAutocomplete] Error setting up container event handlers:', err);
          }
        }, 1000);
        
        // Cleanup al dismount
        return () => {
          if (window.google?.maps?.event && placeChangedListener) {
            window.google.maps.event.removeListener(placeChangedListener);
          }
          
          try {
            document.querySelectorAll('.pac-container').forEach(container => {
              if (container && container.parentNode) {
                container.parentNode.removeChild(container);
              }
            });
          } catch (err) {
            // Ignora errori di pulizia
          }
        };
      }
    } catch (error) {
      console.error('[PlacesAutocomplete] Error in setupLegacyAutocomplete:', error);
      logError(error, {
        component: 'PlacesAutocomplete',
        action: 'setupLegacyAutocomplete'
      });
      return undefined;
    }
  };

  // Effetto per inizializzare l'autocomplete quando lo script è caricato
  // Utilizziamo la versione legacy che sappiamo funzionare mentre sviluppiamo il supporto alla nuova
  useEffect(() => {
    // Verifica se lo script è caricato e se abbiamo i riferimenti necessari
    if (!scriptLoaded || !containerRef.current) {
      return;
    }
    
    // Inizializza l'autocomplete
    const cleanup = setupLegacyAutocomplete();
    
    // Restituisci la funzione di cleanup se disponibile
    return cleanup || undefined;
  }, [scriptLoaded, apiKey, types, placeholder, internalValue]);

  // Per la modalità fallback, mostreremo un input normale come segnaposto
  if (error && error.includes('modalità compatibilità')) {
    return (
      <div className={`relative w-full has-error`}>
        <Input
          type="text"
          value={internalValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInternalValue(newValue);
            if (onChangeRef.current) onChangeRef.current(newValue);
          }}
          placeholder={placeholder}
          className={className}
          id={id}
          autoComplete="off"
        />
        <p className="text-xs text-amber-500 pt-1">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${error ? 'has-error' : ''}`}>
      <div 
        ref={containerRef} 
        className="places-autocomplete-container w-full"
        style={{ minHeight: '38px' }}
      />
      {error && error !== 'Utilizzando modalità compatibilità' && (
        <p className="text-sm text-red-500 pt-1">{error}</p>
      )}
    </div>
  );
}