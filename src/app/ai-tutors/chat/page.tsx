"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { Send, Loader2, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import TokenDisplay from "@/components/TokenDisplay";
import SuggestionChips from "@/components/voice-tutor/SuggestionChips";
import VisualizationPanel from "@/components/voice-tutor/VisualizationPanel";
import ResourcePanel from "@/components/voice-tutor/ResourcePanel";
import KeyPointsPanel from "@/components/voice-tutor/KeyPointsPanel";
import { extractMainContent } from "@/lib/content-parser";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState<"visualizations" | "keypoints" | "resources">("visualizations");
  const [currentTopic, setCurrentTopic] = useState<string>("Welcome");
  const [isMobile, setIsMobile] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [tokens, setTokens] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = useRef<SpeechSynthesisUtterance | null>(null);

  const subject = searchParams.get("subject");
  const course = searchParams.get("course");
  const examCategory = searchParams.get("examCategory");

  // Check if mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Fetch available voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const populateVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        setVoices(allVoices);
        // Set default to best natural voice
        if (!selectedVoice) {
          const preferred = allVoices.find(
            (voice) =>
              voice.lang.startsWith("en") &&
              (voice.name.toLowerCase().includes("natural") ||
                voice.name.toLowerCase().includes("google") ||
                voice.name.toLowerCase().includes("samantha") ||
                voice.name.toLowerCase().includes("aria") ||
                voice.name.toLowerCase().includes("jenny"))
          ) || allVoices.find((voice) => voice.lang.startsWith("en"));
          if (preferred) setSelectedVoice(preferred.name);
        }
      };
      populateVoices();
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  useEffect(() => {
    if (!user || !subject || !course) {
      router.push("/dashboard");
      return;
    }

    const initializeChat = async () => {
      try {
        // Check if chat already exists
        const chatsQuery = query(
          collection(db, "users", user.uid, "chats"),
          where("subject", "==", subject),
          where("course", "==", course)
        );
        const chatsSnapshot = await getDocs(chatsQuery);

        if (chatsSnapshot.empty) {
          // Create new chat if it doesn't exist
          const chatRef = await addDoc(collection(db, "users", user.uid, "chats"), {
            tutorName: `${subject} Tutor`,
            subject,
            course,
            examCategory: examCategory || null,
            messages: [],
            createdAt: serverTimestamp(),
          });

          // Add welcome message
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `Hello! I'm your ${subject} tutor for ${course} level${
              examCategory ? `, specializing in ${examCategory}` : ""
            }. How can I help you today?`,
            timestamp: new Date(),
          };

          setMessages([welcomeMessage]);

          // Update the chat document with the welcome message
          await addDoc(collection(db, "users", user.uid, "chats", chatRef.id, "messages"), {
            ...welcomeMessage,
            timestamp: serverTimestamp(),
          });
        } else {
          // Load existing messages
          const chatDoc = chatsSnapshot.docs[0];
          const messagesQuery = query(
            collection(db, "users", user.uid, "chats", chatDoc.id, "messages"),
            where("timestamp", "!=", null)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          const loadedMessages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            role: doc.data().role,
            content: doc.data().content,
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        alert("Failed to initialize chat. Please try again.");
      }
    };

    initializeChat();
  }, [user, subject, course, examCategory, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak text
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean text for speech (remove markdown formatting)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/#{1,6}\s?(.*?)(?=\n|$)/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`(.*?)`/g, "$1");

    const utterance = new window.SpeechSynthesisUtterance(cleanText);

    // Use selected voice
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing || !user || !subject || !course) return;

    // Cancel any ongoing speech
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Get response from API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          subject,
          course,
          examCategory,
          history: messages.slice(-5),
          userId: user.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save messages to Firestore
      const chatsQuery = query(
        collection(db, "users", user.uid, "chats"),
        where("subject", "==", subject),
        where("course", "==", course)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      
      if (!chatsSnapshot.empty) {
        const chatDoc = chatsSnapshot.docs[0];
        await addDoc(collection(db, "users", user.uid, "chats", chatDoc.id, "messages"), {
          ...userMessage,
          timestamp: serverTimestamp(),
        });
        await addDoc(collection(db, "users", user.uid, "chats", chatDoc.id, "messages"), {
          ...assistantMessage,
          timestamp: serverTimestamp(),
        });
      }

      // Extract topic from the conversation
      setCurrentTopic(extractTopic(input, data.response));

      // Speak the response
      speakText(data.response);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract topic from conversation
  const extractTopic = (userMessage: string, aiResponse: string): string => {
    // Simple extraction - use the first sentence of user message
    const userTopic = userMessage.split(".")[0].trim();
    return userTopic.length > 3 ? userTopic : "General Learning";
  };

  // Find the last assistant message index
  const lastAssistantIdx = messages.map(m => m.role).lastIndexOf("assistant");
  const lastAssistantContent = lastAssistantIdx !== -1 ? extractMainContent(messages[lastAssistantIdx].content) : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {subject?.charAt(0).toUpperCase() + subject?.slice(1)} Tutor
              </h1>
              <p className="text-gray-600">Learn through interactive conversations</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <TokenDisplay tokens={tokens} />
            {voices.length > 0 && (
              <select
                className="mt-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-lavender-500"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                title="Choose voice for speech synthesis"
              >
                {voices
                  .filter((v) => v.lang.startsWith("en"))
                  .map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} {voice.localService ? "(local)" : ""}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Chat Panel */}
          <div
            className={`${isMobile ? "w-full" : "w-1/2"} bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200`}
          >
            <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
              {messages.map((message, idx) => {
                const isAssistant = message.role === "assistant";
                const isLastAssistant = idx === lastAssistantIdx;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-3xl px-5 py-3 shadow-md transition-all duration-200
                        ${message.role === "user"
                          ? "bg-gradient-to-br from-lavender-500 to-lavender-400 text-white self-end"
                          : "bg-white text-gray-900 border border-gray-200 self-start"}
                        ${isAssistant ? "relative" : ""}`}
                    >
                      {isAssistant && isLastAssistant && isProcessing && (
                        <span className="absolute -top-4 left-2 flex items-center gap-1 text-lavender-500 animate-pulse">
                          <Loader2 className="h-4 w-4 animate-spin" /> Speaking...
                        </span>
                      )}
                      {message.role === "user" ? (
                        <p className="whitespace-pre-line">{message.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {isLastAssistant && isProcessing ? "" : extractMainContent(message.content)}
                          </ReactMarkdown>
                        </div>
                      )}
                      {isAssistant && (
                        <button
                          onClick={() => speakText(message.content)}
                          className="mt-2 text-xs flex items-center text-lavender-600 hover:text-lavender-800"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="h-3 w-3 mr-1" />
                              Stop speaking
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3 mr-1" />
                              Listen
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {isProcessing && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length > 1 && !isProcessing && (
              <div className="p-2 border-t border-gray-200">
                <SuggestionChips
                  onSelect={(suggestion) => {
                    setInput(suggestion);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                />
              </div>
            )}

            <div className="border-t border-gray-200 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-4"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lavender-500"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={isProcessing || !input.trim()}
                  className="bg-lavender-500 text-white px-6 py-2 rounded-lg hover:bg-lavender-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Learning Canvas */}
          <div className={`${isMobile ? "hidden" : "w-1/2"} bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200`}>
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("visualizations")}
                  className={`flex-1 py-3 px-4 text-sm font-medium ${
                    activeTab === "visualizations"
                      ? "text-lavender-600 border-b-2 border-lavender-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Visualizations
                </button>
                <button
                  onClick={() => setActiveTab("keypoints")}
                  className={`flex-1 py-3 px-4 text-sm font-medium ${
                    activeTab === "keypoints"
                      ? "text-lavender-600 border-b-2 border-lavender-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Key Points
                </button>
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`flex-1 py-3 px-4 text-sm font-medium ${
                    activeTab === "resources"
                      ? "text-lavender-600 border-b-2 border-lavender-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Resources
                </button>
              </div>
            </div>

            <div className="p-4 h-[50vh] overflow-y-auto">
              {activeTab === "visualizations" && (
                <VisualizationPanel messages={messages} currentTopic={currentTopic} isProcessing={isProcessing} />
              )}

              {activeTab === "keypoints" && <KeyPointsPanel messages={messages} />}

              {activeTab === "resources" && <ResourcePanel messages={messages} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 