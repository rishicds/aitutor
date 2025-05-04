"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { auth, db } from "@/lib/firebaseConfig"
import { motion } from "framer-motion"
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

import { getGeminiVoiceResponse } from "@/lib/gemini-voice"
import TokenDisplay from "@/components/TokenDisplay"
import SuggestionChips from "@/components/voice-tutor/SuggestionChips"
import VisualizationPanel from "@/components/voice-tutor/VisualizationPanel"
import ResourcePanel from "@/components/voice-tutor/ResourcePanel"
import KeyPointsPanel from "@/components/voice-tutor/KeyPointsPanel"
import { extractMainContent } from "@/lib/content-parser"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Typewriter effect hook
function useTypewriter(text: string, isActive: boolean) {
  const [displayed, setDisplayed] = useState("")
  useEffect(() => {
    if (!isActive) {
      setDisplayed(text)
      return
    }
    setDisplayed("")
    let i = 0
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i])
      i++
      if (i >= text.length) clearInterval(interval)
    }, 12)
    return () => clearInterval(interval)
  }, [text, isActive])
  return displayed
}

// Add this before the component to fix the linter error for window.SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function VoiceTutor() {
  const [user] = useAuthState(auth)
  const [tokens, setTokens] = useState(0)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI voice tutor. What would you like to learn about today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeTab, setActiveTab] = useState<"visualizations" | "keypoints" | "resources">("visualizations")
  const [currentTopic, setCurrentTopic] = useState<string>("Welcome")
  const [isMobile, setIsMobile] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechRecognition = useRef<any>(null)
  const speechSynthesis = useRef<SpeechSynthesisUtterance | null>(null)

  // Check if mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  // Fetch user tokens
  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            setTokens(userDoc.data().tokens || 0)
          }
        } catch (error) {
          console.error("Error fetching tokens:", error)
        }
      }
    }

    fetchTokens()
  }, [user])

  // Fetch available voices on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const populateVoices = () => {
        const allVoices = window.speechSynthesis.getVoices()
        setVoices(allVoices)
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
          ) || allVoices.find((voice) => voice.lang.startsWith("en"))
          if (preferred) setSelectedVoice(preferred.name)
        }
      }
      populateVoices()
      window.speechSynthesis.onvoiceschanged = populateVoices
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        speechRecognition.current = new SpeechRecognition()
        speechRecognition.current.continuous = true
        speechRecognition.current.interimResults = true
        speechRecognition.current.lang = "en-US"

        speechRecognition.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join("")

          setInput(transcript)
        }

        speechRecognition.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop()
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Toggle voice recognition
  const toggleListening = () => {
    if (!speechRecognition.current) return

    if (isListening) {
      speechRecognition.current.stop()
      setIsListening(false)
      if (input.trim()) {
        handleSendMessage()
      }
    } else {
      setInput("")
      speechRecognition.current.start()
      setIsListening(true)
    }
  }

  // Speak text
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return

    // Cancel any ongoing speech
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    // Clean text for speech (remove markdown formatting)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/#{1,6}\s?(.*?)(?=\n|$)/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`(.*?)`/g, "$1")

    const utterance = new window.SpeechSynthesisUtterance(cleanText)

    // Use selected voice
    const voice = voices.find((v) => v.name === selectedVoice)
    if (voice) utterance.voice = voice

    utterance.rate = 1.0
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return
    if (!user) {
      alert("Please sign in to use the AI Voice Tutor")
      return
    }
    if (tokens < 5) {
      alert("You need at least 5 tokens to use the AI Voice Tutor")
      return
    }

    // Cancel any ongoing speech
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)

    try {
      // Get response from Gemini API
      const response = await getGeminiVoiceResponse(input, messages.slice(-5))

      if (response) {
        // Add assistant message
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.text,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Extract topic from the conversation
        setCurrentTopic(extractTopic(input, response.text))

        // Deduct tokens
        const userRef = doc(db, "users", user.uid)
        await updateDoc(userRef, {
          tokens: increment(-5),
        })
        setTokens((prev) => prev - 5)

        // Speak the response
        speakText(response.text)
      }
    } catch (error) {
      console.error("Error processing message:", error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  // Extract topic from conversation
  const extractTopic = (userMessage: string, aiResponse: string): string => {
    // Simple extraction - use the first sentence of user message
    const userTopic = userMessage.split(".")[0].trim()
    return userTopic.length > 3 ? userTopic : "General Learning"
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  // Find the last assistant message index
  const lastAssistantIdx = messages.map(m => m.role).lastIndexOf("assistant");
  const lastAssistantContent = lastAssistantIdx !== -1 ? extractMainContent(messages[lastAssistantIdx].content) : "";
  const typewriterText = useTypewriter(lastAssistantContent, isProcessing);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">AI Voice Tutor</h1>
            <p className="text-gray-600">Learn through interactive voice conversations</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <TokenDisplay tokens={tokens} />
            {voices.length > 0 && (
              <select
                className="mt-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-lavender-500"
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                title="Choose voice for speech synthesis"
              >
                {voices.filter(v => v.lang.startsWith("en")).map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} {voice.localService ? "(local)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-6`}>
          {/* Chat Panel */}
          <div
            className={`${isMobile ? "w-full" : "w-1/2"} bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200`}
          >
            <div className="h-[60vh] overflow-y-auto p-4 space-y-4">
              {messages.map((message, idx) => {
                const isAssistant = message.role === "assistant"
                const isLastAssistant = idx === lastAssistantIdx
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
                            {isLastAssistant && isProcessing ? typewriterText : extractMainContent(message.content)}
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
                )
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
                    setInput(suggestion)
                    setTimeout(() => handleSendMessage(), 100)
                  }}
                />
              </div>
            )}

            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lavender-500"
                  disabled={isProcessing || isListening}
                />

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-full ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-lavender-100 text-lavender-600 hover:bg-lavender-200"
                  }`}
                  disabled={isProcessing}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <button
                  type="submit"
                  className="p-2 bg-lavender-500 text-white rounded-full hover:bg-lavender-600 disabled:opacity-50"
                  disabled={!input.trim() || isProcessing}
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>

          {/* Learning Canvas */}
          <div
            className={`${isMobile ? "w-full" : "w-1/2"} bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200`}
          >
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-lavender-500" />
                {currentTopic}
              </h2>

              <div className="flex mt-4 border-b">
                <button
                  onClick={() => setActiveTab("visualizations")}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "visualizations"
                      ? "border-b-2 border-lavender-500 text-lavender-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Visualizations
                </button>
                <button
                  onClick={() => setActiveTab("keypoints")}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "keypoints"
                      ? "border-b-2 border-lavender-500 text-lavender-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Key Points
                </button>
                <button
                  onClick={() => setActiveTab("resources")}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === "resources"
                      ? "border-b-2 border-lavender-500 text-lavender-700"
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
  )
}
