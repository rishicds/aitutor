"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { getGeminiResponse } from "@/lib/gemini"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SparklesIcon, SendIcon } from "lucide-react"

export default function SubjectPage() {
  const { id } = useParams()
  const [user] = useAuthState(auth)
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState("")
  const [tokens, setTokens] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        setTokens(userDoc.data()?.tokens || 0)
      }
    }
    fetchTokens()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || tokens < 1) return 

    setLoading(true)
    try {
      const aiResponse = await getGeminiResponse(question, id as string)
      setResponse(aiResponse)

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        tokens: increment(-5),
      })
      setTokens(tokens - 5)
    } catch (error) {
      console.error("Error getting AI response:", error)
      setResponse("Sorry, there was an error processing your request.")
    }
    setLoading(false)
  }

  return (
    <div className="bg-black min-h-screen text-white antialiased">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 flex items-center justify-between">
            <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
              {id} Tutor
            </h1>
            <div className="text-lg font-semibold bg-black/30 px-4 py-2 rounded-full">
              Tokens: {tokens}
            </div>
          </div>

          {/* Question Input */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`What would you like to learn about ${id}?`}
              className="w-full bg-black/40 border border-gray-700 rounded-2xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 transition duration-300 resize-none"
              rows={5}
              style={{ boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)' }}
            />
            <div className="flex justify-end items-center space-x-4">
              <button
                type="submit"
                disabled={loading || tokens < 1}
                className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full hover:from-purple-700 hover:to-blue-700 transition duration-300 disabled:opacity-50 group"
              >
                {loading ? (
                  <SparklesIcon className="animate-pulse mr-2" />
                ) : (
                  <SendIcon className="mr-2 group-hover:rotate-6 transition" />
                )}
                {loading ? "Thinking..." : "Ask AI"}
              </button>
            </div>
          </form>

          {/* Response Area */}
          {response && (
            <div className="p-6 bg-[#0a0a0a] border-t border-gray-800">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                className="prose prose-invert max-w-none prose-headings:text-purple-400 prose-a:text-blue-400 prose-code:text-pink-500 selection:bg-purple-500/50"
              >
                {response}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}