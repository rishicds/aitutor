"use client"

import { useState, useEffect } from "react"
import { Loader2, BarChart3, Maximize2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ChartComponent from "./ChartComponent"
import DiagramComponent from "./DiagramComponent"
import { extractChartData, extractDiagramInstructions } from "@/lib/content-parser"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface VisualizationPanelProps {
  messages: Message[]
  currentTopic: string
  isProcessing: boolean
}

export default function VisualizationPanel({ messages, currentTopic, isProcessing }: VisualizationPanelProps) {
  const [chartData, setChartData] = useState<any>(null)
  const [diagramInstructions, setDiagramInstructions] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState<"chart" | "diagram" | null>(null)

  // Extract chart data and diagram instructions from messages
  useEffect(() => {
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant")

    if (latestAssistantMessage) {
      const extractedChartData = extractChartData(latestAssistantMessage.content)
      if (extractedChartData) {
        setChartData(extractedChartData)
      }

      const extractedDiagramInstructions = extractDiagramInstructions(latestAssistantMessage.content)
      if (extractedDiagramInstructions) {
        setDiagramInstructions(extractedDiagramInstructions)
      }
    }
  }, [messages])

  // If no visualization data is available, show a placeholder
  if (!chartData && !diagramInstructions && !isProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6 bg-gray-50 rounded-lg max-w-md">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-lavender-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Visualizations Yet</h3>
          <p className="text-gray-600">
            Ask a question that could benefit from visual representation, such as data comparisons, processes, or
            concepts.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Try asking: "Show me a diagram of photosynthesis" or "Compare renewable energy sources"
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isProcessing && (
        <div className="flex items-center justify-center h-40">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-lavender-500" />
            <p className="mt-2 text-gray-500">Generating visualizations...</p>
          </div>
        </div>
      )}

      {chartData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative"
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-lavender-500" />
                {chartData.title || "Data Visualization"}
              </h3>
              <p className="text-sm text-gray-600">{chartData.description || "Visual representation of the data"}</p>
            </div>
            <button
              className="p-2 rounded hover:bg-lavender-100 text-lavender-600"
              title="Expand chart"
              onClick={() => setModalOpen("chart")}
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <div className="h-64">
              <ChartComponent key="panel" data={chartData} />
            </div>
          </div>
        </motion.div>
      )}

      {diagramInstructions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative"
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Concept Diagram</h3>
              <p className="text-sm text-gray-600">Visual representation of {currentTopic}</p>
            </div>
            <button
              className="p-2 rounded hover:bg-lavender-100 text-lavender-600"
              title="Expand diagram"
              onClick={() => setModalOpen("diagram")}
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            <div className="h-64">
              <DiagramComponent key="panel" instructions={diagramInstructions} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-[90vw] h-[80vh] max-w-5xl max-h-[90vh] overflow-auto relative flex flex-col"
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
                onClick={() => setModalOpen(null)}
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
              {modalOpen === "chart" && chartData && (
                <div className="w-full h-full flex-1">
                  <ChartComponent key="modal" data={chartData} className="w-full h-full" />
                </div>
              )}
              {modalOpen === "diagram" && diagramInstructions && (
                <div className="w-full h-full flex-1">
                  <DiagramComponent key="modal" instructions={diagramInstructions} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
