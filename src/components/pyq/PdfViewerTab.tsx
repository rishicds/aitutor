"use client"

import { useState } from "react"
import { File, Search, AlertCircle, Loader2 } from "lucide-react"
import PdfViewer from "./PdfViewer"
import ReactMarkdown from "react-markdown"

interface PyqPdf {
  id: string
  title: string
  subject: string
  year: number
  difficulty: "easy" | "medium" | "hard"
  fileUrl: string
  fileName: string
  uploadedAt: any
  contentProcessed: boolean
}

interface PdfViewerTabProps {
  pdfs: PyqPdf[]
  selectedPdf: PyqPdf | null
  setSelectedPdf: (pdf: PyqPdf | null) => void
  handleAskPdfQuestion: (question: string) => void
  pdfQuestion: string
  pdfAnswer: string
  processingPdfQuestion: boolean
  tokens: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedSubject: string
  setSelectedSubject: (subject: string) => void
}

export default function PdfViewerTab({
  pdfs,
  selectedPdf,
  setSelectedPdf,
  handleAskPdfQuestion,
  pdfQuestion,
  pdfAnswer,
  processingPdfQuestion,
  tokens,
  searchQuery,
  setSearchQuery,
  selectedSubject,
  setSelectedSubject,
}: PdfViewerTabProps) {
  return (
    <div>
      {selectedPdf ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PdfViewer 
              pdfUrl={selectedPdf.fileUrl}
              onAskQuestion={handleAskPdfQuestion}
            />
          </div>
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-semibold text-lavender-800">{selectedPdf.title}</h3>
              <div className="mb-4">
                <p><span className="font-medium">Subject:</span> {selectedPdf.subject}</p>
                <p><span className="font-medium">Year:</span> {selectedPdf.year}</p>
                <p>
                  <span className="font-medium">Difficulty:</span>{" "}
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      selectedPdf.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : selectedPdf.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedPdf.difficulty}
                  </span>
                </p>
              </div>
              
              <button
                onClick={() => setSelectedPdf(null)}
                className="mb-6 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Back to PDF List
              </button>
              
              {/* Q&A Section */}
              {pdfQuestion && (
                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-2 font-medium text-lavender-700">Your Question:</h4>
                  <p className="mb-4 text-gray-800">{pdfQuestion}</p>
                  
                  {processingPdfQuestion ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-lavender-600" />
                      <span>Processing your question...</span>
                    </div>
                  ) : pdfAnswer ? (
                    <div>
                      <h4 className="mb-2 font-medium text-lavender-700">Answer:</h4>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{pdfAnswer}</ReactMarkdown>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
              
              {tokens <= 0 && (
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                  <div className="flex items-start">
                    <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">You've run out of tokens</p>
                      <p className="mt-1 text-sm">Please get more tokens to continue asking questions.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // PDF List View
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-lavender-800">Previous Year Question Papers</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search PDFs..."
                className="rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-lavender-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubject("all")}
              className={`rounded-full px-4 py-1 text-sm ${
                selectedSubject === "all"
                  ? "bg-lavender-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Subjects
            </button>
            
            {/* Get unique subjects */}
            {Array.from(new Set(pdfs.map((pdf) => pdf.subject))).map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`rounded-full px-4 py-1 text-sm ${
                  selectedSubject === subject
                    ? "bg-lavender-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
          
          {/* PDF Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pdfs.filter(pdf => 
              (selectedSubject === "all" || pdf.subject === selectedSubject) &&
              (searchQuery === "" || 
               pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               pdf.subject.toLowerCase().includes(searchQuery.toLowerCase()))
            ).map((pdf) => (
              <div 
                key={pdf.id}
                onClick={() => setSelectedPdf(pdf)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start mb-4">
                  <div className="mr-3 text-lavender-600">
                    <File className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-lavender-800 line-clamp-2">{pdf.title}</h3>
                    <p className="text-sm text-gray-500">{pdf.subject} • {pdf.year}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      pdf.difficulty === "easy"
                        ? "bg-green-100 text-green-800"
                        : pdf.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {pdf.difficulty}
                  </span>
                  <button className="text-lavender-600 hover:text-lavender-800">
                    View PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {pdfs.filter(pdf => 
            (selectedSubject === "all" || pdf.subject === selectedSubject) &&
            (searchQuery === "" || 
             pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             pdf.subject.toLowerCase().includes(searchQuery.toLowerCase()))
          ).length === 0 && (
            <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
              <File className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-gray-500">No PDFs found. Check back later or try a different search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
