import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Composer de classes Tailwind (padrão shadcn).
 * @example cn("px-2", condition && "bg-red-500", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
