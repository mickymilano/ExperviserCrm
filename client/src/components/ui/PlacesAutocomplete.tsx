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
}

// Carica Google Maps API in modo dinamico
const loadGoogleMapsScript = (apiKey: string) => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Verifica se Google Maps è già caricato
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps già caricato in memoria');
        resolve();
        return;
      }

      // Rimuovi eventuali script di Google Maps già presenti
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      existingScripts.forEach((script) => script.remove());
      
      console.log('Caricamento di Google Maps con chiave API (formato):', 
        apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4));
      
      // Timeout di sicurezza per evitare attese infinite
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout durante il caricamento di Google Maps API'));
      }, 10000); // 10 secondi di timeout
      
      // Crea e aggiungi lo script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Callback globale che Google Maps chiamerà quando sarà caricato
      window.initMap = () => {
        console.log('Google Maps caricato con successo via callback');
        clearTimeout(timeoutId);
        resolve();
      };
      
      // Gestione errori
      script.onerror = (err) => {
        clearTimeout(timeoutId);
        console.error('Errore durante il caricamento di Google Maps:', err);
        reject(new Error('Google Maps API caricamento fallito'));
      };
      
      // Aggiungi lo script al documento
      document.head.appendChild(script);
    } catch (error) {
      console.error('Eccezione durante il setup di Google Maps:', error);
      reject(error);
    }
  });
};

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Cerca indirizzo...',
  className = '',
  id,
  onCountrySelect
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica la chiave API dal server
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getGoogleMapsApiKey();
        
        if (!key) {
          setError('Google Maps API key non trovata');
          return;
        }
        
        setApiKey(key);
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError('Impossibile caricare la chiave API di Google Maps');
      }
    };

    fetchApiKey();
  }, []);

  // Carica lo script Google Maps quando la chiave API è disponibile
  useEffect(() => {
    if (!apiKey) return;

    // Verifica se la chiave API sembra avere un formato valido
    // Le chiavi API di Google Maps generalmente iniziano con "AIza"
    if (!apiKey.startsWith('AIza')) {
      console.error('Google Maps API key appears to be invalid:', apiKey.substring(0, 6) + '...');
      setError('Chiave API di Google Maps non valida. Contatta l\'amministratore.');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setScriptLoaded(true);
        setError(null);
      })
      .catch((err) => {
        console.error('Error loading Google Maps script:', err);
        setError('Errore nel caricamento di Google Maps. Riprova più tardi.');
      });
  }, [apiKey]);

  // Inizializza l'autocomplete quando lo script è caricato
  useEffect(() => {
    if (!scriptLoaded || !inputRef.current) return;

    try {
      console.log('Initializing Google Places Autocomplete...');
      
      // Inizializza Google Places Autocomplete
      // Per il campo del nome azienda, prioritizza 'establishment'
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        fields: [
          'address_components',
          'formatted_address',
          'geometry',
          'name',
          'place_id',
          'types',
          'business_status'
        ],
        // Priorità agli 'establishment' (attività commerciali)
        types: ['establishment'],
        // Limita i risultati a Italia come default
        componentRestrictions: { country: "it" }
      });

      // Gestisce l'evento di selezione del luogo
      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (!place) {
          console.warn('Place is undefined or null');
          return;
        }

        // Log per debug
        console.log('Place selected:', place);
        console.log('Original input value before update:', inputRef.current?.value);
        
        // Determina l'indirizzo da usare con priorità
        // 1. Indirizzo formattato
        // 2. Nome (solo se non c'è indirizzo formattato)
        // 3. Indirizzo ricostruito dai componenti (fallback)
        let addressToUse = '';
        
        // Usa sempre l'indirizzo formattato se disponibile
        if (place.formatted_address) {
          addressToUse = place.formatted_address;
          console.log('Using formatted address:', addressToUse);
        } 
        // Se non c'è indirizzo formattato ma c'è un nome di attività
        else if (place.name) {
          addressToUse = place.name;
          console.log('Using establishment name only:', addressToUse);
        }
        
        // Se ancora non abbiamo un indirizzo e abbiamo i componenti, ricostruiscilo
        if (!addressToUse && place.address_components) {
          // Ricostruisci un indirizzo da address_components
          const components = [];
          
          // Prova a ottenere in ordine strada, numero civico, città, regione, paese
          const streetNumber = place.address_components.find(c => c.types.includes('street_number'));
          const route = place.address_components.find(c => c.types.includes('route'));
          const locality = place.address_components.find(c => c.types.includes('locality'));
          const adminArea = place.address_components.find(c => c.types.includes('administrative_area_level_1'));
          const country = place.address_components.find(c => c.types.includes('country'));
          
          // Costruisci l'indirizzo in formato "Via Roma, 123, Milano, Lombardia, Italia"
          if (route) components.push(route.long_name);
          if (streetNumber) components.push(streetNumber.long_name);
          if (locality) components.push(locality.long_name);
          if (adminArea) components.push(adminArea.long_name);
          if (country) components.push(country.long_name);
          
          addressToUse = components.join(', ');
          console.log('Reconstructed address:', addressToUse);
        }
        
        // Usa anche il valore attuale dell'input come fallback
        if (!addressToUse && inputRef.current) {
          addressToUse = inputRef.current.value;
          console.log('Using input value as address:', addressToUse);
        }
        
        if (addressToUse) {
          // Aggiorna direttamente l'elemento input
          if (inputRef.current) {
            inputRef.current.value = addressToUse;
          }
          
          // Aggiorna il valore dell'input con l'indirizzo formattato/ricostruito
          console.log('Updating with address:', addressToUse);
          
          // IMPORTANTE: Primo aggiorniamo il DOM direttamente
          if (inputRef.current) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, "value"
            )?.set;
            
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(inputRef.current, addressToUse);
              // Dispatcha un evento di input per assicurarsi che React e altri listener si aggiornino
              const inputEvent = new Event('input', { bubbles: true });
              inputRef.current.dispatchEvent(inputEvent);
            }
          }
          
          // Poi invochiamo il callback di onChange
          onChange(addressToUse, place);
          
          // Mantieni il focus sull'input dopo aver selezionato un indirizzo e posiziona il cursore alla fine
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              // Posiziona il cursore alla fine del testo
              const length = inputRef.current.value.length;
              inputRef.current.setSelectionRange(length, length);
            }
          }, 50);
        } else {
          console.warn('Could not determine a valid address from the place result');
        }

        // Estrae il paese selezionato
        if (onCountrySelect && place.address_components) {
          const countryComponent = place.address_components.find(component => 
            component.types.includes('country')
          );
          
          if (countryComponent) {
            console.log('Country selected:', countryComponent.long_name);
            onCountrySelect(countryComponent.long_name);
          }
        }
      });

      // Pulizia dell'evento al dismount
      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      console.error('Error initializing Google Places Autocomplete:', err);
      setError('Errore nell\'inizializzazione dell\'autocomplete indirizzi');
    }
  }, [scriptLoaded, onChange, onCountrySelect]);

  return (
    <div className="places-autocomplete">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onFocus={() => {
          // Quando l'input riceve il focus, se l'autocomplete è inizializzato
          // imposta il tipo di campo a text per evitare problemi con l'autocomplete
          if (inputRef.current) {
            inputRef.current.setAttribute('autocomplete', 'new-address');
          }
        }}
        onChange={(e) => {
          // Propagare il cambiamento manuale al componente parent
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={className}
        aria-label="Indirizzo"
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}