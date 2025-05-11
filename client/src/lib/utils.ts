import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "??";
  
  const first = firstName ? firstName.charAt(0) : "";
  const last = lastName ? lastName.charAt(0) : "";
  
  return `${first}${last}`;
}

export function formatPhoneNumber(phoneNumber?: string): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  return phoneNumber;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateAvatarColor(id: number): string {
  const colors = [
    "bg-primary", 
    "bg-secondary", 
    "bg-accent", 
    "bg-warning", 
    "bg-destructive",
    "bg-emerald-500",
    "bg-indigo-500",
    "bg-amber-500"
  ];
  return colors[id % colors.length];
}

export function formatDateToLocal(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}
