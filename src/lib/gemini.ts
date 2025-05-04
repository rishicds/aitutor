import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// Fixed tutor names assigned per subject
const tutorMapping: Record<string, string> = {
  math: "Priya Sharma",
  physics: "Arun Patel",
  cs: "Deepa Krishnan",
  biology: "Raj Malhotra",
  chemistry: "Anjali Gupta",
  literature: "Vikram Mehta",
};

type TutorParams = {
  subject: string;
  topic?: string;
  subjectDescription?: string;
  personality?: "friendly" | "strict" | "neutral";
  level?: "beginner" | "intermediate" | "expert";
  teachingStyle?: "conceptual" | "example-based" | "problem-solving";
  extraNotes?: string;
};

type PYQParams = {
  subject: string;
  topic: string;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  count?: number;
  format?: "multiple-choice" | "short-answer" | "long-form" | "mixed";
  withSolutions?: boolean;
  examStyle?: string; // Optional param to mimic specific exam boards (CBSE, ICSE, JEE, NEET, etc.)
};

export async function getGeminiResponse(prompt: string, tutorParams: TutorParams) {
  // Get the assigned tutor name for the subject, or default to a general tutor
  const tutorName = tutorMapping[tutorParams.subject] || "Chandrima"; 

  // Configure Gemini model
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Customize prompt based on tutor parameters
  let personalityPrompt = "";
  if (tutorParams.personality === "friendly") {
    personalityPrompt = "Be warm, encouraging, and supportive. Use positive reinforcement and be patient with mistakes.";
  } else if (tutorParams.personality === "strict") {
    personalityPrompt = "Be direct and disciplined. Focus on precision and correct misconceptions immediately. Encourage rigor and attention to detail.";
  } else {
    personalityPrompt = "Maintain a balanced and professional teaching approach.";
  }

  let levelPrompt = "";
  if (tutorParams.level === "beginner") {
    levelPrompt = "Use simple language and avoid complex terminology. Break down concepts into basic components. Assume minimal prior knowledge.";
  } else if (tutorParams.level === "intermediate") {
    levelPrompt = "Use standard terminology and assume basic knowledge of the subject. Provide moderate depth of explanation.";
  } else if (tutorParams.level === "expert") {
    levelPrompt = "Use advanced terminology and concepts. Provide deep, nuanced explanations. Reference research and complex applications where relevant.";
  }

  let stylePrompt = "";
  if (tutorParams.teachingStyle === "conceptual") {
    stylePrompt = "Focus on theoretical foundations and conceptual understanding. Emphasize the 'why' behind principles.";
  } else if (tutorParams.teachingStyle === "example-based") {
    stylePrompt = "Use many practical examples and real-world applications. Show worked solutions and step-by-step demonstrations.";
  } else if (tutorParams.teachingStyle === "problem-solving") {
    stylePrompt = "Focus on problem-solving methods and techniques. Encourage analytical thinking and strategic approaches to questions.";
  }

  // Build the final prompt with all customizations
  const personalizedPrompt = `
    You are an Indian teacher named ${tutorName} who specializes in ${tutorParams.subject}.
    ${personalityPrompt}
    ${levelPrompt}
    ${stylePrompt}
    
    ${tutorParams.subjectDescription ? `Focus on these specific topics or aspects: ${tutorParams.subjectDescription}` : ''}
    ${tutorParams.extraNotes ? `Additional teaching instructions: ${tutorParams.extraNotes}` : ''}
    
    Format response in markdown.
    Only introduce yourself by name if directly asked.
    
    Student question: ${prompt}
  `;

  const result = await model.generateContent(personalizedPrompt);
  const response = await result.response;
  const text = response.text();
  
  return text;
}

export async function generatePracticeQuestions(pyqParams: PYQParams) {
  // Configure Gemini model
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  // Get the assigned tutor name for the subject, or default to a general tutor
  const tutorName = tutorMapping[pyqParams.subject] || "Chandrima";
  
  // Set defaults for optional parameters
  const questionCount = pyqParams.count || 5;
  const difficulty = pyqParams.difficulty || "mixed";
  const format = pyqParams.format || "mixed";
  const withSolutions = pyqParams.withSolutions !== undefined ? pyqParams.withSolutions : true;
  
  // Build the prompt for generating practice questions
  const pyqPrompt = `
    As an experienced Indian education expert named ${tutorName} who specializes in ${pyqParams.subject}, 
    create ${questionCount} practice questions on the topic of "${pyqParams.topic}" with the following specifications:
    
    - Difficulty level: ${difficulty}
    - Question format: ${format}
    ${pyqParams.examStyle ? `- Follow the style and pattern of ${pyqParams.examStyle} examinations` : ''}
    
    ${withSolutions ? 'Include detailed solutions and explanations for each question.' : 'Do not include solutions.'}
    
    Format your response in clear markdown with:
    1. Each question clearly numbered
    2. Questions organized by type if using mixed formats
    3. Solutions clearly labeled and separated from questions
    4. Include proper mathematical notation where applicable
    
    Ensure questions are challenging yet appropriate for the specified difficulty level and represent accurate concepts for ${pyqParams.subject}, specifically focusing on ${pyqParams.topic}.
  `;

  const result = await model.generateContent(pyqPrompt);
  const response = await result.response;
  const text = response.text();
  
  return text;
}