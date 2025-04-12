import { Loader2 } from "lucide-react"

export function LoadingSpinner({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClass = size === "small" ? "h-4 w-4" : size === "large" ? "h-8 w-8" : "h-6 w-6"

  return <Loader2 className={`${sizeClass} animate-spin`} />
}
