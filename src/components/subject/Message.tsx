"use client"
import { Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion } from "framer-motion"
import { extractMainContent } from "@/lib/content-parser"

interface MessageProps {
  content: string
  isAi: boolean
}

export function Message({ content, isAi }: MessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 p-6 ${isAi ? "bg-purple-500/5" : ""}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isAi ? "bg-gradient-to-r from-purple-600 to-blue-600" : "bg-black/10"
        }`}
      >
        {isAi ? <Bot size={18} className="text-black" /> : <User size={18} className="text-black" />}
      </div>
      <div className="flex-1 min-w-0">
        {isAi ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-invert max-w-none
              prose-p:leading-7
              prose-headings:text-purple-400 
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
              prose-code:text-pink-500 prose-code:bg-white/5 prose-code:rounded prose-code:px-1
              prose-strong:text-purple-300
              prose-pre:bg-black/30 prose-pre:border prose-pre:border-purple-500/20
              prose-blockquote:border-l-purple-500 prose-blockquote:bg-purple-500/5 prose-blockquote:py-1
              selection:bg-purple-500/30"
          >
            {extractMainContent(content)}
          </ReactMarkdown>
        ) : (
          <p className="text-black/90 leading-7">{content}</p>
        )}
      </div>
    </motion.div>
  )
}
