import OpenAI from "openai";
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

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    console.log("Received request body:", body);

    // Extract data with fallbacks
    const message = body.message || "";
    const subject = body.context?.subject || body.subject || "General"; // Try context first
    const course = body.context?.course || body.course || "General";
    const examCategory =
      body.context?.examCategory || body.examCategory || null;
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Initialize the model with proper error handling
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // First, validate the subject if it's a new chat
    if (!message) {
      try {
        console.log("Validating subject:", subject);
        const validationPrompt = `${SYSTEM_PROMPT}\n\nValidate this subject: "${subject}". Consider it valid if it's a real academic subject, even if it's specialized or advanced.`;
        const validationResult = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: validationPrompt }] }],
        });
        const validationText = validationResult.response.text();
        console.log("Validation response:", validationText);
        let validationData;

        try {
          const cleanText = validationText
            .replace(/```json\n?|\n?```/g, "")
            .trim();
          validationData = JSON.parse(cleanText);
          console.log("Parsed validation data:", validationData);
        } catch (parseError) {
          console.error("Error parsing validation response:", parseError);
          validationData = {
            isValid: true,
            suggestions: [],
            reason: "Subject appears valid",
          };
        }

        if (validationData.isValid === false) {
          console.log("Subject validation failed:", validationData);
          return NextResponse.json(
            {
              error: "Invalid subject",
              suggestions: validationData.suggestions || [],
              reason: validationData.reason || "Invalid subject",
            },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Error validating subject:", error);
        console.log(
          "Subject validation failed, proceeding with subject:",
          subject
        );
      }
    }

    // Prepare the chat context
    const chatContext = `Subject: "${subject}"
Course Level: ${course}
${examCategory ? `Exam Category: ${examCategory}` : ""}
Previous Message: ${message || "Starting new chat"}`;

    try {
      console.log("Generating chat response with context:", chatContext);
      const chatPrompt = `${SYSTEM_PROMPT}\n\nContext:\n${chatContext}\n\n${
        !message
          ? `You are a specialized tutor for "${subject}" at ${course} level${
              examCategory ? ` preparing for ${examCategory}` : ""
            }. 
             Your first message MUST:
             1. Introduce yourself as a specialized tutor for "${subject}" ONLY
             2. Mention you're teaching at ${course} level
             3. ${
               examCategory
                 ? `Note that you're preparing students for ${examCategory}`
                 : ""
             }
             4. Ask what specific topic within "${subject}" they'd like to learn about
             DO NOT ask about other subjects or levels. Stay focused on "${subject}" only.`
          : `Generate an educational response that is focused on "${subject}" at ${course} level${
              examCategory ? ` and relevant to ${examCategory}` : ""
            }.`
      }`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: chatPrompt }] }],
      });
      const responseText = result.response.text();
      let responseData;

      try {
        const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();
        responseData = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        responseData = {
          response: responseText,
          isOnTopic: true,
          subjectContext: subject,
        };
      }

      // Ensure all required fields are present
      const chatData = {
        subject: subject,
        course: course,
        examCategory: examCategory,
        messages: [
          {
            role: "user",
            content: message || "",
            timestamp: new Date().toISOString(),
          },
          {
            role: "assistant",
            content: responseData.response || responseText,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: serverTimestamp(),
      };

      // Store the chat in Firestore
      const chatRef = await addDoc(
        collection(db, "users", userId, "chats"),
        chatData
      );

      return NextResponse.json({
        response: responseData.response || responseText,
        isOnTopic: responseData.isOnTopic || true,
        subjectContext: responseData.subjectContext || subject,
        chatId: chatRef.id,
      });
    } catch (error) {
      console.error("Error generating response:", error);
      return NextResponse.json(
        {
          error: "Failed to generate response",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
