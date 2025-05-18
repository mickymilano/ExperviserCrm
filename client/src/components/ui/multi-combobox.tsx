"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Riferimnto per chiudere correttamente il popover
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const handleSelect = (currentValue: string) => {
    // Toggle dell'opzione selezionata
    const newValues = values.includes(currentValue)
      ? values.filter(value => value !== currentValue)
      : [...values, currentValue]
    
    onChange(newValues)
    
    // Lasciamo il popover aperto per permettere selezioni multiple
    // ma resettiamo l'input per facilitare nuove ricerche
    setInputValue("")
  }

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value))
  }

  // Gestisce la chiusura del popover quando si clicca fuori
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (open && 
          triggerRef.current && 
          !triggerRef.current.contains(event.target as Node) &&
          !(event.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white hover:bg-gray-100 border-2 border-gray-300"
            onClick={() => setOpen(!open)}
            style={{ zIndex: 10 }}
            type="button"
          >
            {values.length > 0 ? `${values.length} selezionati` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-100" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-full min-w-[240px]" 
          align="start"
          sideOffset={4}
          style={{ zIndex: 50 }}
        >
          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              placeholder="Cerca..." 
              value={inputValue}
              onValueChange={setInputValue}
              className="h-9"
            />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer hover:bg-gray-100 flex items-center p-2"
                >
                  <div className="flex items-center w-full">
                    <span 
                      className={cn(
                        "h-4 w-4 mr-2 flex items-center justify-center border rounded", 
                        values.includes(option.value) ? "bg-blue-500 border-blue-600" : "border-gray-300"
                      )}
                    >
                      {values.includes(option.value) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </span>
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {values.map(value => {
            const label = options.find(option => option.value === value)?.label || value
            return (
              <Badge 
                key={value} 
                variant="secondary"
                className="py-1 px-2"
              >
                {label}
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => handleRemove(value)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}