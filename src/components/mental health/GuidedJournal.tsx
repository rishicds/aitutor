"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const promptCategories = [
  {
    name: "CBT Guided Journal",
    prompts: [
      "Identify a recent situation in which you experienced a strong emotion (e.g., anger, sadness, anxiety). Describe the situation and the thoughts that went through your mind then.",
      "Reflect on a recent decision or choice you made. What were the pros and cons of that decision? How did your thoughts and emotions influence your choice?",
      "Choose a recurring negative thought or belief that you struggle with. What evidence supports this belief? What evidence contradicts it? How might you reframe this thought in a more balanced and realistic way?",
      "Describe a situation where you successfully managed a difficult emotion or overcame a challenging obstacle. What skills or strategies did you use? How can you apply these skills in future situations?",
      "Identify a goal you would like to achieve in the next month. What thoughts, emotions, or behaviors might be holding you back from achieving this goal? What steps can you take to overcome these barriers?",
      "Reflect on a recent interaction with someone that was difficult or unsatisfying. What thoughts and emotions were present during the interaction? How might your thoughts have influenced your behavior in that situation?",
      "Write a letter to your future self, offering encouragement and support for managing challenges and pursuing personal growth.",
    ],
  },
  {
    name: "Self-Reflection",
    prompts: [
      "Am I using my time wisely?",
      "Am I taking anything for granted?",
      "Am I employing a healthy perspective?",
      "Am I living true to myself?",
      "Am I waking up in the morning ready to take on the day?",
      "Am I thinking negative thoughts before I fall asleep?",
      "Am I putting enough effort into my relationships?",
      "Am I taking care of myself physically?",
      "Am I letting matters that are out of my control stress me out?",
      "Am I achieving the goals that I've set for myself?",
    ],
  },
  {
    name: "Deep Introspection",
    prompts: [
      "Who am I, really?",
      "What worries me most about the future?",
      "If this were the last day of my life, would I have the same plans for today?",
      "What am I really scared of?",
      "Am I holding on to something I need to let go of?",
      "If not now, then when?",
      "What matters most in my life?",
      "What am I doing about the things that matter most in my life?",
      "Why do I matter?",
      "Have I done anything lately that's worth remembering?",
    ],
  },
  {
    name: "Personal Growth",
    prompts: [
      "My favorite way to spend the day is...",
      "If I could talk to my teenage self, the one thing I would say is...",
      "The two moments I'll never forget in my life are... (Describe them in great detail, and what makes them so unforgettable.)",
      "Make a list of 30 things that make you smile.",
      "The words I'd like to live by are...",
      "I couldn't imagine living without...",
      "When I'm in pain—physical or emotional—the kindest thing I can do for myself is...",
      "What does unconditional love look like for you?",
      "Name what is enough for you.",
      "What do you love about life?",
    ],
  },
]

export default function GuidedJournal() {
  const [category, setCategory] = useState(promptCategories[0].name)
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [entry, setEntry] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const currentCategoryPrompts = promptCategories.find((cat) => cat.name === category)?.prompts || []

  useEffect(() => {
    console.log(
      "Available categories:",
      promptCategories.map((cat) => cat.name),
    )
  }, [])

  const handleNextPrompt = async () => {
    if (entry.trim()) {
      setIsLoading(true)
      try {
        await saveJournalEntry(entry, currentCategoryPrompts[currentPrompt])
        toast({
          title: "Journal entry saved",
          description: "Your journal entry has been recorded successfully.",
        })
      } catch (error) {
        console.error("Error saving journal entry:", error)
        toast({
          title: "Error",
          description: "Failed to save journal entry. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    setCurrentPrompt((prev) => (prev + 1) % currentCategoryPrompts.length)
    setEntry("")
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setCurrentPrompt(0)
    setEntry("")
  }

  const saveJournalEntry = async (entry: string, prompt: string) => {
    const { error } = await supabase.from("journal_entries").insert([{ entry, prompt }])
    if (error) throw error
  }

  console.log("Current category:", category)
  console.log(
    "Available categories:",
    promptCategories.map((cat) => cat.name),
  )
  console.log("Current category prompts:", currentCategoryPrompts)

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 lg:p-8 gradient-bg min-h-screen"
      >
        <Card className="max-w-2xl mx-auto glass-effect">
          <CardHeader>
            <CardTitle className="h2 text-primary">Guided Journal</CardTitle>
            <CardDescription>Reflect on your thoughts and experiences</CardDescription>
            <Select onValueChange={handleCategoryChange} value={category}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {promptCategories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.h2
              key={currentPrompt}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h3 text-primary"
            >
              {currentCategoryPrompts[currentPrompt]}
            </motion.h2>
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Start writing here..."
              rows={6}
              className="w-full p-2 border border-input bg-background text-foreground rounded-md"
            />
            <div className="flex items-center mb-4">
              <div className="flex-grow bg-muted rounded-full h-2 mr-2">
                <motion.div
                  className="bg-primary h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentPrompt + 1) / currentCategoryPrompts.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {currentPrompt + 1} / {currentCategoryPrompts.length}
              </span>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleNextPrompt} className="w-full hover-lift" disabled={isLoading}>
                {isLoading ? "Saving..." : "Next Prompt"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </ScrollArea>
  )
}
