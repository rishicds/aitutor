/* eslint-disable */
"use client"
import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"

// Add Tesseract.js type declaration for the window object
declare global {
  interface Window {
    Tesseract: any;
  }
}
import { getGeminiResponse } from "@/lib/gemini"
import { Loader2, BookOpen, Download, Share2, Bookmark, Upload, Send, Check, X, AlertCircle, Image, Camera, RefreshCw } from 'lucide-react'
import ReactMarkdown from "react-markdown"

// Custom lavender color scheme (keeping the same theme)
const lavenderColors = {
  glassmorphism: "bg-white/80 backdrop-blur-md border border-lavender-200",
  neonGlow: "text-lavender-700 drop-shadow-[0_0_10px_rgba(150,120,230,0.7)]",
}

interface AnalyzedQuestion {
  id: string
  imageUrl: string
  extractedText: string
  subject: string
  topic: string
  questionText: string
  difficulty: "easy" | "medium" | "hard"
  solution?: string
  userAnswer?: string
  userAnswerFeedback?: string
  isCorrect?: boolean
  createdAt: any
}

export default function ImageQuestionAnalyzer() {
  const [user] = useAuthState(auth)
  const [tokens, setTokens] = useState(0)
  const [loading, setLoading] = useState(false)
  const [analyzedQuestions, setAnalyzedQuestions] = useState<AnalyzedQuestion[]>([])
  const [currentImage, setCurrentImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [processingImage, setProcessingImage] = useState(false)
  const [extractingText, setExtractingText] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [analyzingQuestion, setAnalyzingQuestion] = useState(false)
  const [userAnswer, setUserAnswer] = useState("")
  const [evaluatingAnswer, setEvaluatingAnswer] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null)
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrorMessage("Image too large. Please upload an image less than 5MB.")
        return
      }

      setCurrentImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const extractTextFromImage = async () => {
    if (!currentImage || !user || tokens < 1) return
    
    setExtractingText(true)
    setErrorMessage(null)
    
    try {
      // Create a script element to load Tesseract.js if it's not already loaded
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js'
          script.onload = resolve
          script.onerror = () => reject(new Error('Failed to load Tesseract.js'))
          document.head.appendChild(script)
        })
      }
      
      // Create an image object from the uploaded file
      const imageUrl = URL.createObjectURL(currentImage)
      
      // Use Tesseract.js to recognize text from the image
      const result = await window.Tesseract.recognize(
        imageUrl,
        'eng', // language code for English (you can support multiple languages)
        {
          logger: (message: any) => {
            console.log(message)
            // You could update a progress indicator here if desired
          }
        }
      )
      
      // Get the extracted text from the result
      const extractedText = result.data.text.trim()
      
      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(imageUrl)
      
      // Set the extracted text in state
      setExtractedText(extractedText || "No text detected in the image.")
      
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
      console.error("Error extracting text:", error)
      setErrorMessage("Failed to extract text from image. Please try again.")
    } finally {
      setExtractingText(false)
    }
  }

  const analyzeQuestion = async () => {
    console.log(extractedText)

    if (!extractedText || !user || tokens < 1) return
  
    setAnalyzingQuestion(true)
    setErrorMessage(null)
  
    try {
      // Clean the extracted text to remove any problematic characters
      const cleanedText = extractedText
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
        .replace(/\\/g, "\\\\") // Escape backslashes
        .replace(/"/g, '\\"')   // Escape quotes
  
      // Construct a prompt for Gemini to analyze the question
      const prompt = `I have a question extracted from an image. Please analyze it and provide the following information:
      
  EXTRACTED TEXT:
  ${cleanedText}
  
  Please analyze this text and respond with VALID JSON in exactly this format:
  {
    "subject": "The academic subject this question belongs to",
    "topic": "The specific topic within the subject",
    "questionText": "The cleaned, formatted question text only",
    "difficulty": "easy|medium|hard based on your assessment",
    "solution": "A detailed, step-by-step solution to the question"
  }
  
  YOUR RESPONSE MUST BE VALID JSON AND NOTHING ELSE.`
  
      const aiResponse = await getGeminiResponse(prompt, {
        subject: "General",
        topic: "Question Analysis",
        personality: "friendly",
        level: "expert",
        teachingStyle: "example-based",
      })
  
      // Parse the response with robust error handling
      let analysis
      try {
        // First try direct parsing
        try {
          analysis = JSON.parse(aiResponse.trim())
        } catch (directParseError) {
          // If direct parsing fails, try to extract JSON using regex
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/g)
          if (jsonMatch && jsonMatch.length > 0) {
            // Try parsing each potential JSON match
            for (const match of jsonMatch) {
              try {
                analysis = JSON.parse(match.trim())
                if (analysis && typeof analysis === 'object') {
                  break // Found valid JSON
                }
              } catch (error) {
                // Continue to next match
              }
            }
          }
          
          // If we still don't have valid JSON, throw error
          if (!analysis) {
            throw new Error("No valid JSON found in response")
          }
        }
      } catch (parseError) {
        console.error("Error parsing AI analysis response:", parseError, aiResponse)
        setErrorMessage("Failed to parse the AI response. Please try again.")
        setAnalyzingQuestion(false)
        return
      }
  
      // Check if the analysis has the required fields
      if (!analysis.subject || !analysis.topic || !analysis.questionText || !analysis.difficulty || !analysis.solution) {
        setErrorMessage("Incomplete analysis received. Please try again.")
        setAnalyzingQuestion(false)
        return
      }
  
      // Create a new analyzed question
      const newQuestion = {
        id: `img-${Date.now()}`,
        imageUrl: imagePreview || "",
        extractedText: extractedText,
        subject: analysis.subject,
        topic: analysis.topic,
        questionText: analysis.questionText,
        difficulty: analysis.difficulty as "easy" | "medium" | "hard",
        solution: analysis.solution,
        createdAt: { seconds: Date.now() / 1000 },
      }
  
      // Update state with the new question
      setAnalyzedQuestions([newQuestion, ...analyzedQuestions])
  
      // Reset extraction state
      setExtractedText("")
      setCurrentImage(null)
      setImagePreview(null)
  
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
      console.error("Error analyzing question:", error)
      setErrorMessage("Failed to analyze the question. Please try again.")
    } finally {
      setAnalyzingQuestion(false)
    }
  }

  const handleSubmitAnswer = async (question: AnalyzedQuestion) => {
    if (!user || tokens < 1) return

    setEvaluatingAnswer(true)
    setProcessingId(question.id)

    try {
      // Construct a prompt for evaluating the answer
      const prompt = `
      As an expert educator, evaluate this student answer:
      
      QUESTION:
      ${question.questionText}
      
      CORRECT SOLUTION:
      ${question.solution}
      
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
        subject: question.subject,
        topic: question.topic,
        personality: "friendly",
        level: "expert",
        teachingStyle: "conceptual",
      })

      // Parse the response with improved error handling
      let evaluation
      try {
        // Extract JSON using regex pattern if needed
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("No JSON found in response")
        }
      } catch (parseError) {
        console.error("Error parsing AI evaluation response:", parseError)
        setErrorMessage("Failed to evaluate your answer. Please try again.")
        setEvaluatingAnswer(false)
        setProcessingId(null)
        return
      }

      // Check if the evaluation has the required fields
      if (!("isCorrect" in evaluation) || !("feedback" in evaluation)) {
        setErrorMessage("Incomplete evaluation received. Please try again.")
        setEvaluatingAnswer(false)
        setProcessingId(null)
        return
      }

      // Update state with evaluation results
      setAnalyzedQuestions(
        analyzedQuestions.map((q) =>
          q.id === question.id
            ? {
                ...q,
                userAnswer: userAnswer,
                userAnswerFeedback: evaluation.feedback,
                isCorrect: evaluation.isCorrect,
              }
            : q,
        ),
      )

      // Reset answer state
      setUserAnswer("")

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
      setErrorMessage("Failed to evaluate your answer. Please try again.")
    } finally {
      setEvaluatingAnswer(false)
      setProcessingId(null)
    }
  }

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
      <h1 className={`text-4xl font-bold mb-8 text-center ${lavenderColors.neonGlow}`}>
        Image Question Analyzer
      </h1>

      <div className={`mb-8 ${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg`}>
        <h2 className="text-2xl font-semibold mb-4">Upload Question Image</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Upload Section */}
          <div className="md:col-span-1">
            <div className="flex flex-col items-center">
              {imagePreview ? (
                <div className="mb-4 relative w-full">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded question" 
                    className="w-full object-contain border rounded-lg h-60"
                  />
                  <button
                    onClick={() => {
                      setCurrentImage(null)
                      setImagePreview(null)
                      setExtractedText("")
                    }}
                    className="absolute top-2 right-2 bg-red-100 p-1 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-lavender-300 rounded-lg p-8 mb-4 w-full h-60 flex flex-col items-center justify-center text-center">
                  <Camera size={48} className="text-lavender-400 mb-2" />
                  <p className="text-gray-500 mb-2">Upload an image of a question</p>
                  <p className="text-xs text-gray-400 mb-4">Supports JPG, PNG (max 5MB)</p>
                  <label className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg, image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload size={16} className="inline mr-2" />
                    Choose File
                  </label>
                </div>
              )}

              <div className="w-full">
                <button
                  onClick={extractTextFromImage}
                  disabled={!currentImage || extractingText || tokens < 1}
                  className="w-full bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {extractingText ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Extracting Text...
                    </>
                  ) : (
                    <>
                      <Image className="mr-2" size={16} />
                      Extract Text (1 Token)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Extracted Text Section */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-md mb-2">Extracted Text</h3>
            {extractedText ? (
              <div className="bg-lavender-50 p-4 rounded-lg min-h-60 mb-4">
                <p className="whitespace-pre-line">{extractedText}</p>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg min-h-60 mb-4 flex items-center justify-center text-gray-400">
                {extractingText ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <p>Extracting text from image...</p>
                  </div>
                ) : (
                  <p>Extracted text will appear here after processing</p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm">
                <BookOpen className="inline mr-1" size={16} />
                <span>
                  Available Tokens: <span className="font-semibold text-lavender-600">{tokens}</span>
                </span>
              </div>

              <button
                onClick={analyzeQuestion}
                disabled={!extractedText || analyzingQuestion || tokens < 1}
                className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50 flex items-center"
              >
                {analyzingQuestion ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2" size={16} />
                    Analyze Question (1 Token)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="inline-block mr-2" size={16} />
            {errorMessage}
          </div>
        )}
      </div>

      {/* Analyzed Questions List */}
      <h2 className="text-2xl font-semibold mb-6">Your Analyzed Questions</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" size={48} />
        </div>
      ) : analyzedQuestions.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="mx-auto mb-4" size={48} />
          <p className="text-lg text-gray-500">No analyzed questions yet.</p>
          <p className="text-gray-500">Upload an image to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {analyzedQuestions.map((question) => (
            <div key={question.id} className={`${lavenderColors.glassmorphism} p-6 rounded-lg shadow-lg`}>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left column - Image preview */}
                <div className="lg:w-1/3">
                  <img 
                    src={question.imageUrl} 
                    alt="Question" 
                    className="w-full object-contain border rounded-lg h-60"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {question.subject}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                      {question.topic}
                    </span>
                    <DifficultyBadge difficulty={question.difficulty} />
                  </div>
                </div>

                {/* Right column - Question & answers */}
                <div className="lg:w-2/3">
                  {/* Question section */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-2">Question</h3>
                    <div className="bg-lavender-50 p-4 rounded-lg">
                      <ReactMarkdown className="prose max-w-none">{question.questionText}</ReactMarkdown>
                    </div>
                  </div>

                  {/* User Answer Section - Only show if not already answered */}
                  {!question.userAnswer && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-md mb-2">Your Answer</h3>
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-3 border rounded-lg focus:ring-lavender-500 focus:outline-none min-h-24"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmitAnswer(question)}
                        disabled={!userAnswer || evaluatingAnswer || tokens < 1}
                        className="mt-2 bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50 flex items-center"
                      >
                        {processingId === question.id ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2" size={16} />
                            Check Answer (1 Token)
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Feedback on user answer */}
                  {question.userAnswer && question.userAnswerFeedback && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-md mb-2 flex items-center">
                        Your Answer
                        {question.isCorrect !== undefined && (
                          <span
                            className={`ml-2 ${question.isCorrect ? "text-green-500" : "text-red-500"} flex items-center`}
                          >
                            {question.isCorrect ? (
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
                        <p className="whitespace-pre-line">{question.userAnswer}</p>
                      </div>

                      <h3 className="font-semibold text-md mt-3 mb-2">Feedback</h3>
                      <div
                        className={`p-3 rounded-lg ${question.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}
                      >
                        <ReactMarkdown className="prose max-w-none">{question.userAnswerFeedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Solution */}
                  <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <span className="mr-2">Solution</span>
                      <button className="p-1 rounded-lg hover:bg-gray-100" title="Download solution">
                        <Download size={16} />
                      </button>
                    </h3>
                    <div className="bg-lavender-50 p-4 rounded-lg">
                      <ReactMarkdown className="prose max-w-none">{question.solution}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}