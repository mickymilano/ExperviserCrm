import React, { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { getGoogleMapsApiKey } from '@/lib/environment';
import { debugContext } from '@/lib/debugContext';

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
        console.log('Google Maps API già caricata', window.google.maps.places);
        debugContext.logInfo('Google Maps API già caricata', {}, { component: 'PlacesAutocomplete' });
        resolve();
        return;
      }

      console.log('Caricamento script Google Maps...');
      debugContext.logInfo('Caricamento Google Maps API...', {}, { component: 'PlacesAutocomplete' });
      
      // Creiamo una callback globale
      window.initGoogleMaps = () => {
        console.log('Google Maps API caricato:', window.google?.maps?.places);
        console.log('PlaceAutocompleteElement disponibile?', !!window.google?.maps?.places?.PlaceAutocompleteElement);
        debugContext.logInfo('Google Maps API caricata con successo', {}, { component: 'PlacesAutocomplete' });
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
          const errorMsg = 'Timeout caricamento Google Maps API';
          debugContext.logError(errorMsg, { timeout: true }, { component: 'PlacesAutocomplete' });
          reject(new Error(errorMsg));
        }
      }, 10000);
    } catch (error) {
      debugContext.logError('Errore caricamento script Google Maps', error, { component: 'PlacesAutocomplete' });
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
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  
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
          debugContext.logError('Google Maps API key non disponibile', 
            { timestamp: new Date().toISOString() },
            { component: 'PlacesAutocomplete' });
        }
      } catch (err) {
        debugContext.logError('Errore recupero Google Maps API key', err, { component: 'PlacesAutocomplete' });
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
        debugContext.logError('Errore caricamento script Google Maps', err, { component: 'PlacesAutocomplete' });
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
      console.log('Analisi API Google Maps disponibili:', {
        places: !!window.google?.maps?.places,
        autocomplete: !!window.google?.maps?.places?.Autocomplete,
        placeAutocompleteElement: !!window.google?.maps?.places?.PlaceAutocompleteElement,
        maps: Object.keys(window.google?.maps || {}).join(','),
        placesKeys: Object.keys(window.google?.maps?.places || {}).join(',')
      });
      
      // Usare direttamente il legacy Autocomplete che è sempre disponibile
      console.log('Utilizzo sempre Autocomplete (legacy) per sicurezza');
      
      // API classica Autocomplete
      debugContext.logInfo('Utilizzo Google Maps Autocomplete legacy', {}, { component: 'PlacesAutocomplete' });
      
      // Crea l'autocomplete con le opzioni necessarie
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current!, {
          types: types || ['establishment']
        });
        
        autocompleteRef.current = autocomplete;
        console.log('Autocomplete inizializzato con successo');
        
        // Funzione che gestisce la selezione di un luogo
        const handlePlaceChanged = () => {
          try {
            const place = autocompleteRef.current?.getPlace();
            
            console.log('handlePlaceChanged:', place);
            
            // Debug dettagliato sul place ricevuto
            debugContext.logInfo('Place changed event triggered', { 
              hasPlace: !!place,
              hasPlaceId: !!place?.place_id,
              placeProperties: place ? Object.keys(place) : []
            }, { component: 'PlacesAutocomplete' });
            
            if (!place) {
              debugContext.logWarning('Oggetto place vuoto dalla API', {}, { component: 'PlacesAutocomplete' });
              return;
            }
            
            // Formatta il valore da mostrare (nome e/o indirizzo)
            // Per indirizzi, mostriamo SEMPRE l'indirizzo formattato completo
            const displayValue = types.includes('address') 
              ? (place.formatted_address || internalValue) 
              : (place.name 
                  ? `${place.name}${place.formatted_address ? `, ${place.formatted_address}` : ''}`
                  : (place.formatted_address || internalValue));
            
            debugContext.logInfo('Formatting address value', {
              types,
              hasFormattedAddress: !!place.formatted_address,
              formatted_address: place.formatted_address,
              displayValue
            }, { component: 'PlacesAutocomplete' });
            
            // Imposta il valore interno
            setInternalValue(displayValue);
            
            // Chiama il callback onChange con il valore e i dettagli del luogo
            if (onChangeRef.current) {
              // Per indirizzi, usa sempre l'indirizzo formattato completo quando disponibile
              const valueToReturn = types.includes('address') && place.formatted_address 
                ? place.formatted_address 
                : (place.name || displayValue);
              
              onChangeRef.current(valueToReturn, place);
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
            
            // Aggiungiamo un piccolo timeout per far sì che il blur avvenga dopo che l'onChange è stato processato
            setTimeout(() => inputRef.current?.blur(), 0);
          } catch (error) {
            console.error('Errore nella gestione del place_changed', error);
            debugContext.logError('Errore nella gestione del place_changed', error, { component: 'PlacesAutocomplete' });
          }
        };
        
        // Aggiungi il listener per place_changed
        const listener = autocomplete.addListener('place_changed', handlePlaceChanged);
        
        // Gestisci il container dei suggerimenti
        setTimeout(() => {
          try {
            const pacContainer = document.querySelector('.pac-container');
            if (pacContainer) {
              console.log('Container suggerimenti trovato e configurato');
              debugContext.logInfo('Container suggerimenti trovato e configurato', {}, { component: 'PlacesAutocomplete' });
              
              // Impedisci che i click nel container si propaghino (importante nei modali)
              pacContainer.addEventListener('click', (e) => {
                e.stopPropagation();
              });
              
              // Il mousedown è cruciale per evitare che i modali si chiudano
              pacContainer.addEventListener('mousedown', (e) => {
                e.stopPropagation();
              });
              
              // Aggiungiamo un handler per garantire che gli item nel dropdown siano cliccabili
              document.querySelectorAll('.pac-item').forEach(item => {
                item.addEventListener('click', (e) => {
                  console.log('Click su elemento suggestion:', e);
                  e.stopPropagation();
                  // Non usare preventDefault qui perché interferisce con la selezione
                });
                
                item.addEventListener('mousedown', (e) => {
                  console.log('Mousedown su elemento suggestion:', e);
                  e.stopPropagation();
                  // Non usare preventDefault qui perché interferisce con la selezione
                });
              });
              
              // Aggiungiamo uno stile per garantire che sia visibile sopra i modali
              pacContainer.style.zIndex = '10000';
            } else {
              console.warn('Container .pac-container non trovato dopo timeout');
            }
          } catch (err) {
            console.error('Errore setup container suggerimenti', err);
            debugContext.logError('Errore setup container suggerimenti', err, { component: 'PlacesAutocomplete' });
          }
        }, 500);
      } catch (initError) {
        console.error('Errore nell\'inizializzazione dell\'autocomplete:', initError);
        debugContext.logError('Errore inizializzazione autocomplete', initError, { component: 'PlacesAutocomplete' });
        setError('Errore inizializzazione autocomplete: ' + initError.message);
      }
      
          
      // Funzione di pulizia al dismount
      return () => {
        try {
          // Rimuovi il listener quando il componente viene smontato
          if (window.google?.maps?.event && autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          
          // Pulisci il riferimento
          autocompleteRef.current = null;
          
          // Pulisci eventuali containers di suggerimenti
          document.querySelectorAll('.pac-container').forEach(container => {
            if (container && container.parentNode) {
              container.parentNode.removeChild(container);
            }
          });
        } catch (cleanupError) {
          console.error('Errore durante pulizia resources:', cleanupError);
        }
        
        // Pulisci le istanze
        autocompleteRef.current = null;
        
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
      debugContext.logError('Errore inizializzazione autocomplete', error, { component: 'PlacesAutocomplete' });
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
  
  // Gestisce l'interazione con l'input per evitare chiusura di modali
  const handleInputInteraction = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    debugContext.logInfo('Interazione con input prevenuta', { 
      type: e.type 
    }, { component: 'PlacesAutocomplete' });
  };
  
  // rimosso blocco eventi superflui

  return (
    <div className={`relative w-full ${error ? 'has-error' : ''}`} onClick={handleInputInteraction}>
      <Input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onClick={handleInputInteraction}
        onFocus={handleInputInteraction}
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