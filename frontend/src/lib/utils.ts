/**
 * utils.ts
 * --------
 * Small, shared UI utility helpers.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine conditional class names and resolve conflicting Tailwind classes.
 * `clsx` flattens/filters the inputs; `twMerge` then dedupes/overrides
 * conflicting Tailwind utilities (e.g. `px-2 px-4` -> `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
