"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface SuggestionChipsProps {
  onSelect: (suggestion: string) => void
}

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  const suggestions = [
    "Can you explain this concept in more detail?",
    "Can you give me some examples?",
    "Can you help me practice this?",
    "Let's try a mock test on this topic",
    "Show me some previous year questions",
    "Can we do a lab experiment for this?",
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion)}
          className="bg-lavender-100 text-lavender-600 px-4 py-2 rounded-full text-sm hover:bg-lavender-200 transition-colors"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  )
}
