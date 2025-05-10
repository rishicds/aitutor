"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const promptCategories = [
  {
    name: "CBT Guided Journal",
    prompts: [
      "Identify a recent situation in which you experienced a strong emotion. Describe the situation and your thoughts.",
      "Reflect on a recent decision. What were the pros and cons? How did your thoughts influence your choice?",
      "Choose a recurring negative thought. What evidence supports and contradicts it? How can you reframe it?",
      "Describe a situation where you successfully managed a difficult emotion. What strategies did you use?",
      "Identify a goal for the next month. What might hold you back? What steps can you take to overcome barriers?",
    ],
  },
  {
    name: "Self-Reflection",
    prompts: [
      "Am I using my time wisely?",
      "Am I taking anything for granted?",
      "Am I employing a healthy perspective?",
      "Am I living true to myself?",
      "Am I putting enough effort into my relationships?",
    ],
  },
]

export default function GuidedJournal() {
  const [category, setCategory] = useState(promptCategories[0].name)
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [entry, setEntry] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const saveJournalEntry = async (entry: string, prompt: string) => {
    // Simulating an API call
    return new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleNextPrompt = async () => {
    if (entry.trim()) {
      setIsLoading(true)
      // Simulating an API call
      saveJournalEntry(entry, currentCategoryPrompts[currentPrompt]).then(() => {
        toast({
          title: "Journal entry saved",
          description: "Your journal entry has been recorded successfully.",
        })
        setIsLoading(false)
        const currentCategory = promptCategories.find((cat) => cat.name === category)
        if (currentCategory) {
          setCurrentPrompt((prev) => (prev + 1) % currentCategory.prompts.length)
          setEntry("")
        }
      })
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setCurrentPrompt(0)
    setEntry("")
  }

  const currentCategoryPrompts = promptCategories.find((cat) => cat.name === category)?.prompts || []

  return (
    <ScrollArea className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-4 sm:p-6 lg:p-8 gradient-bg min-h-screen"
      >
        <Card className="max-w-2xl mx-auto glass-effect">
          <CardHeader>
            <CardTitle className="h2 text-primary">Guided Journal</CardTitle>
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
