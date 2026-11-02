import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Current time (kept out of component bodies so render stays pure). */
export function nowMs() {
  return Date.now();
}
export function minutesSince(iso: string | Date) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}
