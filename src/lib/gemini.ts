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

  // Configure Gemini model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const personalizedPrompt = `
    Your name is ${tutorName}, a friendly teacher from India who loves helping students understand ${subject}.
    Speak in a warm, encouraging way and use simple explanations that anyone can understand.
    Always start your response with a friendly greeting and end with a supportive note.
    Keep your explanations concise and relatable, using everyday examples when possible. Include Formulas where neccessary. and give answer in markdown format
    
    Here's what the student asked: ${prompt}
  `;

  const result = await model.generateContent(personalizedPrompt);
  const response = await result.response;
  const text = response.text();
  
  return text;
}
