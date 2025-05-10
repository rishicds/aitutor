"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Smile, Meh, Frown, Angry, ThumbsUp, Heart, Zap, Coffee, CloudRain, Sun, Moon, Wind } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

const moods = [
  { label: "Happy", icon: Smile, color: "text-green-500", bgColor: "bg-green-100" },
  { label: "Excited", icon: Zap, color: "text-yellow-500", bgColor: "bg-yellow-100" },
  { label: "Loved", icon: Heart, color: "text-red-500", bgColor: "bg-red-100" },
  { label: "Calm", icon: Sun, color: "text-blue-500", bgColor: "bg-blue-100" },
  { label: "Okay", icon: Meh, color: "text-gray-500", bgColor: "bg-gray-100" },
  { label: "Tired", icon: Coffee, color: "text-brown-500", bgColor: "bg-brown-100" },
  { label: "Anxious", icon: Wind, color: "text-purple-500", bgColor: "bg-purple-100" },
  { label: "Sad", icon: CloudRain, color: "text-indigo-500", bgColor: "bg-indigo-100" },
  { label: "Angry", icon: Angry, color: "text-orange-500", bgColor: "bg-orange-100" },
  { label: "Stressed", icon: Frown, color: "text-pink-500", bgColor: "bg-pink-100" },
  { label: "Grateful", icon: ThumbsUp, color: "text-teal-500", bgColor: "bg-teal-100" },
  { label: "Relaxed", icon: Moon, color: "text-cyan-500", bgColor: "bg-cyan-100" },
]

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [customMood, setCustomMood] = useState("")
  const [moodContext, setMoodContext] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulating an API call
    setTimeout(() => {
      toast({
        title: "Mood entry saved",
        description: "Your mood has been recorded successfully.",
      })
      setSelectedMood(null)
      setCustomMood("")
      setMoodContext("")
      setIsLoading(false)
    }, 1000)
  }

  return (
    <ScrollArea className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 lg:p-8 gradient-bg min-h-screen"
      >
        <Card className="max-w-2xl mx-auto glass-effect">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="h2 text-center text-primary">How are you feeling today?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {moods.map(({ label, icon: Icon, color, bgColor }) => (
                  <motion.div key={label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="button"
                      onClick={() => setSelectedMood(label)}
                      variant={selectedMood === label ? "default" : "outline"}
                      className={`flex flex-col items-center justify-center p-2 h-24 w-full hover-lift ${selectedMood === label ? `${bgColor} ${color}` : ""}`}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${color}`} />
                      <span className="text-sm">{label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-mood" className="text-sm font-medium text-muted-foreground">
                  Or describe your mood in your own words:
                </Label>
                <Input
                  type="text"
                  id="custom-mood"
                  value={customMood}
                  onChange={(e) => setCustomMood(e.target.value)}
                  className="w-full p-2 border border-input bg-background text-foreground rounded-md"
                  placeholder="Enter your mood..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood-context" className="text-sm font-medium text-muted-foreground">
                  What's contributing to your mood today?
                </Label>
                <Textarea
                  id="mood-context"
                  value={moodContext}
                  onChange={(e) => setMoodContext(e.target.value)}
                  placeholder="Describe what's influencing your mood..."
                  className="bg-background text-foreground"
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full py-6 text-lg font-semibold hover-lift" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Mood Entry"}
              </Button>
            </CardContent>
          </form>

          {(selectedMood || customMood) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 text-center">
              <p className="text-lg font-medium text-primary">
                You're feeling <span className="font-bold">{selectedMood || customMood}</span> today.
              </p>
              <Progress value={66} className="mt-2" />
            </motion.div>
          )}
        </Card>
      </motion.div>
    </ScrollArea>
  )
}
