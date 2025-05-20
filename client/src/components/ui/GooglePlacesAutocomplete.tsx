import React from 'react';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import { getGoogleMapsApiKey } from '../../lib/environment';

interface Props {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  types?: string[];
  autocompletionRequest?: any;
}

export function GooglePlaces({
  value,
  onChange,
  placeholder = 'Cerca...',
  className = '',
  types = ['establishment'],
  autocompletionRequest = {}
}: Props) {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const fetchApiKey = async () => {
      const key = await getGoogleMapsApiKey();
      setApiKey(key);
    };
    
    fetchApiKey();
  }, []);
  
  if (!apiKey) {
    return <div className={`${className} p-2 border rounded-md`}>Caricamento API Google Maps...</div>;
  }
  
  return (
    <div className={className}>
      <GooglePlacesAutocomplete
        apiKey={apiKey}
        selectProps={{
          value,
          onChange,
          placeholder,
          classNamePrefix: 'react-select',
          styles: {
            control: (provided) => ({
              ...provided,
              borderRadius: '0.375rem',
              borderColor: 'hsl(var(--input))',
              minHeight: '40px',
              boxShadow: 'none',
              '&:hover': {
                borderColor: 'hsl(var(--input))',
              }
            }),
            menu: (provided) => ({
              ...provided,
              borderRadius: '0.375rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 9999
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'white',
              color: state.isFocused ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
              cursor: 'pointer',
              '&:active': {
                backgroundColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))'
              }
            })
          }
        }}
        autocompletionRequest={{
          types,
          ...autocompletionRequest
        }}
      />
    </div>
  );
}