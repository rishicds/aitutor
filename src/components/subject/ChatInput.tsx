"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { motion } from "framer-motion"

interface ChatInputProps {
  question: string
  setQuestion: (question: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  loading: boolean
  tokens: number
  subjectId: string
}

export function ChatInput({ question, setQuestion, onSubmit, loading, tokens, subjectId }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }, [question])

  return (
    <form
      onSubmit={onSubmit}
      className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10"
    >
      <div className="max-w-5xl mx-auto p-4">
        <div className="relative flex items-end gap-4">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask anything about ${subjectId}...`}
            className="flex-1 resize-none max-h-[200px] bg-white/5 rounded-2xl px-4 py-3 text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onSubmit(e)
              }
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading || tokens < 1 || !question.trim()}
            className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} className={loading ? "animate-pulse" : ""} />
          </motion.button>
        </div>
        {tokens < 1 && <p className="text-red-400 text-sm mt-2">Not enough tokens to continue the conversation</p>}
      </div>
    </form>
  )
}
