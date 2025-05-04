"use client"

import { useEffect, useState } from "react"
import mermaid from "mermaid"

interface DiagramComponentProps {
  instructions: string
}

export default function DiagramComponent({ instructions }: DiagramComponentProps) {
  const [svgContent, setSvgContent] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
    })

    const renderDiagram = async () => {
      try {
        // Clean up the instructions to ensure it's valid mermaid syntax
        let mermaidCode = instructions

        // If it doesn't start with a diagram type, assume it's a flowchart
        if (
          !instructions.trim().startsWith("graph") &&
          !instructions.trim().startsWith("flowchart") &&
          !instructions.trim().startsWith("sequenceDiagram") &&
          !instructions.trim().startsWith("classDiagram")
        ) {
          mermaidCode = `flowchart TD\n${instructions}`
        }

        const { svg } = await mermaid.render("mermaid-diagram", mermaidCode)
        setSvgContent(svg)
        setError(null)
      } catch (err) {
        console.error("Error rendering mermaid diagram:", err)
        setError("Failed to render diagram")

        // Fallback to a simple diagram
        try {
          const fallbackDiagram = `flowchart TD
            A[Start] --> B[Process]
            B --> C{Decision}
            C -->|Yes| D[Action 1]
            C -->|No| E[Action 2]
            D --> F[End]
            E --> F`

          const { svg } = await mermaid.render("mermaid-fallback", fallbackDiagram)
          setSvgContent(svg)
        } catch (fallbackErr) {
          console.error("Error rendering fallback diagram:", fallbackErr)
        }
      }
    }

    renderDiagram()
  }, [instructions])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">Showing a simplified diagram instead</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: svgContent }} />
  )
}
