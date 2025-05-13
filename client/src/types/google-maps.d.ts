declare namespace google.maps.places {
  interface PlaceResult {
    address_components?: AddressComponent[];
    formatted_address?: string;
    geometry?: {
      location: LatLng;
      viewport: LatLngBounds;
    };
    name?: string;
    place_id?: string;
    types?: string[];
  }

  interface AddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
  }

  class Autocomplete {
    constructor(inputElement: HTMLInputElement, options?: AutocompleteOptions);
    addListener(eventName: string, handler: Function): MapsEventListener;
    getPlace(): PlaceResult;
  }

  interface AutocompleteOptions {
    bounds?: LatLngBounds;
    componentRestrictions?: {
      country: string | string[];
    };
    fields?: string[];
    strictBounds?: boolean;
    types?: string[];
  }
}

declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number, noWrap?: boolean);
    lat(): number;
    lng(): number;
  }

  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    contains(latLng: LatLng): boolean;
    extend(latLng: LatLng): LatLngBounds;
  }

  interface MapsEventListener {
    remove(): void;
  }

  namespace event {
    function removeListener(listener: MapsEventListener): void;
  }
}

// Estendi l'interfaccia Window per includere il callback di inizializzazione
interface Window {
  initMap?: () => void;
}