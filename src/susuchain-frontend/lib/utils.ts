import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatICP(amount: bigint): string {
  const icp = Number(amount) / 100000000 // Convert from e8s to ICP
  return icp.toFixed(4)
}

export function formatDate(timestamp: bigint | number): string {
  const date = new Date(Number(timestamp) / 1000000) // Convert from nanoseconds
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function truncatePrincipal(principal: string, length = 8): string {
  if (principal.length <= length * 2) return principal
  return `${principal.slice(0, length)}...${principal.slice(-length)}`
}
