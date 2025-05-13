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
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps API caricamento fallito'));
    document.head.appendChild(script);
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
      // Inizializza Google Places Autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['address_components', 'formatted_address', 'geometry'],
      });

      // Gestisce l'evento di selezione del luogo
      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (!place || !place.formatted_address) {
          return;
        }

        // Aggiorna il valore con l'indirizzo formattato
        onChange(place.formatted_address, place);

        // Estrae il paese selezionato
        if (onCountrySelect && place.address_components) {
          const countryComponent = place.address_components.find(component => 
            component.types.includes('country')
          );
          
          if (countryComponent) {
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
        onChange={(e) => onChange(e.target.value)}
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