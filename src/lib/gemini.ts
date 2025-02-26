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

export async function getGeminiResponse(prompt: string, subject: string) {
  // Get the assigned tutor name for the subject, or default to a general tutor
  const tutorName = tutorMapping[subject.toLowerCase()] || "Amit Verma"; 

  // Configure Gemini model - using a specific model name instead of just "gemini"
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const personalizedPrompt = `
    You are an Indian teacher who specializes in ${subject}.
    Provide warm, encouraging explanations with simple language.
    Use everyday examples when helpful. Include formulas if needed.
    Format response in markdown.
    Only introduce yourself by ${tutorName} if directly asked.
    
    Student question: ${prompt}
  `;

  const result = await model.generateContent(personalizedPrompt);
  const response = await result.response;
  const text = response.text();
  
  return text;
}