"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getExperimentAnalysis } from "@/lib/ai-helpers"
import { Loader2, Send } from "lucide-react"

interface Experiment {
  id: string
  title: string
  category: string
  // Other properties...
}

interface ExperimentParameters {
  [key: string]: number | string
}

interface AIAnalysisProps {
  experiment: Experiment
  parameters: ExperimentParameters
}

export default function AIAnalysis({ experiment, parameters }: AIAnalysisProps) {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [questionHistory, setQuestionHistory] = useState<{ question: string; response: string }[]>([])

  const handleAskQuestion = async () => {
    if (!question.trim()) return

    setIsLoading(true)

    try {
      const aiResponse = await getExperimentAnalysis({
        experimentId: experiment.id,
        experimentName: experiment.title,
        category: experiment.category,
        parameters,
        question: question,
      })

      // Add to history
      setQuestionHistory([
        ...questionHistory,
        {
          question: question,
          response: aiResponse,
        },
      ])

      // Set current response
      setResponse(aiResponse)

      // Clear input
      setQuestion("")
    } catch (error) {
      console.error("Error getting AI response:", error)
      setResponse("Sorry, I couldn't generate an analysis at this time. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">AI Analysis & Assistance</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ask questions about the experiment and get AI-powered explanations based on current parameters.
          </p>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this experiment..."
                className="flex-1 p-2 border rounded-lg focus:ring-teal-500 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
              />
              <Button
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
                className="bg-gradient-to-r from-teal-500 to-blue-600"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="mr-2 h-4 w-4" />
                    Ask
                  </div>
                )}
              </Button>
            </div>

            {response && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: response.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>") }}
                  />
                </div>
              </div>
            )}

            {questionHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Previous Questions</h4>
                <div className="space-y-3">
                  {questionHistory
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <p className="font-medium text-sm">{item.question}</p>
                        <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {item.response.split("\n")[0]}...
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs mt-1"
                          onClick={() => setResponse(item.response)}
                        >
                          View full answer
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
