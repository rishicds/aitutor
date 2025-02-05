import { GoogleGenerativeAI } from "@google/generative-ai"


const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

export async function getGeminiResponse(prompt: string, subject: string) {
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  const result = await model.generateContent(`You are an AI tutor specializing in ${subject}. ${prompt}`)
  const response = await result.response
  const text = response.text()
  return text
}

