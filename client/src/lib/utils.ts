import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date in the Italian format: DD/MM/YYYY
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return "";
  
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return "";
  }
  
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format a price with the Euro symbol
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

/**
 * Get the initials from a name
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}