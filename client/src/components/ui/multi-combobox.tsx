"use client"

import React, { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"

export interface ComboboxOption {
  value: string
  label: string
}

interface MultiComboboxProps {
  options: ComboboxOption[]
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  emptyMessage?: string
}

export function MultiCombobox({
  options,
  values = [],
  onChange,
  placeholder = "Seleziona opzioni...",
  emptyMessage = "Nessuna opzione trovata."
}: MultiComboboxProps) {
  // Traccia se il dropdown è aperto o chiuso
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Riferimento al container principale per gestire i clic esterni
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Gestisce la selezione/deselezione di un'opzione
  const toggleOption = (optionValue: string) => {
    console.log("Toggle option:", optionValue);
    if (values.includes(optionValue)) {
      // Se l'opzione è già selezionata, la rimuoviamo
      onChange(values.filter(value => value !== optionValue));
    } else {
      // Altrimenti la aggiungiamo
      onChange([...values, optionValue]);
    }
  };
  
  // Gestisce la rimozione di un'opzione
  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Previene che il clic chiuda il dropdown
    onChange(values.filter(value => value !== optionValue));
  };
  
  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [dropdownOpen]);
  
  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Pulsante per aprire il dropdown */}
      <div 
        className="w-full p-2 border-2 border-gray-300 rounded-md bg-white flex justify-between items-center cursor-pointer"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <span className="text-sm">
          {values.length > 0 ? `${values.length} selezionati` : placeholder}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      {/* Dropdown con le opzioni */}
      {dropdownOpen && (
        <div className="absolute w-full mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</li>
            ) : (
              options.map(option => (
                <li 
                  key={option.value}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => toggleOption(option.value)}
                >
                  <input
                    type="checkbox"
                    checked={values.includes(option.value)}
                    onChange={() => {}} // Gestito dal onClick del li
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm">{option.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
      
      {/* Mostra i tag delle opzioni selezionate */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map(value => {
            const option = options.find(opt => opt.value === value);
            return (
              <Badge key={value} variant="secondary" className="px-2 py-1 flex items-center">
                <span>{option?.label || value}</span>
                <button
                  type="button"
                  className="ml-1"
                  onClick={(e) => removeOption(value, e)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}