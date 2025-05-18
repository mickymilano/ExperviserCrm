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

  const handleSelect = (currentValue: string) => {
    const newValues = values.includes(currentValue)
      ? values.filter(value => value !== currentValue)
      : [...values, currentValue]
    
    onChange(newValues)
  }

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value))
  }

  const selectedLabels = values
    .map(value => options.find(option => option.value === value)?.label || value)

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {values.length > 0 ? `${values.length} selezionati` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Cerca..." />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    handleSelect(option.value)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      values.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
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