import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyINR(amountPaise: number): string {
  const rupees = amountPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function maskVehicleOwner(name: string): string {
  if (!name) return "REDACTED";
  const words = name.split(" ");
  return words.map(w => {
    if (w.length <= 2) return w;
    return w[0] + "****" + (w.length > 5 ? w[w.length - 1] : "");
  }).join(" ");
}
