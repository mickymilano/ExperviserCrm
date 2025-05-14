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
  // Tracciamo internamente il valore per evitare problemi nella selezione
  const [internalValue, setInternalValue] = useState(value);
  
  const onChangeRef = useRef(onChange); // Usiamo un ref per evitare che "onChange" causi render multipli
  const onCountrySelectRef = useRef(onCountrySelect); // Lo stesso per "onCountrySelect"
  const cleanupRef = useRef<Array<() => void>>([]) // Array di funzioni di cleanup

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

    // Pulizia di eventuali container esistenti per evitare errori di runtime
    try {
      const existingContainers = document.querySelectorAll('.pac-container');
      if (existingContainers && existingContainers.length > 0) {
        existingContainers.forEach(container => {
          if (container && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        });
        console.log('[PlacesAutocomplete] Removed existing PAC containers during initialization');
      }
    } catch (err) {
      console.error('[PlacesAutocomplete] Error cleaning up existing PAC containers:', err);
    }

    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places || !apiKey) {
      console.warn('[PlacesAutocomplete] ABORTING Autocomplete init: Missing dependencies.');
      return;
    }
    
    try {
      console.log("[PlacesAutocomplete] Initializing Google Maps Autocomplete with types:", types);
      
      // Pulisci eventuali istanze precedenti in modo più sicuro
      if (autocompleteRef.current) {
        console.log('[PlacesAutocomplete] Previous autocomplete instance exists, will be replaced safely');
        try {
          // Tentiamo una pulizia più approfondita se disponibile
          if (window.google?.maps?.event && autocompleteRef.current) {
            // @ts-ignore
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
          }
          // Impostiamo esplicitamente a null
          autocompleteRef.current = null;
        } catch (cleanupErr) {
          console.warn('[PlacesAutocomplete] Error during previous instance cleanup:', cleanupErr);
        }
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
      // Aggiungi un gestore di eventi globale per catturare tutti i click/touch sui suggerimenti
      const handlePacEvent = (e: Event) => {
        const target = e.target as HTMLElement;
        const isPacItem = target.closest('.pac-item');
        const isPacContainer = target.closest('.pac-container');
        
        if (isPacItem || isPacContainer) {
          // È importante prevenire il comportamento predefinito per i dispositivi touchscreen
          e.preventDefault();
          e.stopPropagation();
          
          // Evita che l'evento di click/touch possa chiudere il modal
          e.stopImmediatePropagation();
          
          console.log(`[PlacesAutocomplete] Intercettato ${e.type} su suggerimento:`, target);
          
          if (isPacItem && autocompleteRef.current) {
            try {
              console.log(`[PlacesAutocomplete] Attivando place_changed per evento ${e.type}`);
              
              // Ritardiamo leggermente l'attivazione per i dispositivi touch
              setTimeout(() => {
                if (autocompleteRef.current) {
                  // @ts-ignore
                  window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
                }
              }, 50);
            } catch (err) {
              console.error(`[PlacesAutocomplete] Error triggering place_changed on ${e.type}:`, err);
            }
          }
          
          // Per i dispositivi touch, chiudi manualmente il dropdown dopo la selezione
          if (e.type === 'touchstart' || e.type === 'touchend') {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.blur();
              }
            }, 300);
          }
        }
      };
      
      // Aggiungi i listener globali per coprire tutti i tipi di interazioni
      document.addEventListener('click', handlePacEvent, true);
      document.addEventListener('touchstart', handlePacEvent, true);
      document.addEventListener('touchend', handlePacEvent, true);
      document.addEventListener('mousedown', handlePacEvent, true);
      
      // Pulisci i listener quando il componente viene smontato
      cleanupRef.current.push(() => {
        document.removeEventListener('click', handlePacEvent, true);
        document.removeEventListener('touchstart', handlePacEvent, true);
        document.removeEventListener('touchend', handlePacEvent, true);
        document.removeEventListener('mousedown', handlePacEvent, true);
      });
      
      // Aggiungi gestori eventi direttamente al container .pac-container quando viene creato
      const setupPacContainerListeners = () => {
        const container = document.querySelector('.pac-container');
        if (container) {
          console.log('[PlacesAutocomplete] Container trovato, aggiungo gestori eventi specifici');
          
          // Listener per il click
          container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const item = (e.target as HTMLElement).closest('.pac-item');
            if (item && autocompleteRef.current) {
              console.log('[PlacesAutocomplete] Click su .pac-item, trigger place_changed');
              setTimeout(() => {
                if (autocompleteRef.current) {
                  // @ts-ignore
                  window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
                  // Chiudi il dropdown manualmente 
                  if (inputRef.current) inputRef.current.blur();
                }
              }, 50);
            }
          }, true);
          
          // Listener specifici per i dispositivi touch
          ['touchstart', 'touchend'].forEach(eventType => {
            container.addEventListener(eventType, (e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              
              const item = (e.target as HTMLElement).closest('.pac-item');
              if (item && autocompleteRef.current) {
                console.log(`[PlacesAutocomplete] ${eventType} su .pac-item, trigger place_changed`);
                setTimeout(() => {
                  if (autocompleteRef.current) {
                    // @ts-ignore
                    window.google.maps.event.trigger(autocompleteRef.current, 'place_changed');
                    // Esplicita chiusura e blur per tablet/mobile
                    if (inputRef.current) inputRef.current.blur();
                  }
                }, 50);
              }
            }, true);
          });
          
          // Previeni che il container si chiuda immediatamente sui dispositivi touch
          container.addEventListener('mousedown', (e) => e.stopPropagation(), true);
        }
      };
      
      // Controlliamo periodicamente il container per assicurarci di aggiungere i listener
      const containerCheckInterval = setInterval(setupPacContainerListeners, 500);
      setTimeout(() => {
        clearInterval(containerCheckInterval);
        setupPacContainerListeners(); // Un'ultima chiamata dopo 2 secondi
      }, 2000);
      
      // Pulisci l'interval quando il componente viene smontato
      cleanupRef.current.push(() => clearInterval(containerCheckInterval));

      // FONDAMENTALE: Aggiungiamo il listener per l'evento place_changed con protezioni aggiuntive
      const placeChangedHandler = () => {
        try {
          // Non possiamo usare stopPropagation qui perchè l'evento place_changed non fornisce un evento DOM
          console.log('[PlacesAutocomplete] place_changed EVENT DETECTED!'); // Log cruciale
          
          // Controllo di sicurezza per evitare errori di runtime
          if (!autocompleteRef.current) {
            console.error('[PlacesAutocomplete] ERROR: autocompleteRef.current is NULL/undefined inside place_changed listener!');
            return;
          }
          
          // Previene comportamenti indesiderati su tablet/mobile in modo preemptivo
          // impedendo la propagazione di eventuali eventi touch/click in corso
          try {
            const activeElement = document.activeElement;
            console.log('[PlacesAutocomplete] Active element before place processing:', 
              activeElement ? activeElement.tagName : 'none');
            
            // Protegge preventivamente l'input dal perdere il focus
            if (inputRef.current) {
              inputRef.current.setAttribute('data-processing-place', 'true');
            }
          } catch (focusErr) {
            console.warn('[PlacesAutocomplete] Error managing focus state:', focusErr);
          }
          
          // Ottieni i dettagli del luogo con gestione degli errori
          let place;
          try {
            place = autocompleteRef.current.getPlace();
            console.log('[PlacesAutocomplete] place_changed - getPlace() raw result:', 
              place ? 'Place object ricevuto' : 'Nessun place');
          } catch (getPlaceErr) {
            console.error('[PlacesAutocomplete] Error getting place details:', getPlaceErr);
            return;
          }
          
          // Verifica l'oggetto place
          if (!place || !place.place_id) {
            console.warn('[PlacesAutocomplete] place_changed - Invalid place or no place_id. Current input value:', 
              inputRef.current?.value);
            return;
          }
          
          // Importante: prevenire qualsiasi evento di navigazione o click in corso
          // che potrebbe chiudere il modale, specialmente su tablet/mobile
          try {
            // Per i dispositivi mobile/tablet, proteggiamo dalle interazioni indesiderate
            setTimeout(() => {
              // Manteniamo il focus sul nostro input per evitare problemi UI
              if (inputRef.current) {
                console.log('[PlacesAutocomplete] Assicuro focus corretto per prevenire chiusure indesiderate');
                // Rimuove l'attributo di elaborazione
                inputRef.current.removeAttribute('data-processing-place');
                // Diamo il focus temporaneamente al nostro input in modo sicuro
                setTimeout(() => {
                  try {
                    if (inputRef.current) inputRef.current.focus();
                  } catch (e) {/* Ignora errori di focus */}
                }, 10);
              }
            }, 50);
          } catch (err) {
            console.error('[PlacesAutocomplete] Errore gestione eventi focus:', err);
          }
          
          // Per la barra di ricerca, mostra sia il nome che l'indirizzo separati da una virgola
          const valueToUse = place.name 
            ? `${place.name}${place.formatted_address ? `, ${place.formatted_address}` : ''}`
            : (place.formatted_address || value);
          console.log('[PlacesAutocomplete] place_changed - Value to use for form:', valueToUse);
          
          // Aggiorna prima il valore interno per mostrarlo nell'input
          setInternalValue(valueToUse);
        
          // Invoca il callback onChange con il valore e i dettagli del luogo
          // Utilizziamo onChangeRef.current per accedere alla versione più aggiornata
          if (onChangeRef.current) {
            console.log("[PlacesAutocomplete] Calling onChange callback with place data");
            
            // Applica il valore direttamente senza blur o altri eventi che potrebbero chiudere il modal
            try {
              // Utilizziamo un timeout più lungo per i dispositivi touch/mobile
              // per assicurarci che l'elaborazione avvenga dopo che tutti gli eventi touch sono completati
              // Per dispositivi mobile usiamo un timeout ancora più lungo (500ms)
              const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window);
              const timeout = isMobile ? 500 : 100;
              
              console.log(`[PlacesAutocomplete] Chiamando onChange con ${timeout}ms delay (isMobile: ${isMobile})`);
              setTimeout(() => {
                // Prima di chiamare il callback, assicuriamoci che il valore sia visibile nell'input
                if (inputRef.current) {
                  inputRef.current.value = valueToUse;
                }
                onChangeRef.current!(valueToUse, place);
              }, timeout);
            } catch (callbackErr) {
              console.error('[PlacesAutocomplete] Error in onChange callback execution:', callbackErr);
            }
          }
        } catch (handlerError) {
          console.error('[PlacesAutocomplete] Critical error in place_changed handler:', handlerError);
        }
      };
      
      // Aggiungi il listener con gestione degli errori
      let listener;
      try {
        listener = autocomplete.addListener('place_changed', placeChangedHandler);
      } catch (addListenerErr) {
        console.error('[PlacesAutocomplete] Error adding place_changed listener:', addListenerErr);
      }
        
        // Aggiorna prima il valore interno per mostrarlo nell'input
        setInternalValue(valueToUse);
        
        // Invoca il callback onChange con il valore e i dettagli del luogo
        // Utilizziamo onChangeRef.current per accedere alla versione più aggiornata
        if (onChangeRef.current) {
          console.log("[PlacesAutocomplete] Calling onChange callback with place data");
          
          // Applica il valore direttamente senza blur o altri eventi che potrebbero chiudere il modal
          try {
            // Utilizziamo un timeout più lungo per i dispositivi touch/mobile
            // per assicurarci che l'elaborazione avvenga dopo che tutti gli eventi touch sono completati
            // Per dispositivi mobile usiamo un timeout ancora più lungo (500ms)
            const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window);
            const timeout = isMobile ? 500 : 100;
            
            console.log(`[PlacesAutocomplete] Chiamando onChange con ${timeout}ms delay (isMobile: ${isMobile})`);
            setTimeout(() => {
              // Prima di chiamare il callback, assicuriamoci che il valore sia visibile nell'input
              if (inputRef.current) {
                inputRef.current.value = valueToUse;
              }
              
              // Ora chiamiamo il callback che aggiorna il valore nel form
              onChangeRef.current(valueToUse, place);
              console.log('[PlacesAutocomplete] onChange callback eseguito con successo');
            }, timeout);
          } catch(err) {
            console.error('[PlacesAutocomplete] Errore in onChange:', err);
          }
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

  // IMPORTANTE: Effetto finale per la pulizia completa quando il componente viene smontato
  useEffect(() => {
    // Restituisce una funzione di cleanup che sarà eseguita quando il componente viene smontato
    return () => {
      console.log('[PlacesAutocomplete] EXECUTING FINAL CLEANUP for mobile/tablet compatibility');
      
      // Verifiche di sicurezza e controllo di cleanupRef.current
      if (cleanupRef.current && Array.isArray(cleanupRef.current)) {
        // Salviamo una copia delle funzioni di cleanup e poi svuotiamo l'array
        // per evitare pulizie multiple o problemi di sincronizzazione
        const functionsToClean = [...cleanupRef.current];
        cleanupRef.current = [];
        
        // Esecuzione sicura delle funzioni di cleanup
        functionsToClean.forEach(cleanupFn => {
          if (typeof cleanupFn === 'function') {
            try {
              cleanupFn();
            } catch (err) {
              console.error('[PlacesAutocomplete] Error during cleanup function:', err);
            }
          }
        });
      }
      
      // Rimozione dei container PAC con controllo per evitare errori
      try {
        const containers = document.querySelectorAll('.pac-container');
        if (containers && containers.length > 0) {
          containers.forEach(container => {
            try {
              if (container && container.parentNode) {
                container.parentNode.removeChild(container);
              }
            } catch (removeErr) {
              // Ignoriamo errori specifici di rimozione
            }
          });
          console.log('[PlacesAutocomplete] Removed PAC containers');
        }
      } catch (err) {
        console.error('[PlacesAutocomplete] Error during PAC container cleanup:', err);
      }
      
      // Pulizia sicura del riferimento all'autocomplete
      try {
        autocompleteRef.current = null;
      } catch (err) {
        // Ignoriamo eventuali errori
      }
    };
  }, []); // Dipendenze vuote = viene eseguito solo al mount/unmount
  
  // Gestisce l'aggiornamento manuale dell'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Evita che la selezione del testo chiuda il modale
    e.stopPropagation();
    const newValue = e.target.value;
    setInternalValue(newValue);
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
        value={internalValue}
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
          touch-action: manipulation !important;
        }
        .pac-item {
          padding: 0.75rem 0.5rem !important;
          cursor: pointer !important;
          pointer-events: auto !important;
          touch-action: manipulation !important;
          line-height: 1.5 !important;
          min-height: 44px !important; /* Per target touch più grandi su mobile/tablet */
          display: flex !important;
          align-items: center !important;
        }
        .pac-item:hover, .pac-item:active, .pac-item:focus {
          background-color: #f7fafc !important;
        }
        .pac-item-selected {
          background-color: #edf2f7 !important;
        }
        /* Miglioramenti per mobile/tablet */
        @media (max-width: 768px) {
          .pac-item {
            padding: 1rem 0.5rem !important;
            min-height: 54px !important;
          }
          .pac-container {
            width: auto !important;
            max-width: 90vw !important;
            top: auto !important;
            left: 5vw !important;
          }
        }
      `}} />
    </div>
  );
}