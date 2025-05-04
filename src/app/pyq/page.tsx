"use client"
import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  serverTimestamp
} from "firebase/firestore"
import { getGeminiResponse, generatePracticeQuestions } from "@/lib/gemini"
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
  ChevronDown
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

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
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({})
  const [evaluatingAnswer, setEvaluatingAnswer] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<"multiple-choice" | "short-answer" | "long-form" | "mixed">("mixed")
  const [selectedSubjectInput, setSelectedSubjectInput] = useState("Mathematics")
  const [expandedQuestions, setExpandedQuestions] = useState<{[key: string]: boolean}>({})
  const [generationError, setGenerationError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setLoading(true);
      
      // Fetch tokens from Firestore
      const fetchTokens = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setTokens(userDoc.data()?.tokens || 10);
          } else {
            setTokens(10);
          }
        } catch (error) {
          console.error("Error fetching tokens:", error);
          setTokens(10);
        } finally {
          setLoading(false);
        }
      };

      fetchTokens();
    }
  }, [user]);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...pyqs];
    
    // Subject filter
    if (selectedSubject !== "all") {
      result = result.filter(pyq => pyq.subject === selectedSubject);
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pyq => 
        pyq.question.toLowerCase().includes(query) || 
        pyq.topic.toLowerCase().includes(query) ||
        pyq.subject.toLowerCase().includes(query)
      );
    }
    
    // Sorting
    result.sort((a, b) => {
      if (sortBy === "createdAt") {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      } else if (sortBy === "year") {
        const aYear = a.year || 0;
        const bYear = b.year || 0;
        return sortOrder === "asc" ? aYear - bYear : bYear - aYear;
      } else {
        const difficultyValue = { "easy": 1, "medium": 2, "hard": 3 };
        const aVal = difficultyValue[a.difficulty];
        const bVal = difficultyValue[b.difficulty];
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
    });
    
    setFilteredPyqs(result);
  }, [pyqs, selectedSubject, searchQuery, sortBy, sortOrder]);

  const parseGeneratedQuestions = (markdownText: string): PYQ[] => {
    const newPyqs: PYQ[] = [];
    
    // First try to split by markdown headers for questions
    let questionBlocks = markdownText.split(/(?=\n?#{1,3}\s*(?:Question|Q)\s*\d+)/i);
    
    // If that didn't work well, try numbered questions format
    if (questionBlocks.length <= 1) {
      questionBlocks = markdownText.split(/\n(?=\d+\.\s)/);
    }
    
    // If we still don't have multiple blocks, try more patterns
    if (questionBlocks.length <= 1) {
      questionBlocks = markdownText.split(/\n\n(?=(?:Question|Q)[\s:]*\d+)/i);
    }
    
    // Last resort: look for bold questions or other markers
    if (questionBlocks.length <= 1) {
      questionBlocks = markdownText.split(/\n\n(?=\*\*(?:Question|Q)[\s:]*\d+\*\*)/i);
    }
    
    // Filter out empty blocks and process each question block
    questionBlocks.filter(block => block.trim()).forEach((block, index) => {
      // Identify where question ends and solution/answer begins
      const answerMarkers = [
        "solution:", "answer:", "explanation:", 
        "### solution", "### answer", "### explanation",
        "## solution", "## answer", "## explanation",
        "#### solution", "#### answer", "#### explanation",
        "**solution**", "**answer**", "**explanation**"
      ];
      
      // Find the earliest occurrence of any answer marker
      let solutionIndex = -1;
      let markerFound = "";
      
      for (const marker of answerMarkers) {
        const idx = block.toLowerCase().indexOf(marker);
        if (idx !== -1 && (solutionIndex === -1 || idx < solutionIndex)) {
          solutionIndex = idx;
          markerFound = marker;
        }
      }
      
      // If we found a solution section
      if (solutionIndex !== -1) {
        // Extract question and answer
        let question = block.substring(0, solutionIndex).trim();
        let answer = block.substring(solutionIndex).trim();
        
        // Clean up the question - remove question numbers and headers
        question = question
          .replace(/^#{1,4}\s*(?:Question|Q)[\s:]?\d+/i, '')
          .replace(/^(?:Question|Q)[\s:]?\d+/i, '')
          .replace(/^\d+\.\s*/, '')
          .replace(/^\*\*(?:Question|Q)[\s:]?\d+\*\*/i, '')
          .trim();
        
        // Only add if we have both question and answer
        if (question && answer) {
          const newPyq: PYQ = {
            id: `gen-${Date.now()}-${index}`,
            question: question,
            subject: selectedSubjectInput,
            topic: topicInput,
            difficulty: selectedDifficulty,
            answer: answer,
            isAIGenerated: true,
            createdAt: { seconds: Date.now() / 1000 }
          };
          
          newPyqs.push(newPyq);
        }
      } else {
        // No solution marker found, just add the question without an answer
        let question = block
          .replace(/^#{1,4}\s*(?:Question|Q)[\s:]?\d+/i, '')
          .replace(/^(?:Question|Q)[\s:]?\d+/i, '')
          .replace(/^\d+\.\s*/, '')
          .replace(/^\*\*(?:Question|Q)[\s:]?\d+\*\*/i, '')
          .trim();
        
        if (question) {
          const newPyq: PYQ = {
            id: `gen-${Date.now()}-${index}`,
            question: question,
            subject: selectedSubjectInput,
            topic: topicInput,
            difficulty: selectedDifficulty,
            isAIGenerated: true,
            createdAt: { seconds: Date.now() / 1000 }
          };
          
          newPyqs.push(newPyq);
        }
      }
    });
    
    return newPyqs;
  };

  const handleGetAnswer = async (pyq: PYQ) => {
    if (!user || tokens < 1) return;

    setProcessingId(pyq.id);
    
    try {
      const tutorParams = {
        subject: pyq.subject,
        topic: pyq.topic,
        personality: "friendly" as "friendly" | "strict" | "neutral",
        level: (pyq.difficulty === "easy" ? "beginner" : pyq.difficulty === "medium" ? "intermediate" : "expert") as "beginner" | "intermediate" | "expert",
        teachingStyle: "example-based" as "conceptual" | "example-based" | "problem-solving"
      };
      
      const aiResponse = await getGeminiResponse(
        `Please provide a detailed solution for this ${pyq.subject} question about ${pyq.topic}: ${pyq.question}`,
        tutorParams
      );

      // Update state with solution
      setPyqs(pyqs.map((q) => (q.id === pyq.id ? { ...q, answer: aiResponse } : q)));

      // Deduct a token
      try {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            tokens: increment(-1),
          });
          setTokens(tokens - 1);
        }
      } catch (error) {
        console.error("Error updating tokens:", error);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      alert("Failed to get solution. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!user || tokens < 2 || !topicInput.trim()) return;
    
    setGeneratingQuestions(true);
    setGenerationError(null);
    
    try {
      // Use the dedicated function for generating practice questions
      const pyqParams = {
        subject: selectedSubjectInput,
        topic: topicInput,
        difficulty: selectedDifficulty,
        count: numberOfQuestions,
        format: selectedFormat,
        withSolutions: true,
        examStyle: "indian education system" // Ensuring questions match the Indian education pattern
      };
      
      const aiResponse = await generatePracticeQuestions(pyqParams);
      
      // Parse the generated questions
      const newPyqs = parseGeneratedQuestions(aiResponse);
      
      if (newPyqs.length === 0) {
        setGenerationError("Failed to parse generated questions. Please try again.");
        return;
      }
      
      // Update state with new questions
      setPyqs([...newPyqs, ...pyqs]);
      
      // Expand the newly generated questions by default
      const newExpandedState = { ...expandedQuestions };
      newPyqs.forEach(pyq => {
        newExpandedState[pyq.id] = true;
      });
      setExpandedQuestions(newExpandedState);
      
      // Deduct tokens
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          tokens: increment(-2), // Cost 2 tokens to generate questions
        });
        setTokens(tokens - 2);
      } catch (error) {
        console.error("Error updating tokens:", error);
      }
      
      // Reset input
      setTopicInput("");
      
    } catch (error) {
      console.error("Error generating questions:", error);
      setGenerationError("Failed to generate questions. Please try again.");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAnswerChange = (pyqId: string, value: string) => {
    setUserAnswers({
      ...userAnswers,
      [pyqId]: value
    });
  };

  const toggleExpanded = (pyqId: string) => {
    setExpandedQuestions({
      ...expandedQuestions,
      [pyqId]: !expandedQuestions[pyqId]
    });
  };

  const handleSubmitAnswer = async (pyq: PYQ) => {
    if (!user || tokens < 1) return;
    
    const userAnswer = userAnswers[pyq.id];
    if (!userAnswer) return;
    
    setEvaluatingAnswer(pyq.id);
    
    try {
      // Generate a solution if we don't have one yet
      let answerToCheck = pyq.answer;
      
      if (!answerToCheck) {
        const tutorParams = {
          subject: pyq.subject,
          topic: pyq.topic,
          personality: "friendly" as "friendly" | "strict" | "neutral",
          level: "expert" as "beginner" | "intermediate" | "expert",
          teachingStyle: "example-based" as "conceptual" | "example-based" | "problem-solving"
        };
        
        answerToCheck = await getGeminiResponse(
          `Please provide a detailed solution for this ${pyq.subject} question about ${pyq.topic}: ${pyq.question}`,
          tutorParams
        );
        
        // Update the pyq with the answer
        setPyqs(pyqs.map((q) => (q.id === pyq.id ? { ...q, answer: answerToCheck } : q)));
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
      `;
      
      const aiResponse = await getGeminiResponse(prompt, {
        subject: pyq.subject,
        topic: pyq.topic,
        personality: "friendly",
        level: "expert",
        teachingStyle: "conceptual"
      });
      
      // Parse the response with improved error handling
      let evaluation;
      try {
        // First try to parse the entire response as JSON
        evaluation = JSON.parse(aiResponse.trim());
      } catch (firstError) {
        try {
          // Extract JSON using regex pattern if initial parse fails
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            evaluation = JSON.parse(jsonMatch[0]);
          } else {
            // If no JSON found, create a default response
            evaluation = {
              isCorrect: aiResponse.toLowerCase().includes("correct") && 
                        !aiResponse.toLowerCase().includes("not correct") && 
                        !aiResponse.toLowerCase().includes("incorrect"),
              feedback: aiResponse
            };
          }
        } catch (secondError) {
          console.error("Error parsing AI evaluation response:", secondError);
          evaluation = {
            isCorrect: false,
            feedback: "There was an error evaluating your answer. The system could not parse the AI's response. Please try again or compare your answer with the solution manually."
          };
        }
      }
      
      // Check if the evaluation has the required fields
      if (!('isCorrect' in evaluation) || !('feedback' in evaluation)) {
        evaluation = {
          isCorrect: false,
          feedback: "The evaluation system encountered an error. Please try again or check the solution manually."
        };
      }
      
      // Format the feedback with markdown if it's plain text
      if (evaluation.feedback && !evaluation.feedback.includes('#') && !evaluation.feedback.includes('*')) {
        evaluation.feedback = evaluation.feedback
          .split('\n\n')
          .map((para: string) => para.trim())
          .filter((para: any) => para)
          .join('\n\n');
      }
      
      // Update state with evaluation results
      setPyqs(pyqs.map((q) => (q.id === pyq.id ? { 
        ...q, 
        userAnswer: userAnswer, 
        userAnswerFeedback: evaluation.feedback,
        isCorrect: evaluation.isCorrect
      } : q)));
      
      // Deduct a token
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          tokens: increment(-1),
        });
        setTokens(tokens - 1);
      } catch (error) {
        console.error("Error updating tokens:", error);
      }
      
    } catch (error) {
      console.error("Error evaluating answer:", error);
      alert("Failed to evaluate your answer. Please try again.");
    } finally {
      setEvaluatingAnswer(null);
    }
  };

  const subjects = ["all", ...Array.from(new Set(pyqs.map(pyq => pyq.subject)))];

  const DifficultyBadge = ({ difficulty }: { difficulty: "easy" | "medium" | "hard" }) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded ${colors[difficulty]}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center neon-glow">Practice Questions</h1>
      
      <div className="mb-8 glassmorphism p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Generate New Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter a topic (e.g., Vectors, Databases, Quantum Physics)"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={selectedSubjectInput}
              onChange={(e) => setSelectedSubjectInput(e.target.value)}
              placeholder="Subject"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as "easy" | "medium" | "hard")}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
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
              onChange={(e) => setSelectedFormat(e.target.value as "multiple-choice" | "short-answer" | "long-form" | "mixed")}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
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
              onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
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
            <span>Available Tokens: <span className="font-semibold text-primary">{tokens}</span></span>
            <span className="ml-2 text-gray-500">(Generating costs 2 tokens)</span>
          </div>
          
          <button
            onClick={handleGenerateQuestions}
            disabled={generatingQuestions || tokens < 2 || !topicInput.trim()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300 disabled:opacity-50 flex items-center"
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
      
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-semibold">Your Questions</h2>
        
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search questions or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject === "all" ? "All Subjects" : subject}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSortBy("createdAt")}
              className={`px-3 py-1 rounded-lg ${sortBy === "createdAt" ? "bg-primary text-white" : "bg-gray-200"}`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy("difficulty")}
              className={`px-3 py-1 rounded-lg ${sortBy === "difficulty" ? "bg-primary text-white" : "bg-gray-200"}`}
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
            <div key={pyq.id} className="glassmorphism p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <span>{pyq.subject} - {pyq.topic}</span>
                    <button 
                      className="ml-2 p-1 rounded-lg hover:bg-gray-100"
                      onClick={() => toggleExpanded(pyq.id)}
                      aria-label={expandedQuestions[pyq.id] ? "Collapse" : "Expand"}
                    >
                      {expandedQuestions[pyq.id] ? 
                        <ChevronUp size={18} /> : 
                        <ChevronDown size={18} />
                      }
                    </button>
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
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
                  <button 
                    className="p-1 rounded-lg hover:bg-gray-100"
                    title="Bookmark question"
                  >
                    <Bookmark size={16} />
                  </button>
                  <button 
                    className="p-1 rounded-lg hover:bg-gray-100"
                    title="Share question"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              
              {expandedQuestions[pyq.id] && (
                <>
                  <div className="mb-4 py-3 px-4 bg-gray-50 rounded-lg">
                    <ReactMarkdown className="prose max-w-none">{pyq.question}</ReactMarkdown>
                  </div>
                  
                  {/* User Answer Section - Only show if not already answered */}
                  {!pyq.userAnswer && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-md mb-2">Your Answer</h3>
                      <div className="flex gap-2">
                        <textarea
                          value={userAnswers[pyq.id] || ""}
                          onChange={(e) => handleAnswerChange(pyq.id, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none min-h-24"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmitAnswer(pyq)}
                        disabled={!userAnswers[pyq.id] || evaluatingAnswer === pyq.id || tokens < 1}
                        className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300 disabled:opacity-50 flex items-center"
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
                          <span className={`ml-2 ${pyq.isCorrect ? "text-green-500" : "text-red-500"} flex items-center`}>
                            {pyq.isCorrect ? (
                              <><Check size={16} className="mr-1" /> Correct</>
                            ) : (
                              <><X size={16} className="mr-1" /> Needs Improvement</>
                            )}
                          </span>
                        )}
                      </h3>
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <p className="whitespace-pre-line">{pyq.userAnswer}</p>
                      </div>
                      
                      <h3 className="font-semibold text-md mt-3 mb-2">Feedback</h3>
                      <div className={`p-3 rounded-lg ${pyq.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border`}>
                        <ReactMarkdown className="prose max-w-none">{pyq.userAnswerFeedback}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Answer/Solution */}
                  {pyq.answer ? (
                    <div className="mt-4">
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <span className="mr-2">Complete Solution</span>
                        <button 
                          className="p-1 rounded-lg hover:bg-gray-100"
                          title="Download solution"
                        >
                          <Download size={16} />
                        </button>
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <ReactMarkdown className="prose max-w-none">{pyq.answer}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGetAnswer(pyq)}
                      disabled={loading || tokens < 1 || processingId === pyq.id}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300 disabled:opacity-50 flex items-center mt-4"
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