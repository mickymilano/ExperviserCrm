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
  onCountrySelect
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effetto per caricare la chiave API e lo script Google Maps
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        // Ottieni la chiave API
        const apiKey = await getGoogleMapsApiKey();
        
        if (!apiKey) {
          setError('API key non disponibile');
          return;
        }
        
        // Carica lo script Google Maps
        await loadGoogleMapsScript(apiKey);
        setScriptLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Errore inizializzazione Google Maps:', err);
        setError('Impossibile inizializzare Google Maps');
      }
    };
    
    initializeGoogleMaps();
  }, []);

  // Inizializza autocomplete quando lo script è caricato
  useEffect(() => {
    // Esci se lo script non è caricato o manca l'input
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places) {
      return;
    }
    
    try {
      // Crea l'istanza di autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ['address_components', 'formatted_address', 'name', 'place_id', 'geometry'],
        types: ['establishment'],
        componentRestrictions: { country: 'it' }
      });
      
      // Salva il riferimento
      autocompleteRef.current = autocomplete;
      
      // Aggiungi listener per i cambiamenti di place
      const listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place || !place.formatted_address) {
          return;
        }
        
        // Usa l'indirizzo formattato o il nome del luogo
        const addressToUse = place.formatted_address || place.name || '';
        
        // Chiama il callback di onChange
        onChange(addressToUse, place);
        
        // Estrai e notifica il paese se richiesto
        if (onCountrySelect && place.address_components) {
          const countryComponent = place.address_components.find(
            component => component.types.includes('country')
          );
          
          if (countryComponent) {
            onCountrySelect(countryComponent.long_name);
          }
        }
      });
      
      // Cleanup al dismount
      return () => {
        if (window.google && window.google.maps && window.google.maps.event) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      console.error('Errore inizializzazione autocomplete:', err);
      setError('Impossibile inizializzare l\'autocomplete');
    }
  }, [scriptLoaded, onChange, onCountrySelect]);

  return (
    <div className="places-autocomplete">
      <Input
        ref={inputRef}
        id={id}
        defaultValue={value}
        placeholder={placeholder}
        className={className}
        aria-label="Indirizzo"
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}