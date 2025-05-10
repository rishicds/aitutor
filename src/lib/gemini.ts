import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

// Fixed tutor names assigned per subject
const tutorMapping: Record<string, string> = {
  math: "Priya Sharma",
  physics: "Arun Patel",
  cs: "Deepa Krishnan",
  biology: "Raj Malhotra",
  chemistry: "Anjali Gupta",
  literature: "Vikram Mehta",
}

type TutorParams = {
  subject: string
  topic?: string
  subjectDescription?: string
  personality?: "friendly" | "strict" | "neutral"
  level?: "beginner" | "intermediate" | "expert"
  teachingStyle?: "conceptual" | "example-based" | "problem-solving"
  extraNotes?: string
}

type PYQParams = {
  subject: string
  topic: string
  difficulty?: "easy" | "medium" | "hard" | "mixed"
  count?: number
  format?: "multiple-choice" | "short-answer" | "long-form" | "mixed"
  withSolutions?: boolean
  examStyle?: string // Optional param to mimic specific exam boards (CBSE, ICSE, JEE, NEET, etc.)
}

type MockTestSection = {
  name: string
  questionType: "multiple-choice" | "short-answer" | "long-form" | "numerical" | "mixed"
  count: number
  marksPerQuestion: number
  isCompulsory: boolean
}

type MockTestParams = {
  id: string
  subject: string
  duration: number
  totalMarks: number
  sections: MockTestSection[]
}

export async function getGeminiResponse(prompt: string, tutorParams: TutorParams) {
  // Get the assigned tutor name for the subject, or default to a general tutor
  const tutorName = tutorMapping[tutorParams.subject.toLowerCase()] || "Chandrima"

  // Configure Gemini model
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  // Customize prompt based on tutor parameters
  let personalityPrompt = ""
  if (tutorParams.personality === "friendly") {
    personalityPrompt = "Be warm, encouraging, and supportive. Use positive reinforcement and be patient with mistakes."
  } else if (tutorParams.personality === "strict") {
    personalityPrompt =
      "Be direct and disciplined. Focus on precision and correct misconceptions immediately. Encourage rigor and attention to detail."
  } else {
    personalityPrompt = "Maintain a balanced and professional teaching approach."
  }

  let levelPrompt = ""
  if (tutorParams.level === "beginner") {
    levelPrompt =
      "Use simple language and avoid complex terminology. Break down concepts into basic components. Assume minimal prior knowledge."
  } else if (tutorParams.level === "intermediate") {
    levelPrompt =
      "Use standard terminology and assume basic knowledge of the subject. Provide moderate depth of explanation."
  } else if (tutorParams.level === "expert") {
    levelPrompt =
      "Use advanced terminology and concepts. Provide deep, nuanced explanations. Reference research and complex applications where relevant."
  }

  let stylePrompt = ""
  if (tutorParams.teachingStyle === "conceptual") {
    stylePrompt =
      "Focus on theoretical foundations and conceptual understanding. Emphasize the 'why' behind principles."
  } else if (tutorParams.teachingStyle === "example-based") {
    stylePrompt =
      "Use many practical examples and real-world applications. Show worked solutions and step-by-step demonstrations."
  } else if (tutorParams.teachingStyle === "problem-solving") {
    stylePrompt =
      "Focus on problem-solving methods and techniques. Encourage analytical thinking and strategic approaches to questions."
  }

  // Build the final prompt with all customizations
  const personalizedPrompt = `
    You are an Indian teacher named ${tutorName} who specializes in ${tutorParams.subject}.
    ${personalityPrompt}
    ${levelPrompt}
    ${stylePrompt}
    
    ${tutorParams.subjectDescription ? `Focus on these specific topics or aspects: ${tutorParams.subjectDescription}` : ""}
    ${tutorParams.extraNotes ? `Additional teaching instructions: ${tutorParams.extraNotes}` : ""}
    
    Format response in markdown.
    Only introduce yourself by name if directly asked.
    
    Student question: ${prompt}
  `

  const result = await model.generateContent(personalizedPrompt)
  const response = await result.response
  const text = response.text()

  return text
}

