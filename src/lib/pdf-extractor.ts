"use client"

import * as pdfjs from 'pdfjs-dist'

// Set worker path to worker bundle.
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

/**
 * Extracts text content from a PDF URL
 * 
 * @param url URL of the PDF to extract text from
 * @param maxPages Maximum number of pages to extract (default: all pages)
 * @returns Promise containing the extracted text
 */
export async function extractTextFromPdf(url: string, maxPages: number = 0): Promise<string> {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(url)
    const pdf = await loadingTask.promise
    
    // Get total number of pages
    const totalPages = pdf.numPages
    const pagesToProcess = maxPages > 0 ? Math.min(maxPages, totalPages) : totalPages
    
    let fullText = ''
    
    // Process each page
    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      
      // Extract text items and join them
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      
      fullText += pageText + "\n\n"
    }
    
    return fullText
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return 'Error: Could not extract text from PDF.'
  }
}

/**
 * Extracts content from a PDF and creates a structured representation
 * for AI context enhancement
 * 
 * @param url URL of the PDF
 * @param metadata Additional metadata about the PDF
 * @returns Promise containing structured PDF data
 */
export async function createPdfContext(
  url: string, 
  metadata: { 
    title: string, 
    subject: string, 
    year: number,
    difficulty: string
  }
): Promise<string> {
  try {
    // Extract text from the first 20 pages (adjust as needed)
    const text = await extractTextFromPdf(url, 20)
    
    // Create a structured context for the AI
    return `
PDF Document: ${metadata.title}
Subject: ${metadata.subject}
Year: ${metadata.year}
Difficulty: ${metadata.difficulty}

CONTENT:
${text}
`
  } catch (error) {
    console.error('Error creating PDF context:', error)
    return `PDF Document: ${metadata.title} (Error extracting content)`
  }
}
