import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { getGoogleMapsApiKey } from '@/lib/environment';
import { logError, logMessage } from '@/lib/errorTracking';

// Definisce le proprietà del componente
interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onCountrySelect?: (country: string) => void;
  types?: string[]; // Array di tipi di luoghi supportati da Google (es. ['address', 'establishment'])
}

// Aggiungiamo la definizione per window.initGoogleMaps
interface Window {
  initGoogleMaps?: () => void;
  google?: any;
}

// Semplice funzione per caricare una volta sola lo script Google Maps
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Verifichiamo se l'API è già stata caricata
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps API già caricata');
        resolve();
        return;
      }

      console.log('Caricamento Google Maps API...');
      
      // Creiamo una callback globale
      window.initGoogleMaps = () => {
        console.log('Google Maps API caricata con successo');
        resolve();
      };
      
      // Creiamo lo script con un ID unico
      const scriptId = `google-maps-${Date.now()}`;
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Gestiamo l'errore
      script.onerror = () => {
        console.error('Errore nel caricamento Google Maps API');
        reject(new Error('Impossibile caricare Google Maps API'));
      };
      
      // Aggiungiamo lo script alla pagina
      document.head.appendChild(script);
      
      // Timeout di sicurezza
      setTimeout(() => {
        if (!window.google?.maps?.places) {
          console.error('Timeout caricamento Google Maps API');
          reject(new Error('Timeout caricamento Google Maps API'));
        }
      }, 10000);
    } catch (error) {
      console.error('Errore caricamento script:', error);
      reject(error);
    }
  });
};

// Il componente principale
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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [internalValue, setInternalValue] = useState(value);
  
  // Utilizziamo useRef per memorizzare lo stato dell'autocomplete
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Refs per i callbacks per evitare re-render
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
        
        if (!key) {
          setError('Chiave API non disponibile');
          logError(new Error('Google Maps API key non disponibile'), {
            component: 'PlacesAutocomplete'
          });
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

  // Inizializza l'autocomplete quando lo script è caricato
  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places) {
      return;
    }
    
    try {
      console.log('Inizializzazione Google Maps Autocomplete');
      
      // Configurazione dell'autocomplete
      const options: google.maps.places.AutocompleteOptions = {
        fields: ['address_components', 'formatted_address', 'name', 'place_id', 'geometry'],
        componentRestrictions: { country: 'it' }
      };
      
      if (types && types.length > 0) {
        options.types = types;
      }
      
      // Crea una nuova istanza di autocomplete sull'input
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
      autocompleteRef.current = autocomplete;
      
      // Funzione che gestisce la selezione di un luogo
      const handlePlaceChanged = () => {
        try {
          if (!autocompleteRef.current) return;
          
          const place = autocompleteRef.current.getPlace();
          if (!place || !place.place_id) {
            console.warn('Luogo selezionato non valido');
            return;
          }
          
          console.log('Luogo selezionato:', place.name || place.formatted_address);
          
          // Formatta il valore da mostrare (nome e/o indirizzo)
          const displayValue = place.name 
            ? `${place.name}${place.formatted_address ? `, ${place.formatted_address}` : ''}`
            : (place.formatted_address || internalValue);
          
          // Imposta il valore interno
          setInternalValue(displayValue);
          
          // Chiama il callback onChange con il valore e i dettagli del luogo
          if (onChangeRef.current) {
            onChangeRef.current(displayValue, place);
          }
          
          // Gestisce il callback per il paese se richiesto
          if (onCountrySelectRef.current && place.address_components) {
            const countryComponent = place.address_components.find(
              component => component.types.includes('country')
            );
            
            if (countryComponent) {
              onCountrySelectRef.current(countryComponent.long_name);
            }
          }
        } catch (error) {
          console.error('Errore nella gestione del place_changed:', error);
        }
      };
      
      // Aggiungi il listener per place_changed
      const listener = autocomplete.addListener('place_changed', handlePlaceChanged);
      
      // Gestisci l'interazione con i suggerimenti in dropdown
      setTimeout(() => {
        try {
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            console.log('Container suggerimenti trovato, aggiungo gestori eventi');
            
            // Impedisci che i click nel container si propaghino (importante nei modali)
            pacContainer.addEventListener('click', (e) => {
              e.stopPropagation();
            });
            
            pacContainer.addEventListener('mousedown', (e) => {
              e.stopPropagation();
            });
            
            // Supporto per touch devices
            ['touchstart', 'touchend'].forEach(eventType => {
              pacContainer.addEventListener(eventType, (e) => {
                e.stopPropagation();
              });
            });
          }
        } catch (err) {
          console.error('Errore setup container suggerimenti:', err);
        }
      }, 1000);
      
      // Funzione di pulizia al dismount
      return () => {
        // Rimuovi il listener quando il componente viene smontato
        if (window.google?.maps?.event && listener) {
          window.google.maps.event.removeListener(listener);
        }
        
        // Pulisci le istanze
        if (autocompleteRef.current) {
          autocompleteRef.current = null;
        }
        
        // Pulisci eventuali containers di suggerimenti
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
    } catch (error) {
      console.error('Errore inizializzazione autocomplete:', error);
      setError('Errore inizializzazione autocomplete');
    }
  }, [scriptLoaded, types, internalValue]);
  
  // Gestisce l'aggiornamento manuale dell'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChangeRef.current) {
      onChangeRef.current(newValue, null);
    }
  };
  
  // Gestisce l'interazione con l'input
  const handleInputInteraction = (e: React.SyntheticEvent) => {
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