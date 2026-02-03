import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatWeight(weight: number, unit: 'kg' | 'lbs'): string {
  return `${weight} ${unit}`;
}

export function convertWeight(weight: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lbs') {
    return Math.round(weight * 2.20462 * 10) / 10;
  }
  return Math.round((weight / 2.20462) * 10) / 10;
}
