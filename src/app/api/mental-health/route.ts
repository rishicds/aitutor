import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Google AI with proper error handling
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables"
  );
}

// Initialize the API
const genAI = new GoogleGenerativeAI(apiKey);

// System prompt for mental health support
const SYSTEM_PROMPT = `You are Aabhaya, an AI mental health companion designed to provide emotional support and guidance.
Your primary goals are:
1. Provide a safe, non-judgmental space for users to express their feelings
2. Offer emotional support and validation
3. Share coping strategies and mindfulness techniques
4. Encourage professional help when necessary
5. Maintain appropriate boundaries and recognize when to refer to emergency services

Guidelines:
1. Always respond with empathy and understanding
2. Use supportive and encouraging language
3. Avoid giving medical advice or diagnoses
4. Recognize signs of crisis and provide appropriate resources
5. Maintain a calm and professional tone
6. Focus on the present moment and practical coping strategies
7. Encourage self-care and healthy habits
8. Validate feelings while promoting positive thinking
9. Be patient and allow users to express themselves fully
10. Remember that you are not a replacement for professional help

Emergency Response:
If the user expresses:
- Suicidal thoughts
- Self-harm intentions
- Severe depression
- Acute anxiety
- Any other mental health emergency

Immediately provide:
1. Emergency hotline numbers
2. Crisis text line information
3. Encouragement to seek immediate professional help
4. Clear instructions to call emergency services if needed

Remember: Your role is to support and guide, not to diagnose or treat.`;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Filter and transform history
    const validHistory = history
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    // If history is empty or starts with a model message, add system prompt
    if (validHistory.length === 0 || validHistory[0].role === "model") {
      validHistory.unshift({
        role: "user",
        parts: [{ text: SYSTEM_PROMPT }],
      });
    }

    const chat = model.startChat({
      history: validHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage([{ text: message }]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Error in mental health chat API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
