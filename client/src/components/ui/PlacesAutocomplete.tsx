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

// Versione migliorata di caricamento script con supporto esplicito per nuove API
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlaceAutocompleteElement) {
      console.log('[PlacesAutocomplete] Google Maps API già caricata');
      resolve();
      return;
    }

    console.log('[PlacesAutocomplete] Caricando Google Maps API...');
    // Rimuovi eventuali script precedenti per evitare problemi
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => script.remove());

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    
    // Definiamo una callback globale per quando Google Maps è pronto
    window.initGoogleMaps = () => {
      console.log('[PlacesAutocomplete] Google Maps API caricata tramite callback');
      resolve();
    };
    
    script.onerror = () => {
      console.error('[PlacesAutocomplete] Errore nel caricamento Google Maps API');
      reject(new Error('Impossibile caricare Google Maps API'));
    };
    
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

  // Effetto per creare il componente PlaceAutocompleteElement quando lo script è caricato
  useEffect(() => {
    // Verifichiamo che lo script sia caricato e che il container sia nel DOM
    if (!scriptLoaded || !containerRef.current || !window.google?.maps?.places?.PlaceAutocompleteElement) {
      if (scriptLoaded) {
        console.warn('[PlacesAutocomplete] Script caricato ma PlaceAutocompleteElement non disponibile');
        
        // Verificare la disponibilità di PlaceAutocompleteElement
        if (!window.google?.maps?.places?.PlaceAutocompleteElement) {
          logError(new Error('PlaceAutocompleteElement non disponibile'), {
            component: 'PlacesAutocomplete',
            field: id || 'unknown',
          });
          
          // Fallback al vecchio metodo di autocomplete se disponibile
          if (window.google?.maps?.places?.Autocomplete) {
            console.log('[PlacesAutocomplete] Fallback a Autocomplete classico');
            initializeLegacyAutocomplete();
          }
        }
      }
      return;
    }
    
    try {
      console.log('[PlacesAutocomplete] Initializing Google Maps PlaceAutocompleteElement');
      // Monitoraggio per l'inizializzazione dell'autocomplete
      logMessage("Initializing Google Maps PlaceAutocompleteElement", {
        component: "PlacesAutocomplete",
        field: id || 'unknown',
        types: JSON.stringify(types)
      });
      
      // Pulizia di container precedenti
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      
      // Creazione e configurazione del nuovo elemento
      const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
        types: types,
        fields: ['address_components', 'formatted_address', 'name', 'place_id', 'geometry'],
        componentRestrictions: { country: 'it' },
        placeholder: placeholder
      });
      
      // Impostiamo il valore iniziale
      autocompleteElement.value = internalValue;
      
      // Aggiungiamo l'elemento al DOM
      containerRef.current.appendChild(autocompleteElement);
      autocompleteRef.current = autocompleteElement;
      
      // Handler per catturare quando un luogo viene selezionato
      const placeChangedHandler = () => {
        try {
          console.log('[PlacesAutocomplete] Element place_changed event triggered!');
          
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
          
          // Per la barra di ricerca, mostra sia il nome che l'indirizzo
          const valueToUse = place.name 
            ? `${place.name}${place.formatted_address ? `, ${place.formatted_address}` : ''}`
            : (place.formatted_address || internalValue);
          
          // Aggiorna il valore interno
          setInternalValue(valueToUse);
          
          // Invoca il callback onChange con il valore e i dettagli
          if (onChangeRef.current) {
            console.log('[PlacesAutocomplete] Calling onChange callback');
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
          console.error('[PlacesAutocomplete] Error in place_changed handler:', error);
          logError(error, {
            component: 'PlacesAutocomplete',
            action: 'place_changed'
          });
        }
      };
      
      // Aggiunge l'event listener
      autocompleteElement.addEventListener('gmp-placeselect', placeChangedHandler);
      
      // Gestire stile del componente per integrarlo meglio con il design esistente
      const applyCustomStyles = () => {
        try {
          // Trova il campo input all'interno del componente personalizzato
          const inputElement = containerRef.current?.querySelector('input');
          if (inputElement) {
            // Applica gli stili necessari per renderlo coerente con gli altri input
            inputElement.classList.add(...className.split(' '));
            
            // Copia gli stili rilevanti da Input component a questo input
            if (className.includes('input')) {
              inputElement.style.borderRadius = '0.375rem';
              inputElement.style.padding = '0.5rem 0.75rem';
              inputElement.style.fontSize = '0.875rem';
              inputElement.style.lineHeight = '1.5rem';
              inputElement.style.width = '100%';
              inputElement.style.backgroundColor = 'transparent';
              inputElement.style.transition = 'all 150ms ease';
            }
          }
        } catch (err) {
          console.error('[PlacesAutocomplete] Error applying custom styles:', err);
        }
      };
      
      // Applica stili personalizzati dopo che il componente è stato renderizzato
      setTimeout(applyCustomStyles, 100);
      
      // Segnala che l'inizializzazione è completa
      setAutoCompleteInitialized(true);
      
      // Cleanup al dismount
      return () => {
        try {
          if (autocompleteRef.current) {
            autocompleteRef.current.removeEventListener('gmp-placeselect', placeChangedHandler);
            
            if (containerRef.current && containerRef.current.contains(autocompleteRef.current)) {
              containerRef.current.removeChild(autocompleteRef.current);
            }
            
            autocompleteRef.current = null;
          }
        } catch (cleanupErr) {
          console.error('[PlacesAutocomplete] Error during cleanup:', cleanupErr);
        }
      };
    } catch (error) {
      console.error('[PlacesAutocomplete] Error initializing autocomplete element:', error);
      
      // Registriamo l'errore in Sentry con contesto
      logError(error, {
        component: 'PlacesAutocomplete',
        action: 'initialize_autocomplete_element',
        field: id || 'unknown',
        details: {
          scriptLoaded,
          hasGoogleApi: !!window.google?.maps?.places,
          hasPlaceAutocompleteElement: !!window.google?.maps?.places?.PlaceAutocompleteElement
        }
      });
      
      // Prova con il fallback all'implementazione legacy
      console.log('[PlacesAutocomplete] Trying fallback to legacy autocomplete implementation');
      initializeLegacyAutocomplete();
    }
  }, [scriptLoaded, apiKey, types, id, className, placeholder, internalValue]);
  
  // Funzione per inizializzare l'autocomplete legacy come fallback
  const initializeLegacyAutocomplete = () => {
    console.log('[PlacesAutocomplete] Initializing legacy autocomplete as fallback');
    setError('Utilizzando modalità compatibilità');
    
    // Il fallback sarà gestito all'esterno di questa implementazione
    // ma segnaliamo l'errore per la diagnosi
    logError(new Error('Fallback a implementazione legacy di autocomplete'), {
      component: 'PlacesAutocomplete',
      field: id || 'unknown',
      details: {
        scriptLoaded,
        hasGoogleApi: !!window.google?.maps?.places
      }
    });
  };

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