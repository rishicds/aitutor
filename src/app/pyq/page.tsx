/* eslint-disable */
"use client"
import { useState, useEffect, FormEvent, useRef } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, increment, collection, getDocs, query, where } from "firebase/firestore"
import { getGeminiResponse, generatePracticeQuestions } from "@/lib/gemini"
import { Loader2, BookOpen, Download, Share2, Bookmark, Search, Send, Check, X, PlusCircle, AlertCircle, ChevronUp, ChevronDown, File, FileText, Coins } from 'lucide-react'
import ReactMarkdown from "react-markdown"
import PdfViewer from "@/components/pyq/PdfViewer"
import PdfViewerTab from "@/components/pyq/PdfViewerTab"
import { extractTextFromPdf, createPdfContext } from "@/lib/pdf-extractor"

// Custom lavender color scheme
const lavenderColors = {
  glassmorphism: "bg-white/80 backdrop-blur-md border border-lavender-200",
  neonGlow: "text-lavender-700 drop-shadow-[0_0_10px_rgba(150,120,230,0.7)]",
}

interface PYQ {
  id: string
  question: string
  subject: string
  topic: string
  year?: number
  difficulty: "easy" | "medium" | "hard"
  answer?: string
  isAIGenerated: boolean
  userAnswer?: string
  userAnswerFeedback?: string
  isCorrect?: boolean
  createdAt: any
}

// PDF document interface
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

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  sources?: Array<{ pageContent: string; metadata: Record<string, any> }>
}

