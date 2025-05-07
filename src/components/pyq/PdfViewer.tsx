"use client"

import { useState } from "react"
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"

interface PdfViewerProps {
  pdfUrl: string
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
  const [loading, setLoading] = useState(true)
  const [pageNumber, setPageNumber] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1)

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

  const handleIframeLoad = () => {
    setLoading(false)
    setNumPages(10)
  }

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-200 bg-white shadow-sm">
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

      <div className="relative flex-grow overflow-auto bg-gray-100 p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-lavender-600" />
          </div>
        )}
        
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.2s",
            width: "100%",
            height: loading ? "0" : "100%",
          }}
          className="overflow-visible"
        >
          <iframe
            src={`${pdfUrl}#view=FitH&page=${pageNumber}`}
            className="h-full w-full border-0"
            onLoad={handleIframeLoad}
            scrolling="no"
          ></iframe>
        </div>
      </div>
    </div>
  )
}