const formatAIResponse = (response: string) => {
  // Remove any introductory text before the first question
  let cleanedResponse = response

  // Check for introductory text pattern (prose before first question)
  const introMatch = response.match(
    /^(.*?)(\*\*(?:Question|Q)\s*\d+|#{1,3}\s*(?:Question|Q)\s*\d+|\d+\.\s*(?:Question|Q)|(?:Question|Q)\s*\d+:)/i,
  )
  if (introMatch && introMatch[1] && introMatch[1].trim().length > 0) {
    // Remove intro if it's not just whitespace and doesn't look like a question itself
    if (!introMatch[1].match(/\*\*|\d+\./)) {
      cleanedResponse = response.substring(introMatch[0].indexOf(introMatch[2]))
    }
  }

  // Make sure solutions are in a separate section with proper heading
  if (!cleanedResponse.match(/---+.*?solutions|solutions\s*&?\s*explanations/i)) {
    // Check if there are identifiable solutions but no solutions section header
    const firstSolutionMatch = cleanedResponse.match(/\*\*Solution\s*\d+\*\*|#{1,3}\s*Solution\s*\d+/i)
    if (firstSolutionMatch) {
      // Find the position of the first solution
      const pos = cleanedResponse.indexOf(firstSolutionMatch[0])

      // Insert a proper solutions divider
      cleanedResponse =
        cleanedResponse.substring(0, pos) +
        "\n\n---\n\n**Solutions & Explanations**\n\n" +
        cleanedResponse.substring(pos)
    }
  }

  // Ensure questions are properly formatted with bold markers
  cleanedResponse = cleanedResponse.replace(/^(Question\s*\d+:)(?!\*\*)/gim, "**$1**")

  // Ensure solutions are properly formatted with bold markers
  cleanedResponse = cleanedResponse.replace(/^(Solution\s*\d+:)(?!\*\*)/gim, "**$1**")

  return cleanedResponse
}

// Function to generate practice questions
export const generatePracticeQuestions = async (params: PYQParams) => {
  const { subject, topic, difficulty, count, format, withSolutions, examStyle } = params

  // Construct a detailed prompt with format instructions
  const prompt = `
Generate ${count} ${difficulty} level ${subject} questions about ${topic} following the ${examStyle}.
Format: ${format} questions.

Follow this EXACT structure:

First, list all the questions:

**Question 1:**
[Question text here]

**Question 2:**
[Question text here]

And so on for ${count} questions.

Then, after ALL questions, add a divider:

---

**Solutions & Explanations**

**Solution 1:**
[Detailed solution for question 1 here]

**Solution 2:**
[Detailed solution for question 2 here]

And so on for all questions.

Important instructions:
1. Start each question with "**Question N:**" where N is the question number
2. Start each solution with "**Solution N:**" where N is the question number
3. Put all solutions in a separate section after a divider (---)
4. Make solutions clear, comprehensive and properly formatted
5. For multiple choice questions, clearly indicate the correct answer
6. For any diagrams or mathematical formulas, use proper markdown formatting
`

  // Call to Gemini API with the improved prompt
  const response = await getGeminiResponse(prompt, {
    subject: subject,
    topic: topic,
    personality: "neutral",
    level: difficulty === "easy" ? "beginner" : difficulty === "medium" ? "intermediate" : "expert",
    teachingStyle: "example-based",
  })

  return response
}

// Function to generate a complete mock test
export const generateMockTest = async (params: MockTestParams) => {
  const { id, subject, duration, totalMarks, sections } = params

  // Calculate total questions and marks to ensure they match the specified total
  const totalQuestions = sections.reduce((sum, section) => sum + section.count, 0)
  const calculatedTotalMarks = sections.reduce((sum, section) => sum + section.count * section.marksPerQuestion, 0)

  // Prepare sections information for the prompt
  const sectionsInfo = sections
    .map((section) => {
      const sectionMarks = section.count * section.marksPerQuestion
      const compulsoryText = section.isCompulsory
        ? "All questions in this section are compulsory."
        : "Attempt any questions from this section."

      return `
Section ${section.name} (${sectionMarks} marks):
- Contains ${section.count} ${section.questionType} questions
- Each question carries ${section.marksPerQuestion} mark(s)
- ${compulsoryText}
`
    })
    .join("\n")

  // Construct a detailed prompt for generating the mock test
  const prompt = `
Generate a complete ${subject} mock test paper following the Indian education system format.

Test Details:
- Subject: ${subject}
- Duration: ${duration} minutes
- Total Marks: ${totalMarks}
- Total Questions: ${totalQuestions}

${sectionsInfo}

Format Requirements:
1. Create a professional-looking question paper with proper header including subject name, time allowed, and maximum marks
2. Include clear instructions for each section
3. Number all questions properly within each section
4. For multiple-choice questions, provide 4 options (a, b, c, d)
5. Include a mix of theoretical and application-based questions
6. For numerical problems, include proper units and formulas where applicable
7. Ensure the difficulty level is appropriate for high school/secondary education
8. Include diagrams or figures where necessary (described in text)
9. Provide a separate answer key/solutions section at the end with "SOLUTIONS" as a clear header

The test should cover a comprehensive range of topics within the subject and follow standard examination patterns used in Indian schools.

IMPORTANT: Format the paper with clear section headers (SECTION A, SECTION B, etc.) and make sure each section is visually distinct.
`

  // Call to Gemini API with the detailed prompt
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  const result = await model.generateContent(prompt)
  const response = await result.response
  const mockTestContent = response.text()

  // Return the content directly without saving to database
  return {
    id,
    subject,
    duration,
    totalMarks,
    content: mockTestContent,
    createdAt: new Date().toISOString(),
  }
}
