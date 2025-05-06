"use client"

import { useState } from "react"
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Send } from "lucide-react"

interface PdfViewerProps {
  pdfUrl: string
  onAskQuestion: (question: string) => void
}

export default function PdfViewer({ pdfUrl, onAskQuestion }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [question, setQuestion] = useState("")

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset
      return newPageNumber >= 1 && newPageNumber <= numPages ? newPageNumber : prevPageNumber
    })
  }

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.5))
  }

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5))
  }

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim()) {
      onAskQuestion(question)
      setQuestion("")
    }
  }

  // When the iframe loads, we'll try to determine the number of pages
  const handleIframeLoad = () => {
    setLoading(false)
    // For a real app, you might need to use a PDF.js or similar library
    // to get the actual number of pages. For now, we'll set a placeholder.
    setNumPages(10) // placeholder
  }

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-lavender-50 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="mr-2 rounded-full p-1 hover:bg-lavender-200 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || "--"}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="ml-2 rounded-full p-1 hover:bg-lavender-200 disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="mr-2 rounded-full p-1 hover:bg-lavender-200 disabled:opacity-50"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="ml-2 rounded-full p-1 hover:bg-lavender-200 disabled:opacity-50"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative h-[70vh] overflow-auto bg-gray-100 p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
          </div>
        )}
        
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            transition: "transform 0.2s",
          }}
        >
          <iframe
            src={`${pdfUrl}#view=FitH&page=${pageNumber}`}
            className="h-[70vh] w-full"
            onLoad={handleIframeLoad}
          ></iframe>
        </div>
      </div>

      <form onSubmit={handleAskQuestion} className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-lavender-500 focus:outline-none"
            placeholder="Ask a question about this PDF..."
          />
          <button
            type="submit"
            disabled={!question.trim()}
            className="rounded-lg bg-lavender-600 px-4 py-2 font-medium text-white hover:bg-lavender-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
