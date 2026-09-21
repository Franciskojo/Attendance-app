import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatTime(timeInput: string | Date | undefined | null): string {
  if (!timeInput) return "N/A";
  const date = typeof timeInput === "string" ? new Date(timeInput) : timeInput;
  if (isNaN(date.getTime())) {
    // If it's already a time string like "09:00"
    return String(timeInput);
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function generateSlug(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${cleanTitle}-${randomSuffix}`;
}
