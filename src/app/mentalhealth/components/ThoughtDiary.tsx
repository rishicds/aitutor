"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const cognitiveDistortions = [
  { value: "all-or-nothing", label: "All-or-Nothing Thinking" },
  { value: "overgeneralization", label: "Overgeneralization" },
  { value: "mental-filter", label: "Mental Filter" },
  { value: "disqualifying-positive", label: "Disqualifying the Positive" },
  { value: "jumping-to-conclusions", label: "Jumping to Conclusions" },
  { value: "magnification", label: "Magnification or Minimization" },
  { value: "emotional-reasoning", label: "Emotional Reasoning" },
  { value: "should-statements", label: "Should Statements" },
  { value: "labeling", label: "Labeling" },
  { value: "personalization", label: "Personalization" },
]

export default function ThoughtDiary() {
  const [entry, setEntry] = useState({
    situation: "",
    automaticThoughts: "",
    emotions: "",
    distortion: "",
    evidenceFor: "",
    evidenceAgainst: "",
    alternativeThought: "",
    newEmotion: "",
  })

  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const savedEntry = localStorage.getItem("thoughtDiaryEntry")
    if (savedEntry) {
      setEntry(JSON.parse(savedEntry))
    }
  }, [])

  useEffect(() => {
    const saveEntry = () => {
      localStorage.setItem("thoughtDiaryEntry", JSON.stringify(entry))
      setLastSaved(new Date())
    }

    const debounce = setTimeout(saveEntry, 1000)
    return () => clearTimeout(debounce)
  }, [entry])

  const handleChange = (field: keyof typeof entry, value: string) => {
    setEntry((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Simulating an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Thought entry saved",
        description: "Your thought diary entry has been recorded successfully.",
      })
      // Reset form
      setEntry({
        situation: "",
        automaticThoughts: "",
        emotions: "",
        distortion: "",
        evidenceFor: "",
        evidenceAgainst: "",
        alternativeThought: "",
        newEmotion: "",
      })
      setLastSaved(null)
    } catch (error) {
      console.error("Error saving thought entry:", error)
      toast({
        title: "Error",
        description: "Failed to save thought entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="p-6 bg-white/80 backdrop-blur-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="situation" className="block text-sm font-medium text-gray-700">
              Situation
            </label>
            <Textarea
              id="situation"
              value={entry.situation}
              onChange={(e) => handleChange("situation", e.target.value)}
              placeholder="Describe the situation..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="automaticThoughts" className="block text-sm font-medium text-gray-700">
              Automatic Thoughts
            </label>
            <Textarea
              id="automaticThoughts"
              value={entry.automaticThoughts}
              onChange={(e) => handleChange("automaticThoughts", e.target.value)}
              placeholder="What thoughts went through your mind?"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="emotions" className="block text-sm font-medium text-gray-700">
              Emotions
            </label>
            <Input
              id="emotions"
              value={entry.emotions}
              onChange={(e) => handleChange("emotions", e.target.value)}
              placeholder="What emotions did you feel? (e.g., sad, angry, anxious)"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="distortion" className="block text-sm font-medium text-gray-700">
              Cognitive Distortion
            </label>
            <Select onValueChange={(value) => handleChange("distortion", value)} value={entry.distortion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a cognitive distortion" />
              </SelectTrigger>
              <SelectContent>
                {cognitiveDistortions.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="evidenceFor" className="block text-sm font-medium text-gray-700">
              Evidence For
            </label>
            <Textarea
              id="evidenceFor"
              value={entry.evidenceFor}
              onChange={(e) => handleChange("evidenceFor", e.target.value)}
              placeholder="What evidence supports your thought?"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="evidenceAgainst" className="block text-sm font-medium text-gray-700">
              Evidence Against
            </label>
            <Textarea
              id="evidenceAgainst"
              value={entry.evidenceAgainst}
              onChange={(e) => handleChange("evidenceAgainst", e.target.value)}
              placeholder="What evidence does not support your thought?"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="alternativeThought" className="block text-sm font-medium text-gray-700">
              Alternative Thought
            </label>
            <Textarea
              id="alternativeThought"
              value={entry.alternativeThought}
              onChange={(e) => handleChange("alternativeThought", e.target.value)}
              placeholder="What's a more balanced or realistic thought?"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="newEmotion" className="block text-sm font-medium text-gray-700">
              New Emotion
            </label>
            <Input
              id="newEmotion"
              value={entry.newEmotion}
              onChange={(e) => handleChange("newEmotion", e.target.value)}
              placeholder="How do you feel now?"
              className="w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Entry"}
            </Button>
            {lastSaved && (
              <div className="text-sm text-muted-foreground flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Last saved: {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
