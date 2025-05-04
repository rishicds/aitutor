/* eslint-disable */
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

export async function getGeminiResponse(prompt: string, tutorParams: TutorParams) {
  // Get the assigned tutor name for the subject, or default to a general tutor
  const tutorName = tutorMapping[tutorParams.subject] || "Chandrima"

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
  let cleanedResponse = response;
  
  // Check for introductory text pattern (prose before first question)
  const introMatch = response.match(/^(.*?)(\*\*(?:Question|Q)\s*\d+|#{1,3}\s*(?:Question|Q)\s*\d+|\d+\.\s*(?:Question|Q)|(?:Question|Q)\s*\d+:)/i);
  if (introMatch && introMatch[1] && introMatch[1].trim().length > 0) {
    // Remove intro if it's not just whitespace and doesn't look like a question itself
    if (!introMatch[1].match(/\*\*|\d+\./)) {
      cleanedResponse = response.substring(introMatch[0].indexOf(introMatch[2]));
    }
  }
  
  // Make sure solutions are in a separate section with proper heading
  if (!cleanedResponse.match(/---+.*?solutions|solutions\s*&\s*explanations/i)) {
    // Check if there are identifiable solutions but no solutions section header
    const firstSolutionMatch = cleanedResponse.match(/\*\*Solution\s*\d+\*\*|#{1,3}\s*Solution\s*\d+/i);
    if (firstSolutionMatch) {
      // Find the position of the first solution
      const pos = cleanedResponse.indexOf(firstSolutionMatch[0]);
      
      // Insert a proper solutions divider
      cleanedResponse = 
        cleanedResponse.substring(0, pos) + 
        "\n\n---\n\n**Solutions & Explanations**\n\n" + 
        cleanedResponse.substring(pos);
    }
  }
  
  // Ensure questions are properly formatted with bold markers
  cleanedResponse = cleanedResponse.replace(
    /^(Question\s*\d+:)(?!\*\*)/gim, 
    "**$1**"
  );
  
  // Ensure solutions are properly formatted with bold markers
  cleanedResponse = cleanedResponse.replace(
    /^(Solution\s*\d+:)(?!\*\*)/gim, 
    "**$1**"
  );
  
  return cleanedResponse;
};

// Update the generatePracticeQuestions function to specify a clear format
export const generatePracticeQuestions = async (params: { subject: any; topic: any; difficulty: any; count: any; format: any; withSolutions: any; examStyle: any }) => {
  const { subject, topic, difficulty, count, format, withSolutions, examStyle } = params;
  
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
`;

  // Call to Gemini API with the improved prompt
  const response = await getGeminiResponse(prompt, {
    subject: subject,
    topic: topic,
    personality: "neutral",
    level: difficulty === "easy" ? "beginner" : difficulty === "medium" ? "intermediate" : "expert",
    teachingStyle: "example-based"
  });
  
  return response;
};
