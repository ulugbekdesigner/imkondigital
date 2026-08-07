import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind sinflarni xavfsiz birlashtiradi (konfliktlarni hal qiladi). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
