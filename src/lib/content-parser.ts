import type { ChartData, Resource } from "@/types"

// Extract key points from text content
export function extractKeyPoints(content: string, conversationHistory: string[] = []): string[] {
  const keyPoints: string[] = []
  const allContent = [...conversationHistory, content].join("\n")

  // Look for lists in the content
  const listRegex = /(?:^|\n)[*\-+]\s+(.+?)(?=\n|$)/g
  let match

  while ((match = listRegex.exec(allContent)) !== null) {
    keyPoints.push(match[1])
  }

  // Look for bold text as key points
  const boldRegex = /\*\*(.*?)\*\*/g
  while ((match = boldRegex.exec(allContent)) !== null) {
    // Only add if it's a reasonable length for a key point
    if (match[1].length > 5 && match[1].length < 100) {
      keyPoints.push(match[1])
    }
  }

  // Extract sentences with important keywords
  const importantKeywords = ["important", "key", "essential", "fundamental", "critical", "crucial", "main", "primary", "core"]
  const sentences = allContent.split(/[.!?]/)

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length > 10 && importantKeywords.some((keyword) => trimmed.toLowerCase().includes(keyword))) {
      keyPoints.push(trimmed)
    }
  }

  // Take the first sentence of each paragraph
  const paragraphs = allContent.split(/\n\n+/)
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length > 0) {
      const firstSentence = paragraph.split(/[.!?]/)[0].trim()
      if (firstSentence.length > 10 && !keyPoints.includes(firstSentence)) {
        keyPoints.push(firstSentence)
      }
    }
  }

  // Remove duplicates and limit to top 5 most relevant points
  return [...new Set(keyPoints)].slice(0, 5)
}

// Extract chart data from text content
export function extractChartData(content: string): ChartData | null {
  // Look for chart data in the content
  const chartRegex = /```chart\s+([\s\S]*?)```/
  const match = content.match(chartRegex)

  if (match && match[1]) {
    try {
      return JSON.parse(match[1])
    } catch (e) {
      console.error("Error parsing chart data:", e)
      return null
    }
  }

  return null
}

// Extract diagram instructions from text content
export function extractDiagramInstructions(content: string): string | null {
  // Look for Mermaid diagram code blocks
  const mermaidRegex = /```mermaid\s+([\s\S]*?)```/
  const match = content.match(mermaidRegex)

  if (match && match[1]) {
    return match[1].trim()
  }

  return null
}

// Extract resources from text content
export function extractResources(content: string): Resource[] {
  // Look for resource blocks
  const resourceRegex = /```resources\s+([\s\S]*?)```/
  const match = content.match(resourceRegex)

  if (match && match[1]) {
    try {
      return JSON.parse(match[1])
    } catch (e) {
      console.error("Error parsing resources:", e)
      return []
    }
  }

  return []
}

// Extract main content (removing diagrams, charts, and resources)
export function extractMainContent(content: string): string {
  // Remove Mermaid diagrams
  content = content.replace(/```mermaid\s+[\s\S]*?```/g, '')
  // Remove chart data
  content = content.replace(/```chart\s+[\s\S]*?```/g, '')
  // Remove resources
  content = content.replace(/```resources\s+[\s\S]*?```/g, '')
  // Remove any remaining code blocks
  content = content.replace(/```[\s\S]*?```/g, '')
  // Clean up multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n')
  return content.trim()
}
