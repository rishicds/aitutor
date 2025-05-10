/* eslint-disable */
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

export default function ResourcePanel() {
  return (
    <div className="flex flex-wrap gap-4 justify-center py-8">
      <a
        href="/practice"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 rounded-lg bg-lavender-500 text-white font-semibold shadow hover:bg-lavender-600 transition text-lg"
      >
        Mock Test
      </a>
      <a
        href="/pyq"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 rounded-lg bg-lavender-500 text-white font-semibold shadow hover:bg-lavender-600 transition text-lg"
      >
        Previous Year Questions
      </a>
      <a
        href="/lab"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 rounded-lg bg-lavender-500 text-white font-semibold shadow hover:bg-lavender-600 transition text-lg"
      >
        Lab Experiments
      </a>
    </div>
  );
}
