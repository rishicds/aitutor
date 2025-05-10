import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Format the conversation history, ensuring it starts with a user message
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // If this is the first message, just send it directly
    if (messages.length === 1) {
      const result = await model.generateContent(lastMessage.content);
      const response = await result.response;
      const text = response.text();
      return NextResponse.json({ response: text });
    }

    // For subsequent messages, use chat history
    const chat = model.startChat({
      history: formattedMessages.slice(0, -1).filter((msg, index) => {
        // Ensure we start with a user message and maintain proper alternation
        if (index === 0) return msg.role === 'user';
        return true;
      }),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Generate response
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('Error in mental health chat:', error);
    return NextResponse.json(
      { error: 'Failed to process the chat request' },
      { status: 500 }
    );
  }
} 