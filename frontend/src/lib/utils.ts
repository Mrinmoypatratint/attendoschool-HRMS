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

/**
 * Safely formats any date-like value (number, Date, string, or Firestore Timestamp object)
 * into a localized date string. Prevents "Invalid Date" outputs from Firestore Timestamps.
 */
export function formatDate(dateVal: any, options?: Intl.DateTimeFormatOptions): string {
  if (!dateVal) return "N/A";

  // Firestore Timestamp support
  if (typeof dateVal.toDate === "function") {
    return dateVal.toDate().toLocaleDateString(undefined, options);
  }
  if (dateVal.seconds !== undefined) {
    return new Date(dateVal.seconds * 1000).toLocaleDateString(undefined, options);
  }

  // Already a Date object
  if (dateVal instanceof Date) {
    return dateVal.toLocaleDateString(undefined, options);
  }

  // Parses millisecond number or string
  const parsed = new Date(dateVal);
  if (parsed.toString() !== "Invalid Date") {
    return parsed.toLocaleDateString(undefined, options);
  }

  return "Invalid Date";
}
