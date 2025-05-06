/* eslint-disable */
"use client"
import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { getGeminiResponse, generatePracticeQuestions, generateMockTest } from "@/lib/gemini"
import { useRouter } from "next/navigation"
import {
  Loader2,
  BookOpen,
  Download,
  Share2,
  Bookmark,
  Search,
  Send,
  Check,
  X,
  PlusCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  FileText,
} from "lucide-react"
import ReactMarkdown from "react-markdown"

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

export default function PYQPage() {
  const [user] = useAuthState(auth)
  const [pyqs, setPyqs] = useState<PYQ[]>([])
  const [filteredPyqs, setFilteredPyqs] = useState<PYQ[]>([])
  const [tokens, setTokens] = useState(0)
  const [loading, setLoading] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"year" | "difficulty" | "createdAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // State variables for topic-based question generation
  const [topicInput, setTopicInput] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [numberOfQuestions, setNumberOfQuestions] = useState(3)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({})
  const [evaluatingAnswer, setEvaluatingAnswer] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<"multiple-choice" | "short-answer" | "long-form" | "mixed">(
    "mixed",
  )
  const [selectedSubjectInput, setSelectedSubjectInput] = useState("Mathematics")
  const [expandedQuestions, setExpandedQuestions] = useState<{ [key: string]: boolean }>({})
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Mock test state variables
  const [showMockTestForm, setShowMockTestForm] = useState(false)
  const [mockTestSubject, setMockTestSubject] = useState("Physics")
  const [mockTestDuration, setMockTestDuration] = useState(120)
  const [mockTestTotalMarks, setMockTestTotalMarks] = useState(80)
  const [mockTestSections, setMockTestSections] = useState([
    { name: "Section A", questionType: "multiple-choice", count: 15, marksPerQuestion: 1, isCompulsory: true },
    { name: "Section B", questionType: "short-answer", count: 10, marksPerQuestion: 2, isCompulsory: false },
  ])
  const [generatingMockTest, setGeneratingMockTest] = useState(false)
  const [mockTestError, setMockTestError] = useState<string | null>(null)
  const router = useRouter()

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

      fetchTokens()
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

        // Check if we have a solution for this question number in our solution map
        const solutionFromMap = solutionMap.get(questionNumber)

        // Also check for solution in the question block itself
        const answerMarkers = [
          "solution:",
          "answer:",
          "explanation:",
          "### solution",
          "### answer",
          "### explanation",
          "## solution",
          "## answer",
          "## explanation",
          "#### solution",
          "#### answer",
          "#### explanation",
          "**solution**",
          "**answer**",
          "**explanation**",
        ]

        // Find the earliest occurrence of any answer marker
        let solutionIndex = -1
        let markerFound = ""

        for (const marker of answerMarkers) {
          const idx = block.toLowerCase().indexOf(marker)
          if (idx !== -1 && (solutionIndex === -1 || idx < solutionIndex)) {
            solutionIndex = idx
            markerFound = marker
          }
        }

        // Get the answer either from the solution map or from within the question block
        let answer = ""

        // If we found a solution section within the question block
        if (solutionIndex !== -1) {
          answer = block.substring(solutionIndex).trim()
          block = block.substring(0, solutionIndex).trim()
        }
        // If we found a solution in the separate solutions section
        else if (solutionFromMap) {
          answer = solutionFromMap
        }

        // Clean up the question - remove question numbers and headers
        let question = block
          .replace(/^#{1,4}\s*(?:Question|Q)[\s:]?\d+/i, "")
          .replace(/^(?:Question|Q)[\s:]?\d+/i, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/^\*\*(?:Question|Q)[\s:]?\d+\*\*/i, "")
          .replace(
            /^\*\*(?:Multiple Choice Question|Short Answer Question|Numerical\/Analytical Question|Long Answer Question)\*\*/i,
            "",
          )
          .trim()

        // Extract question type and difficulty information if available
        let questionDifficulty = selectedDifficulty
        if (question.toLowerCase().includes("easy")) {
          questionDifficulty = "easy"
        } else if (question.toLowerCase().includes("hard")) {
          questionDifficulty = "hard"
        }

        // Remove any remaining header formatting
        question = question.replace(/^\*\*.*?\*\*\s*/gm, "")

        // Only add if we have a question
        if (question) {
          const newPyq: PYQ = {
            id: `gen-${Date.now()}-${index}`,
            question: question,
            subject: selectedSubjectInput,
            topic: topicInput,
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

  const handleGenerateMockTest = async () => {
    if (!user || tokens < 5) {
      setMockTestError("You need at least 5 tokens to generate a mock test")
      return
    }

    setGeneratingMockTest(true)
    setMockTestError(null)

    try {
      // Create a unique ID for this mock test
      const mockTestId = `mocktest-${Date.now()}`

      // Prepare the sections data
      const sectionsData = mockTestSections.map((section) => ({
        name: section.name,
        questionType: section.questionType,
        count: section.count,
        marksPerQuestion: section.marksPerQuestion,
        isCompulsory: section.isCompulsory,
      }))

      // Generate the mock test
      const mockTest = await generateMockTest({
        id: mockTestId,
        subject: mockTestSubject,
        duration: mockTestDuration,
        totalMarks: mockTestTotalMarks,
        sections: sectionsData,
      })

      // Store the mock test in localStorage instead of database
      localStorage.setItem(`mocktest-${mockTestId}`, JSON.stringify(mockTest))

      // Deduct tokens
      if (user) {
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          tokens: increment(-5),
        })
        setTokens(tokens - 5)
      }

      // Navigate to the mock test page
      router.push(`/mocktest/${mockTestId}`)
    } catch (error) {
      console.error("Error generating mock test:", error)
      setMockTestError("Failed to generate mock test. Please try again.")
    } finally {
      setGeneratingMockTest(false)
    }
  }

  const handleAddSection = () => {
    setMockTestSections([
      ...mockTestSections,
      {
        name: `Section ${String.fromCharCode(65 + mockTestSections.length)}`,
        questionType: "short-answer",
        count: 5,
        marksPerQuestion: 2,
        isCompulsory: false,
      },
    ])
  }

  const handleRemoveSection = (index: number) => {
    if (mockTestSections.length > 1) {
      const newSections = [...mockTestSections]
      newSections.splice(index, 1)
      setMockTestSections(newSections)
    }
  }

  const handleSectionChange = (index: number, field: string, value: any) => {
    const newSections = [...mockTestSections]
    newSections[index] = {
      ...newSections[index],
      [field]: value,
    }
    setMockTestSections(newSections)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-4xl font-bold mb-8 text-center ${lavenderColors.neonGlow}`}>Practice Questions</h1>

      <div className={`mb-8 ${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg`}>
        <h2 className="text-2xl font-semibold mb-4">Generate New Questions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter a topic (e.g., Vectors, Databases, Quantum Physics)"
              className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={selectedSubjectInput}
              onChange={(e) => setSelectedSubjectInput(e.target.value)}
              placeholder="Subject"
              className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as "easy" | "medium" | "hard")}
              className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Format</label>
            <select
              value={selectedFormat}
              onChange={(e) =>
                setSelectedFormat(e.target.value as "multiple-choice" | "short-answer" | "long-form" | "mixed")
              }
              className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="short-answer">Short Answer</option>
              <option value="long-form">Long Form</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Number of Questions</label>
            <select
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(Number.parseInt(e.target.value))}
              className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
            >
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
          </div>
        </div>

        {generationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="inline-block mr-2" size={16} />
            {generationError}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <BookOpen className="inline mr-1" size={16} />
            <span>
              Available Tokens: <span className="font-semibold text-lavender-600">{tokens}</span>
            </span>
            <span className="ml-2 text-gray-500">(Generating costs 2 tokens)</span>
          </div>

          <button
            onClick={handleGenerateQuestions}
            disabled={generatingQuestions || tokens < 2 || !topicInput.trim()}
            className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50 flex items-center"
          >
            {generatingQuestions ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />
                Generating...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2" size={16} />
                Generate Questions
              </>
            )}
          </button>
        </div>
      </div>

      <div className={`mb-8 ${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Generate Mock Test</h2>
          <button
            onClick={() => setShowMockTestForm(!showMockTestForm)}
            className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300"
          >
            {showMockTestForm ? "Hide Form" : "Show Form"}
          </button>
        </div>

        {showMockTestForm && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={mockTestSubject}
                  onChange={(e) => setMockTestSubject(e.target.value)}
                  placeholder="Enter subject name"
                  className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={mockTestDuration}
                  onChange={(e) => setMockTestDuration(Number.parseInt(e.target.value))}
                  min={30}
                  max={240}
                  className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total Marks</label>
                <input
                  type="number"
                  value={mockTestTotalMarks}
                  onChange={(e) => setMockTestTotalMarks(Number.parseInt(e.target.value))}
                  min={20}
                  max={200}
                  className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Test Sections</h3>
                <button
                  onClick={handleAddSection}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg transition duration-300"
                >
                  Add Section
                </button>
              </div>

              {mockTestSections.map((section, index) => (
                <div key={index} className="p-4 border border-lavender-200 rounded-lg mb-3 bg-lavender-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">{section.name}</h4>
                    {mockTestSections.length > 1 && (
                      <button onClick={() => handleRemoveSection(index)} className="text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Section Name</label>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => handleSectionChange(index, "name", e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Question Type</label>
                      <select
                        value={section.questionType}
                        onChange={(e) => handleSectionChange(index, "questionType", e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="long-form">Long Form</option>
                        <option value="numerical">Numerical</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Number of Questions</label>
                      <input
                        type="number"
                        value={section.count}
                        onChange={(e) => handleSectionChange(index, "count", Number.parseInt(e.target.value))}
                        min={1}
                        max={30}
                        className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Marks per Question</label>
                      <input
                        type="number"
                        value={section.marksPerQuestion}
                        onChange={(e) =>
                          handleSectionChange(index, "marksPerQuestion", Number.parseInt(e.target.value))
                        }
                        min={1}
                        max={10}
                        className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={section.isCompulsory}
                          onChange={(e) => handleSectionChange(index, "isCompulsory", e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Compulsory section (all questions must be attempted)</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {mockTestError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="inline-block mr-2" size={16} />
                {mockTestError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <BookOpen className="inline mr-1" size={16} />
                <span>
                  Available Tokens: <span className="font-semibold text-lavender-600">{tokens}</span>
                </span>
                <span className="ml-2 text-gray-500">(Generating a mock test costs 5 tokens)</span>
              </div>

              <button
                onClick={handleGenerateMockTest}
                disabled={generatingMockTest || tokens < 5}
                className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50 flex items-center"
              >
                {generatingMockTest ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Generating Mock Test...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2" size={16} />
                    Generate Mock Test
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Your Questions</h2>

        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search questions or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none"
          >
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject === "all" ? "All Subjects" : subject}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 mt-2 sm:mt-0">
            <button
              onClick={() => setSortBy("createdAt")}
              className={`px-3 py-1 rounded-lg ${sortBy === "createdAt" ? "bg-lavender-600 text-white" : "bg-gray-200"}`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy("difficulty")}
              className={`px-3 py-1 rounded-lg ${sortBy === "difficulty" ? "bg-lavender-600 text-white" : "bg-gray-200"}`}
            >
              Difficulty
            </button>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1 bg-gray-200 rounded-lg ml-1"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" size={48} />
        </div>
      ) : filteredPyqs.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto mb-4" size={48} />
          <p className="text-lg text-gray-500">No questions found.</p>
          <p className="text-gray-500">Generate some questions using the form above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredPyqs.map((pyq) => (
            <div key={pyq.id} className={` ${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <span>
                      {pyq.subject} - {pyq.topic}
                    </span>
                    <button
                      className="ml-2 p-1 rounded-lg hover:bg-gray-100"
                      onClick={() => toggleExpanded(pyq.id)}
                      aria-label={expandedQuestions[pyq.id] ? "Collapse" : "Expand"}
                    >
                      {expandedQuestions[pyq.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {pyq.year && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        {pyq.year}
                      </span>
                    )}
                    {pyq.isAIGenerated && (
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                        AI Generated
                      </span>
                    )}
                    <DifficultyBadge difficulty={pyq.difficulty} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-1 rounded-lg hover:bg-gray-100" title="Bookmark question">
                    <Bookmark size={16} />
                  </button>
                  <button className="p-1 rounded-lg hover:bg-gray-100" title="Share question">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>

              {expandedQuestions[pyq.id] && (
                <>
                  <div className="mb-4 py-3 px-4 bg-lavender-50 rounded-lg">
                    <ReactMarkdown className="prose max-w-none">{pyq.question}</ReactMarkdown>
                  </div>

                  {/* User Answer Section - Only show if not already answered */}
                  {!pyq.userAnswer && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-md mb-2">Your Answer</h3>
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={userAnswers[pyq.id] || ""}
                          onChange={(e) => handleAnswerChange(pyq.id, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-3 border rounded-lg focus:ring-lavender-500 focus:outline-none min-h-24"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmitAnswer(pyq)}
                        disabled={!userAnswers[pyq.id] || evaluatingAnswer === pyq.id || tokens < 1}
                        className="mt-2 bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50 flex items-center"
                      >
                        {evaluatingAnswer === pyq.id ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2" size={16} />
                            Check Answer
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Feedback on user answer */}
                  {pyq.userAnswer && pyq.userAnswerFeedback && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-md mb-2 flex items-center">
                        Your Answer
                        {pyq.isCorrect !== undefined && (
                          <span
                            className={`ml-2 ${pyq.isCorrect ? "text-green-500" : "text-red-500"} flex items-center`}
                          >
                            {pyq.isCorrect ? (
                              <>
                                <Check size={16} className="mr-1" /> Correct
                              </>
                            ) : (
                              <>
                                <X size={16} className="mr-1" /> Needs Improvement
                              </>
                            )}
                          </span>
                        )}
                      </h3>
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <p className="whitespace-pre-line">{pyq.userAnswer}</p>
                      </div>

                      <h3 className="font-semibold text-md mt-3 mb-2">Feedback</h3>
                      <div
                        className={`p-3 rounded-lg ${pyq.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}
                      >
                        <ReactMarkdown className="prose max-w-none">{pyq.userAnswerFeedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* AI Answer/Solution */}
                  {pyq.answer ? (
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <span className="mr-2">Complete Solution</span>
                        <button className="p-1 rounded-lg hover:bg-gray-100" title="Download solution">
                          <Download size={16} />
                        </button>
                      </h3>
                      <div className="bg-lavender-50 p-4 rounded-lg">
                        <ReactMarkdown className="prose max-w-none">{pyq.answer}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGetAnswer(pyq)}
                      disabled={loading || tokens < 1 || processingId === pyq.id}
                      className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50 flex items-center mt-4"
                    >
                      {processingId === pyq.id ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={16} />
                          Getting Solution...
                        </>
                      ) : (
                        <>
                          <BookOpen className="mr-2" size={16} />
                          Get Solution
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
