"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function CBTAssistant() {
  const [thought, setThought] = useState("")
  const [challenge, setChallenge] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!thought) {
      toast({
        title: "Error",
        description: "Please enter a thought to challenge.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)
    try {
      // Simulating an API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Thought entry saved",
        description: "Your CBT exercise has been recorded successfully.",
      })
      setThought("")
      setChallenge("")
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>CBT Thought Challenger</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thought">Negative Thought</Label>
            <Textarea
              id="thought"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="Enter your negative thought here..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="challenge">Challenge the Thought</Label>
            <Textarea
              id="challenge"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="How can you challenge or reframe this thought?"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save CBT Exercise"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
