"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const handleError = (error: Error) => {
    console.error("An error occurred:", error)
    setError(error)
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred. Please try again.",
      variant: "destructive",
    })
  }

  return { error, handleError }
}
