"use client";

import { useLoadScript } from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { MapPin, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCoordinates: (lat: number, lng: number) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelectCoordinates, 
  placeholder,
  icon
}: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    language: "fr",
    region: "TN"
  });

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue: setInputValue,
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: "tn" }, // Restrict to Tunisia
    },
    debounce: 300,
    initOnMount: false,
  });

  useEffect(() => {
    if (isLoaded) {
      init();
    }
  }, [isLoaded, init]);

  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync external value
    if (value !== inputValue) {
      setInputValue(value, false);
    }
  }, [value, inputValue, setInputValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = async (address: string) => {
    setInputValue(address, false);
    onChange(address);
    clearSuggestions();
    setIsOpen(false);

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onSelectCoordinates(lat, lng);
    } catch (error) {
      console.error("Error fetching coordinates: ", error);
    }
  };

  if (loadError) return <div className="text-red-500 font-bold p-2 text-sm bg-red-50 rounded-lg">Erreur Google Maps. Vérifiez l'API Key.</div>;
  if (!isLoaded) return <div className="h-14 w-full bg-gray-100 rounded-2xl animate-pulse"></div>;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {icon || <Search className="absolute ltr:left-5 rtl:right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />}
      <input
        value={inputValue}
        onChange={handleInput}
        disabled={!ready}
        placeholder={placeholder || "Rechercher une adresse..."}
        className="w-full ltr:pl-14 rtl:pr-14 pr-6 py-5 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-vanz-teal focus:bg-white outline-none font-bold text-vanz-navy transition-all"
        onFocus={() => setIsOpen(true)}
      />
      
      {isOpen && status === "OK" && (
        <ul className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-[300px] overflow-y-auto overflow-x-hidden p-2 animate-[fade-in-up_150ms_ease-out]">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-vanz-ice cursor-pointer rounded-lg transition-colors group"
            >
               <MapPin className="w-5 h-5 text-gray-400 group-hover:text-vanz-teal flex-shrink-0" />
               <span className="text-sm font-medium text-gray-700 leading-tight">{description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
