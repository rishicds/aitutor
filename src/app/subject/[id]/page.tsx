"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { getGeminiResponse } from "@/lib/gemini";
import { ChatHeader } from "@/components/subject/ChatHeader";
import { ChatInput } from "@/components/subject/ChatInput";
import { Message } from "@/components/subject/Message";

interface ChatMessage {
  content: string;
  isAi: boolean;
  id: string;
}

// Predefined question suggestions based on subjects
const questionSuggestions: Record<string, string[]> = {
  math: [
    "How do I solve quadratic equations?",
    "What is the Pythagorean theorem?",
    "Can you explain calculus in simple terms?",
  ],
  physics: [
    "What is Newton's first law of motion?",
    "How does gravity work?",
    "Explain the concept of relativity.",
  ],
  cs: [
    "What is a binary search algorithm?",
    "How does recursion work in programming?",
    "Explain object-oriented programming with examples.",
  ],
  biology: [
    "What is photosynthesis?",
    "Can you explain DNA replication?",
    "What are the functions of different blood cells?",
  ],
  chemistry: [
    "What is the periodic table?",
    "How do chemical reactions work?",
    "Explain the concept of acids and bases.",
  ],
  literature: [
    "What are the themes in Shakespeare’s works?",
    "Can you summarize 'Pride and Prejudice'?",
    "What makes a poem effective?",
  ],
};

export default function SubjectPage() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setTokens(userDoc.data()?.tokens || 0);
      }
    };
    fetchTokens();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || tokens < 1 || !question.trim()) return;

    const userMessage = { content: question, isAi: false, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const aiResponse = await getGeminiResponse(question, id as string);
      setMessages((prev) => [...prev, { content: aiResponse, isAi: true, id: Date.now().toString() }]);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        tokens: increment(-5),
      });
      setTokens(tokens - 5);
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          content: "Sorry, there was an error processing your request.",
          isAi: true,
          id: Date.now().toString(),
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen  text-black antialiased">
      <ChatHeader id={id as string} tokens={tokens} />

      <main className="pt-16 pb-32">
        <div className="max-w-5xl mx-auto px-4">
          {messages.length === 0 ? (
            <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center">
              <p className="text-gray-600 mb-4">No messages yet. Start by asking a question!</p>
              
              {/* Suggested Questions */}
              {questionSuggestions[id as string] && (
                <div className="bg-gray-200 p-4 rounded-lg shadow-md max-w-md">
                  <h3 className="text-lg font-semibold mb-2">Try asking:</h3>
                  <ul className="space-y-2">
                    {questionSuggestions[id as string].map((suggestion, index) => (
                      <li key={index}>
                        <button
                          onClick={() => setQuestion(suggestion)}
                          className="text-blue-600 hover:underline text-left block w-full"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-300">
              {messages.map((message) => (
                <Message key={message.id} content={message.content} isAi={message.isAi} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput
        question={question}
        setQuestion={setQuestion}
        onSubmit={handleSubmit}
        loading={loading}
        tokens={tokens}
        subjectId={id as string}
      />
    </div>
  );
}
