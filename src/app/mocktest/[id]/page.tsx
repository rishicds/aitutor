"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebaseConfig"
import ReactMarkdown from "react-markdown"
import { Loader2, Clock, Download, Printer, ChevronLeft, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

// Custom lavender color scheme
const lavenderColors = {
  glassmorphism: "bg-white/80 backdrop-blur-md border border-lavender-200",
  neonGlow: "text-lavender-700 drop-shadow-[0_0_10px_rgba(150,120,230,0.7)]",
}

interface MockTest {
  id: string
  subject: string
  duration: number
  totalMarks: number
  content: string
  createdAt: string
  userAnswers?: Record<string, string>
}

interface Section {
  name: string
  content: string
  questions: Question[]
}

interface Question {
  id: string
  number: string
  text: string
  options?: string[]
  marks: number
}

export default function MockTestPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [mockTest, setMockTest] = useState<MockTest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [testStarted, setTestStarted] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [showSolutions, setShowSolutions] = useState(false)
  const [parsedSections, setParsedSections] = useState<Section[]>([])
  const [activeSection, setActiveSection] = useState(0)
  const [accessibilityMode, setAccessibilityMode] = useState(false)

  // Fetch mock test data from localStorage instead of database
  useEffect(() => {
    const fetchMockTest = async () => {
      try {
        setLoading(true)

        // Get mock test from localStorage
        const storedTest = localStorage.getItem(`mocktest-${id}`)

        if (storedTest) {
          const data = JSON.parse(storedTest) as MockTest
          setMockTest(data)

          // Parse the test content into sections
          parseTestContent(data.content)

          // Check if test was already completed
          const isCompleted = localStorage.getItem(`mocktest-completed-${id}`) === "true"
          if (isCompleted) {
            setTestCompleted(true)
          }

          // If user has already started this test, load their answers
          const storedAnswers = localStorage.getItem(`mocktest-answers-${id}`)
          if (storedAnswers) {
            setUserAnswers(JSON.parse(storedAnswers))
            setTestStarted(true)
          }

          // Check if there's a saved timer
          const savedTime = localStorage.getItem(`mocktest-time-${id}`)
          if (savedTime && !isCompleted) {
            setTimeRemaining(Number.parseInt(savedTime))
            setTestStarted(true)
          }
        } else {
          setError("Mock test not found. It may have expired or been deleted.")
        }
      } catch (err) {
        console.error("Error fetching mock test:", err)
        setError("Failed to load mock test")
      } finally {
        setLoading(false)
      }
    }

    fetchMockTest()
  }, [id])

  // Parse the test content into sections
  const parseTestContent = (content: string) => {
    // Split content into test and solutions
    let testContent = content
    let solutionsContent = ""

    // Check if there's a solutions section
    if (content.includes("SOLUTIONS") || content.includes("ANSWER KEY") || content.includes("MARKING SCHEME")) {
      const contentParts = content.split(/(?=SOLUTIONS|ANSWER KEY|MARKING SCHEME)/i)
      if (contentParts.length > 1) {
        testContent = contentParts[0]
        solutionsContent = contentParts.slice(1).join("")
      }
    }

    // Extract header
    const headerMatch = testContent.match(/^([\s\S]*?)(?=SECTION A|Section A)/i)
    const header = headerMatch ? headerMatch[0] : ""

    // Extract sections
    const sectionRegex = /SECTION\s+([A-Z])\s*(?:$$.*?$$)?\s*([\s\S]*?)(?=SECTION\s+[A-Z]|$)/gi
    const sections: Section[] = []

    let match
    while ((match = sectionRegex.exec(testContent)) !== null) {
      const sectionName = `SECTION ${match[1]}`
      const sectionContent = match[2].trim()

      // Parse questions in this section
      const questions = parseQuestions(sectionContent, match[1])

      sections.push({
        name: sectionName,
        content: sectionContent,
        questions: questions,
      })
    }

    // If no sections were found, create a default one
    if (sections.length === 0 && testContent.trim()) {
      sections.push({
        name: "SECTION A",
        content: testContent.replace(header, "").trim(),
        questions: parseQuestions(testContent.replace(header, "").trim(), "A"),
      })
    }

    // Add header as metadata to the first section if it exists
    if (sections.length > 0 && header) {
      sections[0].content = header + "\n\n" + sections[0].content
    }

    setParsedSections(sections)
  }

  // Parse questions from section content
  const parseQuestions = (sectionContent: string, sectionLetter: string): Question[] => {
    const questions: Question[] = []

    // Try to match numbered questions
    const questionRegex = /(?:^|\n)(\d+)\.\s*([\s\S]*?)(?=(?:^|\n)\d+\.|$)/g

    let match
    let questionCounter = 1

    while ((match = questionRegex.exec(sectionContent)) !== null) {
      const questionNumber = match[1]
      const questionText = match[2].trim()

      // Try to extract options for multiple choice questions
      const options: string[] = []
      const optionMatches = questionText.match(/(?:^|\n)\s*$$([a-d])$$\s*(.*?)(?=(?:^|\n)\s*$$[a-d]$$|$)/gi)

      if (optionMatches) {
        optionMatches.forEach((option) => {
          options.push(option.trim())
        })
      }

      // Estimate marks based on question complexity
      let marks = 1
      if (questionText.length > 500) marks = 5
      else if (questionText.length > 200) marks = 3
      else if (questionText.length > 100) marks = 2

      questions.push({
        id: `${sectionLetter}-${questionNumber}`,
        number: questionNumber,
        text: questionText,
        options: options.length > 0 ? options : undefined,
        marks: marks,
      })

      questionCounter++
    }

    // If no questions were found with the regex, try a simpler approach
    if (questions.length === 0) {
      // Split by lines and look for lines starting with numbers
      const lines = sectionContent.split("\n")
      let currentQuestion = ""
      let currentNumber = ""

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const numberMatch = line.match(/^(\d+)\./)

        if (numberMatch) {
          // Save previous question if exists
          if (currentQuestion && currentNumber) {
            questions.push({
              id: `${sectionLetter}-${currentNumber}`,
              number: currentNumber,
              text: currentQuestion.trim(),
              marks: 1,
            })
          }

          // Start new question
          currentNumber = numberMatch[1]
          currentQuestion = line.replace(/^\d+\./, "").trim()
        } else if (currentQuestion) {
          // Continue current question
          currentQuestion += "\n" + line
        }
      }

      // Add the last question
      if (currentQuestion && currentNumber) {
        questions.push({
          id: `${sectionLetter}-${currentNumber}`,
          number: currentNumber,
          text: currentQuestion.trim(),
          marks: 1,
        })
      }
    }

    return questions
  }

  // Save user answers to localStorage when they change
  useEffect(() => {
    if (Object.keys(userAnswers).length > 0) {
      localStorage.setItem(`mocktest-answers-${id}`, JSON.stringify(userAnswers))
    }
  }, [userAnswers, id])

  // Timer functionality
  useEffect(() => {
    if (!testStarted || !mockTest || testCompleted) return

    // Set initial time
    if (timeRemaining === null) {
      // Try to get saved time from localStorage
      const savedTime = localStorage.getItem(`mocktest-time-${id}`)
      if (savedTime) {
        setTimeRemaining(Number.parseInt(savedTime))
      } else {
        setTimeRemaining(mockTest.duration * 60) // Convert minutes to seconds
      }
    }

    // Start countdown
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer)
          setTestCompleted(true)
          localStorage.setItem(`mocktest-completed-${id}`, "true")
          return 0
        }

        // Save remaining time to localStorage
        const newTime = prev - 1
        localStorage.setItem(`mocktest-time-${id}`, newTime.toString())
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [testStarted, mockTest, timeRemaining, testCompleted, id])

  // Format time remaining
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle starting the test
  const handleStartTest = () => {
    setTestStarted(true)
    setTimeRemaining(mockTest?.duration ? mockTest.duration * 60 : 7200) // Default to 2 hours if duration not specified
    localStorage.setItem(`mocktest-time-${id}`, (mockTest?.duration ? mockTest.duration * 60 : 7200).toString())
  }

  // Handle submitting the test
  const handleSubmitTest = () => {
    setTestCompleted(true)
    localStorage.setItem(`mocktest-completed-${id}`, "true")
    // Clear the timer
    localStorage.removeItem(`mocktest-time-${id}`)
  }

  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: string) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: value,
    })
  }

  // Handle printing the test
  const handlePrint = () => {
    window.print()
  }

  // Handle downloading as PDF
  const handleDownload = () => {
    // In a real implementation, you would use a library like jsPDF
    // For now, we'll just use the print dialog which can save as PDF
    window.print()
  }

  // Toggle accessibility mode
  const toggleAccessibilityMode = () => {
    setAccessibilityMode(!accessibilityMode)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin mr-2 text-lavender-600" size={24} />
        <span>Loading mock test...</span>
      </div>
    )
  }

  if (error || !mockTest) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="mb-6">{error || "Failed to load mock test"}</p>
        <Link href="/pyqpage" className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700">
          <ChevronLeft className="inline mr-2" size={16} />
          Back to Practice Questions
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Test Header */}
      <div className="mb-8 print:mb-4">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Link href="/pyqpage" className="flex items-center text-lavender-600 hover:underline">
            <ChevronLeft size={16} className="mr-1" />
            Back to Practice Questions
          </Link>

          <div className="flex items-center gap-3">
            {!testStarted ? (
              <button
                onClick={handleStartTest}
                className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300"
              >
                Start Test
              </button>
            ) : !testCompleted ? (
              <button
                onClick={handleSubmitTest}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300"
              >
                Submit Test
              </button>
            ) : (
              <button
                onClick={() => setShowSolutions(!showSolutions)}
                className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 flex items-center"
              >
                {showSolutions ? (
                  <>
                    <EyeOff className="mr-2" size={16} />
                    Hide Solutions
                  </>
                ) : (
                  <>
                    <Eye className="mr-2" size={16} />
                    Show Solutions
                  </>
                )}
              </button>
            )}

            <button
              onClick={toggleAccessibilityMode}
              className={`px-4 py-2 rounded-lg transition duration-300 flex items-center ${
                accessibilityMode ? "bg-lavender-600 text-white" : "bg-gray-200 text-gray-800"
              }`}
              aria-pressed={accessibilityMode}
            >
              Accessibility Mode
            </button>

            <button
              onClick={handlePrint}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-300 flex items-center"
            >
              <Printer className="mr-2" size={16} />
              Print
            </button>

            <button
              onClick={handleDownload}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition duration-300 flex items-center"
            >
              <Download className="mr-2" size={16} />
              Download PDF
            </button>
          </div>
        </div>

        {testStarted && !testCompleted && (
          <div className="fixed top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-50 print:hidden">
            <div className="flex items-center">
              <Clock className="mr-2 text-red-500" size={20} />
              <span className="font-mono text-lg font-bold">
                {timeRemaining !== null ? formatTime(timeRemaining) : "00:00:00"}
              </span>
            </div>
          </div>
        )}

        {testCompleted && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 print:hidden">
            <CheckCircle className="inline-block mr-2" size={16} />
            Test completed!{" "}
            {showSolutions ? "Solutions are shown below." : "Click 'Show Solutions' to see the answers."}
          </div>
        )}

        {/* Section Navigation */}
        {parsedSections.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4 print:hidden">
            {parsedSections.map((section, index) => (
              <button
                key={index}
                onClick={() => setActiveSection(index)}
                className={`px-3 py-1 rounded-lg ${
                  activeSection === index ? "bg-lavender-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        )}

        {/* Test Header Content */}
        {parsedSections.length > 0 && parsedSections[0].content.includes("Time allowed") && (
          <div
            className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg mb-6 print:shadow-none print:border print:border-black`}
          >
            <ReactMarkdown className="prose max-w-none">{parsedSections[0].content.split("\n\n")[0]}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Test Content */}
      <div className="space-y-8 print:space-y-4">
        {parsedSections.length > 0 ? (
          <>
            {/* Show only active section in normal mode, all sections in print mode */}
            {accessibilityMode ? (
              // Accessibility mode - show all sections with clear headings
              parsedSections.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-black mb-8`}
                >
                  <h2 className="text-xl font-bold mb-4 bg-lavender-100 p-2 rounded">{section.name}</h2>

                  {section.questions.map((question, qIndex) => (
                    <div key={qIndex} className="mb-6 border-b pb-4 last:border-b-0">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-lavender-700 min-w-[30px]">{question.number}.</span>
                        <div className="flex-1">
                          <ReactMarkdown className="prose max-w-none">{question.text}</ReactMarkdown>

                          {testStarted && !testCompleted && (
                            <div className="mt-3 bg-lavender-50 p-3 rounded-lg">
                              <label className="block font-medium mb-2">Your Answer:</label>
                              <textarea
                                value={userAnswers[question.id] || ""}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none min-h-24"
                                placeholder="Type your answer here..."
                              />
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">[{question.marks} marks]</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              // Normal mode - show only active section
              <div
                className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-black`}
              >
                <h2 className="text-xl font-bold mb-4">{parsedSections[activeSection].name}</h2>
                <ReactMarkdown className="prose max-w-none">{parsedSections[activeSection].content}</ReactMarkdown>

                {/* User Answer Section */}
                {testStarted && !testCompleted && (
                  <div className="mt-6 space-y-4 print:hidden">
                    <h3 className="text-lg font-semibold">Your Answers</h3>
                    <div className="space-y-4 bg-lavender-50 p-4 rounded-lg">
                      {parsedSections[activeSection].questions.map((question, qIndex) => (
                        <div key={qIndex} className="flex flex-col gap-2">
                          <label className="font-medium">Question {question.number}:</label>
                          <textarea
                            value={userAnswers[question.id] || ""}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-lavender-500 focus:outline-none min-h-24"
                            placeholder="Type your answer here..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Fallback if parsing failed
          <div
            className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg print:shadow-none print:border print:border-black`}
          >
            <ReactMarkdown className="prose max-w-none">{mockTest.content}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Solutions Section */}
      {showSolutions && mockTest.content.includes("SOLUTIONS") && (
        <div className="mt-8 glassmorphism p-6 rounded-lg shadow-lg print:mt-4 print:shadow-none print:border print:border-black">
          <h2 className="text-2xl font-bold mb-4 bg-lavender-100 p-2 rounded">Solutions</h2>
          <ReactMarkdown className="prose max-w-none">
            {mockTest.content.split(/(?=SOLUTIONS|ANSWER KEY|MARKING SCHEME)/i)[1]}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
