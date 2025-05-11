import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { algorithm, prompt } = await request.json();

    if (!algorithm || !prompt) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Configure Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a detailed prompt for code generation
    const fullPrompt = `
      You are an expert computer science instructor specializing in data structures and algorithms.
      
      Generate clean, well-commented, and efficient JavaScript/TypeScript code for the following DSA request:
      
      Algorithm category: ${algorithm}
      Request: ${prompt}
      
      Requirements:
      1. Provide complete, runnable code with proper function signatures
      2. Include detailed comments explaining the approach and time/space complexity
      3. Follow best practices for the language
      4. Include example usage if appropriate
      5. Keep the code concise but educational
      6. Do not include any explanatory text outside the code block
      
      Return ONLY the code with comments, nothing else.
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let code = response.text();
    
    // Clean up the response to extract just the code if needed
    // Remove markdown code block markers if present
    code = code.replace(/^```(javascript|typescript|js|ts)\n/m, '').replace(/```$/m, '');
    
    return NextResponse.json({ code });
  } catch (error) {
    console.error("Error generating code:", error);
    return NextResponse.json(
      { error: "Failed to generate code" },
      { status: 500 }
    );
  }
}