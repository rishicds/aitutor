import { GoogleGenerativeAI } from "@google/generative-ai"

// This would be your actual API key in a real implementation
// For the demo, we'll use a placeholder
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "YOUR_API_KEY"
const genAI = new GoogleGenerativeAI(API_KEY)

// Fixed tutor names assigned per subject
const tutorMapping: Record<string, string> = {
  physics: "Dr. Arun Patel",
  chemistry: "Dr. Anjali Gupta",
  biology: "Dr. Raj Malhotra",
  neuroscience: "Dr. Neha Sharma",
  genetics: "Dr. Vikram Mehta",
}

type ExperimentParams = {
  experimentId: string
  experimentName: string
  category: string
  parameters: Record<string, number | string>
  question: string
}

export async function getExperimentAnalysis(params: ExperimentParams) {
  try {
    // Get the assigned tutor name for the subject, or default to a general tutor
    const tutorName = tutorMapping[params.category] || "Dr. Chandrima Roy"

    // Construct a detailed prompt
    const prompt = `
      You are ${tutorName}, an expert in ${params.category} specializing in laboratory experiments and visualizations.
      
      The student is working with a 3D visualization of the "${params.experimentName}" experiment.
      
      Current experiment parameters:
      ${Object.entries(params.parameters)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join("\n")}
      
      Student question: "${params.question}"
      
      Provide a detailed, educational response that:
      1. Directly answers their question
      2. Explains the relevant scientific principles
      3. Relates to the current parameter settings when appropriate
      4. Suggests experiments they could try with the visualization
      
      Format your response in clear paragraphs with scientific accuracy.
    `

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    
    // Call the Gemini API
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return text
  } catch (error) {
    console.error("Error getting AI analysis:", error)
    return "Sorry, I couldn't generate an analysis at this time. Please try again later."
  }
}
