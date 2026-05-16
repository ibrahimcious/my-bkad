import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names, resolving Tailwind class conflicts so
 * that later classes win (e.g. `cn('p-2', 'p-4')` -> `'p-4'`). Used by
 * shadcn/ui primitives and any component that composes class names.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
