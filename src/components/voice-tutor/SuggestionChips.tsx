"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void
}

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Update suggestions based on context
  useEffect(() => {
    // In a real app, these would be dynamically generated based on conversation context
    setSuggestions([
      "Show me a diagram",
      "Explain with an example",
      "Give me practice questions",
      "Simplify this concept",
      "How is this applied in real life?",
    ])
  }, [])

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={suggestion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <button
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1 px-3 rounded-full transition-colors"
            onClick={() => onSelect(suggestion)}
          >
            {suggestion}
          </button>
        </motion.div>
      ))}
    </div>
  )
}
