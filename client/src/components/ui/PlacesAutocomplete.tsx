import { useRef, useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  onCountrySelect?: (country: string) => void;
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  className = "",
  id,
  onCountrySelect
}: PlacesAutocompleteProps) {
  const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // Load Google Maps API script
  useEffect(() => {
    // Check if the script is already loaded
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }

    const googleMapsScript = document.createElement('script');
    googleMapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places`;
    googleMapsScript.async = true;
    googleMapsScript.defer = true;
    googleMapsScript.onload = () => setLoaded(true);
    
    document.head.appendChild(googleMapsScript);

    return () => {
      // Remove the script when component unmounts
      const script = document.querySelector(`script[src="${googleMapsScript.src}"]`);
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize the autocomplete when script is loaded and input ref is available
  useEffect(() => {
    if (!loaded || !inputRef.current) return;

    // Initialize Google Maps Autocomplete
    autoCompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ['address'], fields: ['address_components', 'formatted_address'] }
    );

    // Add event listener for place selection
    const listener = autoCompleteRef.current.addListener('place_changed', () => {
      const place = autoCompleteRef.current?.getPlace();
      
      if (place && place.formatted_address) {
        setInputValue(place.formatted_address);
        onChange(place.formatted_address, place);
        
        // Extract country from address components if available
        if (onCountrySelect && place.address_components) {
          const countryComponent = place.address_components.find(
            (component) => component.types.includes('country')
          );
          
          if (countryComponent) {
            onCountrySelect(countryComponent.long_name);
          }
        }
      }
    });

    return () => {
      // Clean up listener
      if (window.google && window.google.maps && autoCompleteRef.current) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [loaded, onChange, onCountrySelect]);

  // Handle input changes directly
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={className}
    />
  );
}