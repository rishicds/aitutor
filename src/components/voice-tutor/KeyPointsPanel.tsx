"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Lightbulb } from "lucide-react"
import { extractKeyPoints } from "@/lib/content-parser"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface KeyPointsPanelProps {
  messages: Message[]
}

export default function KeyPointsPanel({ messages }: KeyPointsPanelProps) {
  const [keyPoints, setKeyPoints] = useState<string[]>([])

  // Extract key points from the latest assistant message
  useEffect(() => {
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant")

    if (latestAssistantMessage) {
      const points = extractKeyPoints(latestAssistantMessage.content)
      setKeyPoints(points)
    }
  }, [messages])

  if (keyPoints.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6 bg-gray-50 rounded-lg max-w-md">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Key Points Yet</h3>
          <p className="text-gray-600">
            Ask a question to get important concepts and key points extracted from the AI's response.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm p-4">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
        <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
        Key Points
      </h3>

      <ul className="space-y-3">
        {keyPoints.map((point, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start gap-2"
          >
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{point}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
