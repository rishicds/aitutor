"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, ExternalLink, FileText, Video, ImageIcon, Copy } from "lucide-react"
import { extractResources } from "@/lib/content-parser"
import type { Resource } from "@/types"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ResourcePanelProps {
  messages: Message[]
}

function getIcon(type?: string) {
  switch (type) {
    case "video":
      return <Video className="h-5 w-5 text-red-500" />
    case "image":
      return <ImageIcon className="h-5 w-5 text-green-500" />
    case "article":
      return <FileText className="h-5 w-5 text-blue-500" />
    default:
      return <BookOpen className="h-5 w-5 text-lavender-500" />
  }
}

export default function ResourcePanel({ messages }: ResourcePanelProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  useEffect(() => {
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant")
    if (latestAssistantMessage) {
      const extracted = extractResources(latestAssistantMessage.content)
      setResources(Array.isArray(extracted) ? extracted : [])
    } else {
      setResources([])
    }
  }, [messages])

  const handleCopy = (url: string, idx: number) => {
    navigator.clipboard.writeText(url)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1200)
  }

  if (!resources.length) {
    return (
      <div className="text-gray-500 text-center py-8">
        No additional resources found for this topic.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {resources.map((resource, idx) => (
        <motion.a
          key={resource.url + idx}
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="group bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-2 cursor-pointer hover:shadow-lg hover:border-lavender-400 transition-all duration-200 relative"
        >
          <div className="flex items-center gap-2 mb-1">
            {getIcon(resource.type)}
            <span className="font-semibold text-gray-800 line-clamp-1">{resource.title}</span>
            <span className="ml-auto flex gap-2 items-center">
              <button
                type="button"
                className="p-1 rounded hover:bg-lavender-100 text-lavender-600 hover:text-lavender-800 transition"
                onClick={e => { e.preventDefault(); e.stopPropagation(); handleCopy(resource.url, idx) }}
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
              </button>
              <ExternalLink className="h-4 w-4 text-lavender-500 group-hover:text-lavender-700" />
            </span>
          </div>
          {resource.source && (
            <div className="text-xs text-gray-400 mb-1">{resource.source}</div>
          )}
          {resource.thumbnail && (
            <img
              src={resource.thumbnail}
              alt={resource.title}
              className="w-full h-32 object-cover rounded mb-2 border"
              loading="lazy"
            />
          )}
          {resource.description && <div className="text-gray-600 text-sm line-clamp-3">{resource.description}</div>}
          {copiedIdx === idx && (
            <span className="absolute top-2 right-14 bg-lavender-100 text-lavender-700 text-xs px-2 py-1 rounded shadow">Copied!</span>
          )}
        </motion.a>
      ))}
    </div>
  )
}