export default function PyqChatPage() {
  const [user] = useAuthState(auth)
  const [pyqs, setPyqs] = useState<PYQ[]>([])
  const [filteredPyqs, setFilteredPyqs] = useState<PYQ[]>([])
  const [pdfs, setPdfs] = useState<PyqPdf[]>([])
  const [selectedPdf, setSelectedPdf] = useState<PyqPdf | null>(null)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [tokens, setTokens] = useState(0)
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"year" | "difficulty" | "createdAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [pdfQuestion, setPdfQuestion] = useState("")
  const [pdfAnswer, setPdfAnswer] = useState("")
  const [processingPdfQuestion, setProcessingPdfQuestion] = useState(false)
  const [processedPdfs, setProcessedPdfs] = useState<PyqPdf[]>([])
  const [loadingPdfs, setLoadingPdfs] = useState(true)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [expandedQuestions, setExpandedQuestions] = useState<{[key: string]: boolean}>({})
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({})
  const [evaluatingAnswer, setEvaluatingAnswer] = useState<string | null>(null)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [topicInput, setTopicInput] = useState('')
  const [selectedSubjectInput, setSelectedSubjectInput] = useState('Mathematics')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [selectedFormat, setSelectedFormat] = useState<'multiple-choice' | 'short-answer' | 'long-answer' | 'mixed'>('mixed')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  useEffect(() => {
    if (user) {
      setLoading(true)

      // Fetch tokens from Firestore
      const fetchTokens = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setTokens(userDoc.data()?.tokens || 10)
          } else {
            setTokens(10)
          }
        } catch (error) {
          console.error("Error fetching tokens:", error)
          setTokens(10)
        } finally {
          setLoading(false)
        }
      }

      // Fetch PDFs from Firestore
      const fetchPdfs = async () => {
        try {
          const q = query(collection(db, 'pyqPdfs'), where('contentProcessed', '==', true))
          const querySnapshot = await getDocs(q)
          const pdfs = querySnapshot.docs.map(doc => ({
            id: doc.id, ...doc.data(),
          } as PyqPdf))
          setProcessedPdfs(pdfs)
          if (pdfs.length === 0) {
            setPageError("No PYQs have been processed for chat yet. Please process some PDFs in the admin panel.")
          }
        } catch (err) {
          console.error("Error fetching processed PDFs:", err)
          setPageError("Failed to load PYQs. Please ensure you are connected and try again.")
        } finally {
          setLoadingPdfs(false)
        }
      }

      fetchTokens()
      fetchPdfs()
    }
  }, [user])

  useEffect(() => {
    // Apply filters and sorting
    let result = [...pyqs]

    // Subject filter
    if (selectedSubject !== "all") {
      result = result.filter((pyq) => pyq.subject === selectedSubject)
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (pyq) =>
          pyq.question.toLowerCase().includes(query) ||
          pyq.topic.toLowerCase().includes(query) ||
          pyq.subject.toLowerCase().includes(query),
      )
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "createdAt") {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime
      } else if (sortBy === "year") {
        const aYear = a.year || 0
        const bYear = b.year || 0
        return sortOrder === "asc" ? aYear - bYear : bYear - aYear
      } else {
        const difficultyValue = { easy: 1, medium: 2, hard: 3 }
        const aVal = difficultyValue[a.difficulty]
        const bVal = difficultyValue[b.difficulty]
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal
      }
    })

    setFilteredPyqs(result)
  }, [pyqs, selectedSubject, searchQuery, sortBy, sortOrder])

  const parseGeneratedQuestions = (markdownText: string): PYQ[] => {
    const newPyqs: PYQ[] = []

    // First, check if there's a solutions section we need to split off
    const mainSections = markdownText.split(/\n---+\n|\n\*\*Solutions\s*&?\s*Explanations?\*\*/i)
    const questionsSection = mainSections[0]
    const solutionsSection = mainSections.length > 1 ? mainSections[1] : ""

    // Try to identify individual questions with multiple strategies
    let questionBlocks = []

    // Strategy 1: Look for numbered questions with bold markers
    const boldNumberedPattern =
      /\*\*\s*(?:Question\s*)?\d+[.:]\*\*|\*\*\s*\d+\.\s*(?:Multiple Choice Question|Short Answer Question|Numerical\/Analytical Question|Long Answer Question)/gi
    if (questionsSection.match(boldNumberedPattern)) {
      questionBlocks = questionsSection.split(boldNumberedPattern).slice(1)
      if (questionBlocks.length === 0) {
        questionBlocks = [questionsSection] // Fallback if split removed everything
      }
    } else {
      // Strategy 2: Try headers with question numbers
      questionBlocks = questionsSection.split(/(?=\n?#{1,3}\s*(?:Question|Q)\s*\d+)/i)

      // Strategy 3: If that didn't work, try numbered questions format
      if (questionBlocks.length <= 1) {
        questionBlocks = questionsSection.split(/\n(?=\d+\.\s)/)
      }

      // Strategy 4: Try more patterns
      if (questionBlocks.length <= 1) {
        questionBlocks = questionsSection.split(/\n\n(?=(?:Question|Q)[\s:]*\d+)/i)
      }

      // Strategy 5: Look for bold questions or other markers
      if (questionBlocks.length <= 1) {
        questionBlocks = questionsSection.split(/\n\n(?=\*\*(?:Question|Q)[\s:]*\d+\*\*)/i)
      }
    }

    // Extract solution information from the solutions section
    const solutionMap = new Map()

    if (solutionsSection) {
      // Try to extract solutions by identifying solution headers
      const solutionBlocks = solutionsSection.split(
        /\*\*Solution\s*\d+\*\*|\*\*Explanation\s*\d+\*\*|#{1,3}\s*Solution\s*\d+|#{1,3}\s*Explanation\s*\d+/i,
      )
      // Get the question numbers from the solution headers
      const solutionNumbersMatch = solutionsSection.match(
        /\*\*Solution\s*(\d+)\*\*|\*\*Explanation\s*(\d+)\*\*|#{1,3}\s*Solution\s*(\d+)|#{1,3}\s*Explanation\s*(\d+)/gi,
      )

      if (solutionNumbersMatch && solutionBlocks.length > 1) {
        // Map solution content to question numbers
        for (let i = 0; i < solutionNumbersMatch.length; i++) {
          const numMatch = solutionNumbersMatch[i].match(/\d+/)
          if (numMatch && i + 1 < solutionBlocks.length) {
            const qNum = Number.parseInt(numMatch[0])
            solutionMap.set(qNum, solutionBlocks[i + 1].trim())
          }
        }
      }
    }

    // Filter out empty blocks and process each question block
    questionBlocks
      .filter((block) => block.trim())
      .forEach((block, index) => {
        // Try to identify the question number
        const questionNumberMatch = block.match(/^\s*\**\s*(?:Question\s*)?(\d+)[.:]/i) ||
          block.match(/\*\*\s*(?:Question\s*)?(\d+)[.:]\*\*/i) || [`${index + 1}`, `${index + 1}`] // Fallback if no number found

        const questionNumber = questionNumberMatch ? Number.parseInt(questionNumberMatch[1]) : index + 1

        // Clean up the question block
        let question = block
          .replace(/^\s*\**\s*(?:Question\s*)?\d+[.:]\*\*\s*/i, "") // Remove bolded question number prefix
          .replace(/^\s*\d+[.:]\s*/, "") // Remove simple question number prefix
          .replace(/\n\(Source:.*?\)/gi, "") // Remove source information
          .replace(/\*\*Type:\*\*.*?\n/gi, "") // Remove type information
          .replace(/\*\*Difficulty:\*\*.*?\n/gi, "") // Remove difficulty information
          .replace(/\*\*Topic:\*\*.*?\n/gi, "") // Remove topic information
          .replace(/\*\*Subject:\*\*.*?\n/gi, "") // Remove subject information
          .trim()

        const answer = solutionMap.get(questionNumber) || ""

        // Extract question type and difficulty information if available
        let questionDifficulty: "easy" | "medium" | "hard" = "medium" // Explicitly type here
        if (block.toLowerCase().includes("difficulty: easy")) {
          questionDifficulty = "easy"
        } else if (block.toLowerCase().includes("difficulty: hard")) {
          questionDifficulty = "hard"
        } else if (block.toLowerCase().includes("(easy)")) {
          questionDifficulty = "easy"
        } else if (block.toLowerCase().includes("(hard)")) {
          questionDifficulty = "hard"
        }

        // Remove any remaining header formatting
        question = question.replace(/^\*\*.*?\*\*\s*/gm, "")

        // Only add if we have a question
        if (question) {
          const newPyq: PYQ = {
            id: `gen-${Date.now()}-${index}`,
            question: question,
            subject: "Mathematics",
            topic: "Topic",
            difficulty: questionDifficulty,
            answer: answer || undefined,
            isAIGenerated: true,
            createdAt: { seconds: Date.now() / 1000 },
          }

          newPyqs.push(newPyq)
        }
      })

    return newPyqs
  }

  const handleGetAnswer = async (pyq: PYQ) => {
    if (!user || tokens < 1) return

    setProcessingId(pyq.id)

    try {
      const tutorParams = {
        subject: pyq.subject,
        topic: pyq.topic,
        personality: "friendly" as "friendly" | "strict" | "neutral",
        level: (pyq.difficulty === "easy" ? "beginner" : pyq.difficulty === "medium" ? "intermediate" : "expert") as
          | "beginner"
          | "intermediate"
          | "expert",
        teachingStyle: "example-based" as "conceptual" | "example-based" | "problem-solving",
      }

      const aiResponse = await getGeminiResponse(
        `Please provide a detailed solution for this ${pyq.subject} question about ${pyq.topic}: ${pyq.question}`,
        tutorParams,
      )

      // Update state with solution
      setPyqs(pyqs.map((q) => (q.id === pyq.id ? { ...q, answer: aiResponse } : q)))

      // Deduct a token
      try {
        if (user) {
          const userRef = doc(db, "users", user.uid)
          await updateDoc(userRef, {
            tokens: increment(-1),
          })
          setTokens(tokens - 1)
        }
      } catch (error) {
        console.error("Error updating tokens:", error)
      }
    } catch (error) {
      console.error("Error getting AI response:", error)
      alert("Failed to get solution. Please try again.")
    } finally {
      setProcessingId(null)
    }
  }

  const handleGenerateQuestions = async () => {
    if (!user || tokens < 2 || !topicInput.trim()) return

    setGeneratingQuestions(true)
    setGenerationError(null)

    try {
      // Use the dedicated function for generating practice questions
      const pyqParams = {
        subject: selectedSubjectInput,
        topic: topicInput,
        difficulty: selectedDifficulty,
        count: numberOfQuestions,
        format: selectedFormat,
        withSolutions: true,
        examStyle: "indian education system", // Ensuring questions match the Indian education pattern
      }

      const aiResponse = await generatePracticeQuestions(pyqParams)

      // Parse the generated questions
      const newPyqs = parseGeneratedQuestions(aiResponse)
      console.log(aiResponse)

      if (newPyqs.length === 0) {
        setGenerationError("Failed to parse generated questions. Please try again.")
        return
      }

      // Update state with new questions
      setPyqs([...newPyqs, ...pyqs])

      // Expand the newly generated questions by default
      const newExpandedState = { ...expandedQuestions }
      newPyqs.forEach((pyq) => {
        newExpandedState[pyq.id] = true
      })
      setExpandedQuestions(newExpandedState)

      // Deduct tokens
      try {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          tokens: increment(-2), // Cost 2 tokens to generate questions
        })
        setTokens(tokens - 2)
      } catch (error) {
        console.error("Error updating tokens:", error)
      }

      // Reset input
      setTopicInput("")
    } catch (error) {
      console.error("Error generating questions:", error)
      setGenerationError("Failed to generate questions. Please try again.")
    } finally {
      setGeneratingQuestions(false)
    }
  }

  const handleAnswerChange = (pyqId: string, value: string) => {
    setUserAnswers({
      ...userAnswers,
      [pyqId]: value,
    })
  }

  const toggleExpanded = (pyqId: string) => {
    setExpandedQuestions({
      ...expandedQuestions,
      [pyqId]: !expandedQuestions[pyqId],
    })
  }

  const handleSubmitAnswer = async (pyq: PYQ) => {
    if (!user || tokens < 1) return

    const userAnswer = userAnswers[pyq.id]
    if (!userAnswer) return

    setEvaluatingAnswer(pyq.id)

    try {
      // Generate a solution if we don't have one yet
      let answerToCheck = pyq.answer

      if (!answerToCheck) {
        const tutorParams = {
          subject: pyq.subject,
          topic: pyq.topic,
          personality: "friendly" as "friendly" | "strict" | "neutral",
          level: "expert" as "beginner" | "intermediate" | "expert",
          teachingStyle: "example-based" as "conceptual" | "example-based" | "problem-solving",
        }

        answerToCheck = await getGeminiResponse(
          `Please provide a detailed solution for this ${pyq.subject} question about ${pyq.topic}: ${pyq.question}`,
          tutorParams,
        )

        // Update the pyq with the answer
        setPyqs(pyqs.map((q) => (q.id === pyq.id ? { ...q, answer: answerToCheck } : q)))
      }

      // Construct improved prompt for AI to evaluate answer with clear JSON instructions
      const prompt = `
      As an expert ${pyq.subject} educator specializing in ${pyq.topic}, evaluate this student answer:
      
      QUESTION:
      ${pyq.question}
      
      CORRECT SOLUTION:
      ${answerToCheck}
      
      STUDENT ANSWER:
      ${userAnswer}
      
      Evaluate the student's response compared to the correct solution. Be specific about what concepts they understood correctly and what they missed or got wrong.
      
      YOUR RESPONSE MUST BE VALID JSON in this exact format:
      {
        "isCorrect": boolean (true only if mostly correct with minor issues at most),
        "feedback": "Your detailed, constructive feedback explaining what was right, what was wrong, and suggestions for improvement"
      }
      
      YOUR RESPONSE MUST BE VALID JSON AND NOTHING ELSE.
      `

      const aiResponse = await getGeminiResponse(prompt, {
        subject: pyq.subject,
        topic: pyq.topic,
        personality: "friendly",
        level: "expert",
        teachingStyle: "conceptual",
      })

      // Parse the response with improved error handling
      let evaluation
      try {
        // First try to parse the entire response as JSON
        evaluation = JSON.parse(aiResponse.trim())
      } catch (firstError) {
        try {
          // Extract JSON using regex pattern if initial parse fails
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            evaluation = JSON.parse(jsonMatch[0])
          } else {
            // If no JSON found, create a default response
            evaluation = {
              isCorrect:
                aiResponse.toLowerCase().includes("correct") &&
                !aiResponse.toLowerCase().includes("not correct") &&
                !aiResponse.toLowerCase().includes("incorrect"),
              feedback: aiResponse,
            }
          }
        } catch (secondError) {
          console.error("Error parsing AI evaluation response:", secondError)
          evaluation = {
            isCorrect: false,
            feedback:
              "There was an error evaluating your answer. The system could not parse the AI's response. Please try again or compare your answer with the solution manually.",
          }
        }
      }

      // Check if the evaluation has the required fields
      if (!("isCorrect" in evaluation) || !("feedback" in evaluation)) {
        evaluation = {
          isCorrect: false,
          feedback: "The evaluation system encountered an error. Please try again or check the solution manually.",
        }
      }

      // Format the feedback with markdown if it's plain text
      if (evaluation.feedback && !evaluation.feedback.includes("#") && !evaluation.feedback.includes("*")) {
        evaluation.feedback = evaluation.feedback
          .split("\n\n")
          .map((para: string) => para.trim())
          .filter((para: any) => para)
          .join("\n\n")
      }

      // Update state with evaluation results
      setPyqs(
        pyqs.map((q) =>
          q.id === pyq.id
            ? {
                ...q,
                userAnswer: userAnswer,
                userAnswerFeedback: evaluation.feedback,
                isCorrect: evaluation.isCorrect,
              }
            : q,
        ),
      )

      // Deduct a token
      try {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          tokens: increment(-1),
        })
        setTokens(tokens - 1)
      } catch (error) {
        console.error("Error updating tokens:", error)
      }
    } catch (error) {
      console.error("Error evaluating answer:", error)
      alert("Failed to evaluate your answer. Please try again.")
    } finally {
      setEvaluatingAnswer(null)
    }
  }

  const subjects = ["all", ...Array.from(new Set(pyqs.map((pyq) => pyq.subject)))]

  const DifficultyBadge = ({ difficulty }: { difficulty: "easy" | "medium" | "hard" }) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-lavender-100 text-lavender-800",
      hard: "bg-red-100 text-red-800",
    }

    return (
      <span className={`text-xs font-medium px-2 py-1 rounded ${colors[difficulty]}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    )
  }

  const handleSelectPdf = (pdf: PyqPdf) => {
    if (selectedPdf?.id === pdf.id) return // Avoid reloading if same PDF is clicked
    setSelectedPdf(pdf)
    setChatMessages([])
    setChatError(null)
    setUserInput('') // Clear input when changing PDF
  }

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      console.error("User not authenticated. Cannot send message.");
      setChatError("You must be logged in to chat.");
      return;
    }
    if (tokens < 1) {
      setChatError("You don\'t have enough tokens to send a message. Please acquire more tokens.");
      return;
    }
    if (!userInput.trim() || !selectedPdf) return;

    const userMessageText = userInput;
    const userMessage: Message = { id: Date.now().toString(), text: userMessageText, sender: 'user' };
    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsChatLoading(true);
    setChatError(null); // Clear previous errors before sending

    try {
      const response = await fetch('/api/chat-with-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMessageText, 
          pdfId: selectedPdf.id, 
          pdfTitle: selectedPdf.title 
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to get response from the AI. Please try again.');
      }

      const aiResponse = await response.json();
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        text: aiResponse.answer || "No answer received.", 
        sender: 'ai',
        sources: aiResponse.sources 
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // Deduct a token after successful AI response
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          tokens: increment(-1),
        });
        setTokens(prevTokens => prevTokens - 1);
        console.log("Token deducted for chat message. New token count:", tokens - 1); // For debugging
      } catch (tokenError) {
        console.error("Error updating tokens after chat message:", tokenError);
        // Optionally, notify the user or log this more formally
        // For now, the chat itself succeeded, so we might not show a chat error for this
      }

    } catch (err: any) {
      console.error("Chat API error:", err);
      setChatError(err.message || "Could not get a response from the AI. Please check the console for more details.");
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        text: `Error: ${err.message || "Could not get a response."}`,
        sender: 'ai' 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  }

  if (loadingPdfs) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-lavender-600" />
        <p className="mt-4 text-lg text-gray-600">Loading PYQs...</p>
          </div>
    )
  }
  
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-gray-100 font-sans">
      {/* PDF List Sidebar */} 
      <div className="md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-lavender-800 flex items-center mb-2">
            <BookOpen className="w-6 h-6 mr-2 text-lavender-600" /> PYQ Chat Index
          </h2>
          {user && (
            <div className="flex items-center text-sm text-gray-600">
              <Coins className="w-4 h-4 mr-1.5 text-yellow-500" />
              <span>Tokens available: {tokens}</span>
            </div>
          )}
        </div>
        <div className="overflow-y-auto flex-grow p-3 space-y-2">
          {processedPdfs.length === 0 && pageError && (
             <div className="p-4 text-center text-gray-500">
               <AlertCircle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
               {pageError}
             </div>
          )}
          {processedPdfs.map(pdf => (
            <div
              key={pdf.id}
              onClick={() => {
                handleSelectPdf(pdf)
                setShowPdfViewer(true) // Show PDF viewer when a PDF is selected
              }}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out 
                          hover:bg-lavender-100 hover:shadow-md 
                          ${selectedPdf?.id === pdf.id 
                            ? 'bg-lavender-600 text-white shadow-lg ring-2 ring-lavender-400' 
                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-lavender-300'}`}
            >
              <div className="flex items-center">
                <FileText className={`h-5 w-5 mr-2.5 ${selectedPdf?.id === pdf.id ? 'text-white' : 'text-lavender-500'}`} />
                <span className={`font-medium truncate ${selectedPdf?.id === pdf.id ? 'text-white' : 'text-gray-800'}`}>{pdf.title}</span>
              </div>
              <p className={`text-xs mt-1 ml-1 truncate ${selectedPdf?.id === pdf.id ? 'text-lavender-100' : 'text-gray-500'}`}>
                {pdf.subject} - {pdf.year}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area: PDF Viewer and Chat */}
      {!selectedPdf ? (
        <div className="flex-grow flex flex-col justify-center items-center text-center p-10 bg-gray-50">
          <FileText size={56} className="text-gray-300 mb-6" />
          <h3 className="text-2xl font-medium text-gray-700 mb-2">Select a PYQ to Start Chatting</h3>
          <p className="text-gray-500 max-w-md">
            Choose a processed Previous Year Question paper from the list on the left to view it and begin your interactive Q&A session.
          </p>
        </div>
      ) : (
        <div className="flex-grow flex flex-row"> {/* This will contain PDF viewer and Chat side-by-side */}
          {/* PDF Viewer Area */}
          {showPdfViewer && selectedPdf && (
            <div className="flex-1 h-full border-r border-gray-200 flex flex-col">
              {/* You can use PdfViewer or PdfViewerTab here. For simplicity, using PdfViewer. */}
              {/* Adjust props for PdfViewer as needed based on its definition */}
              <PdfViewer pdfUrl={selectedPdf.fileUrl} />
            </div>
          )}

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col bg-white shadow-inner`}>
            <div className="p-4 border-b bg-lavender-50 shadow-sm sticky top-0 z-10">
              <h3 className="text-lg font-semibold text-lavender-800 truncate">Chatting with: {selectedPdf.title}</h3>
              <p className="text-xs text-lavender-600">Subject: {selectedPdf.subject} | Year: {selectedPdf.year}</p>
            </div>

            <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-gray-100" ref={messagesEndRef}>
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col items-start ${msg.sender === 'user' ? 'items-end' : ''}`}>
                  <div
                    className={`max-w-xl md:max-w-2xl px-4 py-2.5 rounded-xl shadow-md break-words 
                                ${msg.sender === 'user' 
                                  ? 'bg-lavender-600 text-white self-end rounded-br-none' 
                                  : 'bg-white text-gray-800 self-start rounded-bl-none border border-gray-200'}`}
                  >
                    {msg.text.split('\n').map((line, index, arr) => (
                        <span key={index}>{line}{index === arr.length - 1 ? '' : <br />}</span>
                    ))}
          </div>
                  {msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <details className="mt-2 max-w-xl md:max-w-2xl text-xs self-start">
                      <summary className="text-lavender-600 cursor-pointer hover:underline">View sources ({msg.sources.length})</summary>
                      <div className="mt-1 p-2 space-y-1 bg-lavender-50 border border-lavender-200 rounded-md">
                        {msg.sources.map((source, idx) => (
                          <div key={idx} className="p-1.5 bg-white border rounded text-gray-600 text-xs">
                            <p className="italic truncate"><em>Source {idx + 1}:</em> {source.pageContent}</p>
        </div>
                        ))}
      </div>
                    </details>
                  )}
                  </div>
              ))}
               {isChatLoading && (
                <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-xl shadow-md bg-white text-gray-700 border border-gray-200 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-lavender-500 mr-2" /> Thinking...
                </div>
                </div>
                )}
              </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 shadow-md sticky bottom-0 z-10">
              {chatError && (
                <p className="text-red-500 text-sm mb-2 text-center">
                  <AlertCircle className="inline h-4 w-4 mr-1" /> {chatError}
                </p>
              )}
              <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-lavender-500">
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder={`Ask anything about ${selectedPdf.title}...`}
                  className="flex-grow p-3 border-none focus:ring-0 rounded-l-lg text-sm"
                  disabled={isChatLoading}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault(); 
                      handleSendMessage(); 
                    }
                  }}
                />
                      <button
                  type="submit"
                  disabled={isChatLoading || !userInput.trim()}
                  className="px-5 py-3 bg-lavender-600 text-white rounded-r-lg hover:bg-lavender-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 flex items-center"
                >
                  {isChatLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5"/>}
                      </button>
                    </div>
               <p className="text-xs text-gray-500 mt-1.5 ml-1">
                 AI can make mistakes. Verify important information. Model: gpt-3.5-turbo.
               </p>
            </form>
                              </div>
        </div>
      )}
    </div>
  )
}
