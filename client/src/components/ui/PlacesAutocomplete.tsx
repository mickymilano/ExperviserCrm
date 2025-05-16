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
        debugContext.logInfo('Google Maps API già caricata', {}, { component: 'PlacesAutocomplete' });
        resolve();
        return;
      }

      debugContext.logInfo('Caricamento Google Maps API...', {}, { component: 'PlacesAutocomplete' });
      
      // Creiamo una callback globale
      window.initGoogleMaps = () => {
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
      debugContext.logInfo('Inizializzazione Google Maps Autocomplete', {}, { component: 'PlacesAutocomplete' });
      
      // Configurazione dell'autocomplete
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current!, {
        types: ['establishment'],
        fields: ['name','formatted_address','address_components'],
        // componentRestrictions: { country: 'it' } // commentare temporaneamente se blocca i risultati
      });
      console.log("Init Autocomplete:", autocomplete);
      autocompleteRef.current = autocomplete;
      
      // Funzione che gestisce la selezione di un luogo
      const handlePlaceChanged = () => {
        try {
          if (!autocompleteRef.current) return;
          
          const place = autocompleteRef.current.getPlace();
          
          // Debug dettagliato sul place ricevuto
          debugContext.logInfo('Place changed event triggered', { 
            hasPlace: !!place,
            hasPlaceId: place && !!place.place_id,
            placeProperties: place ? Object.keys(place) : []
          }, { component: 'PlacesAutocomplete' });
          
          if (!place) {
            debugContext.logWarning('Oggetto place vuoto dalla API', {}, { component: 'PlacesAutocomplete' });
            return;
          }
          
          // Se non c'è un place_id ma c'è un nome, potrebbe essere una selezione parziale
          // In questo caso procediamo comunque per migliorare l'esperienza utente
          if (!place.place_id && !place.name && !place.formatted_address) {
            debugContext.logWarning('Luogo selezionato senza identificatori', {
              placeContent: JSON.stringify(place)
            }, { component: 'PlacesAutocomplete' });
            return;
          }
          
          debugContext.logInfo('Luogo selezionato correttamente', { 
            name: place.name || place.formatted_address,
            placeId: place.place_id || 'N/A'
          }, { component: 'PlacesAutocomplete' });
          
          // Formatta il valore da mostrare (nome e/o indirizzo)
          const displayValue = place.name 
            ? `${place.name}${place.formatted_address ? `, ${place.formatted_address}` : ''}`
            : (place.formatted_address || internalValue);
          
          // Imposta il valore interno
          setInternalValue(displayValue);
          
          // Importante: delay zero per assicurarsi che l'evento si verifichi dopo l'aggiornamento UI
          setTimeout(() => {
            // Chiama il callback onChange con il valore e i dettagli del luogo
            if (onChangeRef.current) {
              debugContext.logInfo('Invocazione callback onChange', { 
                displayValue, 
                hasPlaceData: !!place 
              }, { component: 'PlacesAutocomplete' });
              onChangeRef.current(place.name, place);
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
          }, 0);
        } catch (error) {
          debugContext.logError('Errore nella gestione del place_changed', error, { component: 'PlacesAutocomplete' });
        }
      };
      
      // Aggiungi il listener per place_changed
      const listener = autocomplete.addListener('place_changed', handlePlaceChanged);
      
      // Gestisci l'interazione con i suggerimenti in dropdown
      setTimeout(() => {
        try {
          const pacContainer = document.querySelector('.pac-container');
          if (pacContainer) {
            debugContext.logInfo('Container suggerimenti trovato, aggiungo gestori eventi', {}, { component: 'PlacesAutocomplete' });
            
            // Impedisci che i click nel container si propaghino (importante nei modali)
            pacContainer.addEventListener('click', (e) => {
              e.stopPropagation();
              debugContext.logInfo('Click sul container .pac-container', {}, { component: 'PlacesAutocomplete' });
            });
            
            // Il mousedown è cruciale per evitare che i modali si chiudano
            pacContainer.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              e.preventDefault(); // Aggiungiamo preventDefault per maggiore sicurezza
              debugContext.logInfo('Mousedown sul container .pac-container prevenuto', {}, { component: 'PlacesAutocomplete' });
            });
            
            // Aggiungiamo un gestore per gli elementi interni (suggerimenti)
            const handleSuggestionInteraction = (event: Event) => {
              event.stopPropagation();
              // Non chiamiamo preventDefault qui per permettere la selezione
              debugContext.logInfo('Interazione con suggerimento', { 
                type: event.type,
                target: (event.target as HTMLElement).className
              }, { component: 'PlacesAutocomplete' });
            };
            
            // Aggiungiamo listener per ogni elemento .pac-item
            pacContainer.querySelectorAll('.pac-item').forEach(item => {
              item.addEventListener('mousedown', handleSuggestionInteraction);
              item.addEventListener('touchstart', handleSuggestionInteraction);
              item.addEventListener('click', handleSuggestionInteraction);
            });
            
            // Supporto per touch devices
            ['touchstart', 'touchend', 'touchmove'].forEach(eventType => {
              pacContainer.addEventListener(eventType, (e) => {
                e.stopPropagation();
                debugContext.logInfo(`Evento touch ${eventType} sul container`, {}, { component: 'PlacesAutocomplete' });
              });
            });
            
            // Aggiunta di un attributo per identificarlo facilmente
            pacContainer.setAttribute('data-experviser-autocomplete', 'true');
            
            // Aggiungiamo uno stile per garantire che sia visibile sopra i modali
            pacContainer.style.zIndex = '10000';
          } else {
            debugContext.logWarning('Container .pac-container non trovato', {}, { component: 'PlacesAutocomplete' });
          }
        } catch (err) {
          debugContext.logError('Errore setup container suggerimenti', err, { component: 'PlacesAutocomplete' });
        }
      }, 500); // Riduciamo il timeout per una risposta più rapida
      
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
  
  // Previene propagazione di tutti gli eventi
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    // Non blocchiamo i tasti di navigazione come Tab, ma blocchiamo altri che potrebbero chiudere il modale
    if (e.key === 'Escape') {
      e.stopPropagation();
      debugContext.logInfo('Evento keydown Escape prevenuto', {}, { component: 'PlacesAutocomplete' });
    }
  };

  return (
    <div className={`relative w-full ${error ? 'has-error' : ''}`} onClick={handleInputInteraction}>
      <Input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleInputChange}
        onClick={handleInputInteraction}
        onTouchStart={handleInputInteraction}
        onKeyDown={handleInputKeyDown}
        onFocus={handleInputInteraction}
        onMouseDown={handleInputInteraction}
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