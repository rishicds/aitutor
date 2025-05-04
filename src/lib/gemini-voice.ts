import type { Message } from "@/types"

// Function to process messages with Gemini API
export async function getGeminiVoiceResponse(
  userMessage: string,
  conversationHistory: Message[],
): Promise<{
  text: string
  resources?: any[]
}> {
  try {
    // Prepare conversation history for the API
    const history = conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }))

    // Prepare the API request
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("Gemini API key is not configured")
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`

    // Create the request body
    const requestBody = {
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: `You are an AI voice tutor that helps students learn various subjects in a clear, concise manner.

Guidelines:
1. Provide bite-sized, intuitive explanations that are easy to understand
2. Structure your response in the following order:
   a. Main explanation in plain text
   b. Key points as bullet points or bold text
   c. Visual aids (if needed) in appropriate code blocks
   d. Resources (if any) in a resources code block

3. For visual aids, use the following formats:
   - For diagrams: Use Mermaid code blocks (\`\`\`mermaid)
   - For charts: Use chart code blocks with JSON data (\`\`\`chart)

4. For resources, use a resources code block (\`\`\`resources) with JSON data:
   [
     {
       "name": "Resource Name",
       "url": "https://example.com",
       "description": "Brief description"
     }
   ]

5. Keep the main explanation clear and focused
6. Use bullet points or bold text for key points
7. Never include resource links in the main text
8. Never use markdown formatting except for the specified code blocks and key points`
          },
        ],
      },
    }

    // Make the API request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()

    // Extract the response text
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again."

    return {
      text: responseText,
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    throw error
  }
}
