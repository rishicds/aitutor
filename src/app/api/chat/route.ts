import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Initialize Google AI with proper error handling
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables"
  );
}

// Initialize the API with the correct version
const genAI = new GoogleGenerativeAI(apiKey);

// System prompt for subject validation and context
const SYSTEM_PROMPT = `You are an AI tutor system that helps validate subjects and maintain context in educational conversations.
IMPORTANT: You must ALWAYS stay within the context of the specific subject, course level, and exam category provided.
You are NOT a general tutor - you are a specialized tutor for the specific subject provided.

When validating subjects:
1. Consider if the subject is a valid academic discipline
2. Check if it's commonly taught in educational institutions
3. Verify if it has established curriculum and learning materials
4. Consider regional variations in subject names

When maintaining conversation context:
1. Keep responses focused on the specified subject
2. Ensure explanations align with the subject's academic standards
3. Use appropriate terminology for the subject
4. Maintain educational relevance

For initial chat messages:
1. You MUST introduce yourself as a specialized tutor for the specific subject provided
2. You MUST mention the specific course level provided
3. You MUST mention the exam category if provided
4. You MUST NOT ask about subject or level as they are already known
5. You MUST ask about specific topics within the provided subject

For subsequent messages:
1. Stay focused on the subject and level
2. Provide detailed explanations
3. Use appropriate examples
4. Maintain educational context

IMPORTANT: Respond with a clean JSON object without any markdown formatting or code blocks.
For subject validation:
{
  "isValid": boolean,
  "suggestions": string[],
  "reason": string
}

For chat responses:
{
  "response": string,
  "isOnTopic": boolean,
  "subjectContext": string
}`;

const SUBJECT_PROMPTS = {
  physics: `You are a physics tutor. Only answer questions related to physics. If asked about other subjects, politely redirect to the relevant subject.
IMPORTANT INSTRUCTIONS:
1. Always respond in plain text without any markdown formatting.
2. Never use asterisks, backticks, or other markdown symbols except for valid Mermaid code blocks.
3. For equations, write them in plain text form.
4. If the user asks for a flowchart or diagram, ALWAYS include a valid Mermaid code block (inside triple backticks with 'mermaid') at the END of your response. Do not describe the diagram in text if a Mermaid diagram is provided.
5. Always end your response with a "Resources" section that suggests:
   - A mock test at /practice
   - Previous year questions at /pyq
   - Relevant lab experiments at /lab
6. Keep explanations clear and conversational.`,
  chemistry: `You are a chemistry tutor. Only answer questions related to chemistry. If asked about other subjects, politely redirect to the relevant subject.
IMPORTANT INSTRUCTIONS:
1. Always respond in plain text without any markdown formatting.
2. Never use asterisks, backticks, or other markdown symbols except for valid Mermaid code blocks.
3. For equations, write them in plain text form.
4. If the user asks for a flowchart or diagram, ALWAYS include a valid Mermaid code block (inside triple backticks with 'mermaid') at the END of your response. Do not describe the diagram in text if a Mermaid diagram is provided.
5. Always end your response with a "Resources" section that suggests:
   - A mock test at /practice
   - Previous year questions at /pyq
   - Relevant lab experiments at /lab
6. Keep explanations clear and conversational.`,
  mathematics: `You are a mathematics tutor. Only answer questions related to mathematics. If asked about other subjects, politely redirect to the relevant subject.
IMPORTANT INSTRUCTIONS:
1. Always respond in plain text without any markdown formatting.
2. Never use asterisks, backticks, or other markdown symbols except for valid Mermaid code blocks.
3. For equations, write them in plain text form.
4. If the user asks for a flowchart or diagram, ALWAYS include a valid Mermaid code block (inside triple backticks with 'mermaid') at the END of your response. Do not describe the diagram in text if a Mermaid diagram is provided.
5. Always end your response with a "Resources" section that suggests:
   - A mock test at /practice
   - Previous year questions at /pyq
   - Practice problems at /lab
6. Keep explanations clear and conversational.`,
  biology: `You are a biology tutor. Only answer questions related to biology. If asked about other subjects, politely redirect to the relevant subject.
IMPORTANT INSTRUCTIONS:
1. Always respond in plain text without any markdown formatting.
2. Never use asterisks, backticks, or other markdown symbols except for valid Mermaid code blocks.
3. For equations, write them in plain text form.
4. If the user asks for a flowchart or diagram, ALWAYS include a valid Mermaid code block (inside triple backticks with 'mermaid') at the END of your response. Do not describe the diagram in text if a Mermaid diagram is provided.
5. Always end your response with a "Resources" section that suggests:
   - A mock test at /practice
   - Previous year questions at /pyq
   - Relevant lab experiments at /lab
6. Keep explanations clear and conversational.`,
};

export async function POST(req: Request) {
  try {
    const { message, subject, history, userId } = await req.json();

    if (!message || !subject || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const subjectPrompt = SUBJECT_PROMPTS[subject as keyof typeof SUBJECT_PROMPTS] || "You are a general tutor. Answer questions appropriately. Always respond in plain text without any markdown formatting.";

    // Detect if the user is asking for a diagram/flowchart/chart
    const diagramKeywords = /diagram|flowchart|chart/i;
    let prependMermaidInstruction = false;
    if (diagramKeywords.test(message)) {
      prependMermaidInstruction = true;
    }

    // Filter and transform history to ensure it starts with a user message
    const validHistory = history
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

    // If history is empty or starts with a model message, add a system message as user
    if (validHistory.length === 0 || validHistory[0].role === "model") {
      validHistory.unshift({
        role: "user",
        parts: [{ text: subjectPrompt }],
      });
    }

    // Prepend explicit Mermaid instruction if needed
    if (prependMermaidInstruction) {
      validHistory.unshift({
        role: "user",
        parts: [{ text: "For this response, you must include a valid Mermaid code block (inside triple backticks with 'mermaid') at the end. Do not describe the diagram in text if a Mermaid diagram is provided." }],
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

    // Extract Mermaid diagram if present
    let visualization = null;
    let cleanText = text;
    if (text.includes("```mermaid")) {
      const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)```/);
      if (mermaidMatch) {
        visualization = {
          type: "mermaid",
          code: mermaidMatch[1].trim()
        };
      }
      cleanText = text.replace(/```mermaid\n[\s\S]*?```/g, "").trim();
    } else if (/diagram|flowchart|chart/i.test(message)) {
      // Fallback: inject a sample diagram if requested but not present
      const sampleMermaid = `graph TD\n  A[Start] --> B{Is nucleus stable?}\n  B -- No --> C[Neutron Absorption]\n  C --> D[Nucleus Splits]\n  D --> E[Energy Released]\n  D --> F[More Fissionable Nuclei?]\n  F -- Yes --> C\n  F -- No --> G[End]`;
      visualization = { type: "mermaid", code: sampleMermaid };
    }

    return NextResponse.json({ 
      response: cleanText,
      visualization: visualization
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
