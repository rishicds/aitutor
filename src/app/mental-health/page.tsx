"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { Loader2, Send, Heart } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function MentalHealthPage() {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Add initial welcome message
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm Aabhaya, your AI mental health companion. I'm here to listen and support you. How are you feeling today?",
      },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch("/api/mental-health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      const data = await response.json();

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-8 text-lavender-700">
          Mental Health Support
        </h1>
        <div className="bg-white/80 backdrop-blur-md border border-lavender-200 p-10 rounded-lg shadow-lg max-w-md mx-auto">
          <p className="text-lg mb-4">
            Please log in to access mental health support.
          </p>
          <button
            onClick={() => (window.location.href = "/signin")}
            className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white/80 backdrop-blur-md border border-lavender-200 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-lavender-600 text-white p-4 flex items-center">
          <Heart className="mr-2" />
          <h1 className="text-xl font-semibold">
            Aabhaya - Your Mental Health Companion
          </h1>
        </div>

        {/* Chat Messages */}
        <div className="h-[600px] overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-lavender-600 text-white"
                    : "bg-lavender-100 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-lavender-100 rounded-lg p-3">
                <Loader2 className="animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-lavender-200"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-lavender-200 rounded-lg focus:ring-lavender-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-lavender-600 text-white px-4 py-2 rounded-lg hover:bg-lavender-700 transition duration-300 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Emergency Resources */}
      <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-red-700 mb-2">
          Emergency Resources
        </h2>
        <p className="text-red-600 mb-4">
          If you're experiencing a mental health emergency, please contact these
          resources immediately:
        </p>
        <ul className="space-y-2">
          <li className="text-red-600">
            National Crisis Hotline:{" "}
            <a href="tel:988" className="underline">
              988
            </a>
          </li>
          <li className="text-red-600">
            Crisis Text Line: Text HOME to{" "}
            <a href="sms:741741" className="underline">
              741741
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
