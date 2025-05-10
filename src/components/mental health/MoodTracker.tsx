"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useErrorHandler } from "@/hooks/useErrorHandler"

// ... moods array remains the same

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [customMood, setCustomMood] = useState("")
  const [moodContext, setMoodContext] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { handleError } = useErrorHandler()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("mood_entries").insert([
        {
          mood: selectedMood || customMood,
          context: moodContext,
        },
      ])
      if (error) throw error
      toast({
        title: "Mood entry saved",
        description: "Your mood has been recorded successfully.",
      })
      // Reset form
      setSelectedMood(null)
      setCustomMood("")
      setMoodContext("")
    } catch (error) {
      console.error("Error saving mood entry:", error)
      toast({
        title: "Error",
        description: "Failed to save mood entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ... rest of the component remains the same
}
