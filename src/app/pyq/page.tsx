"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebaseConfig"
import { collection, query, getDocs, updateDoc, increment, doc, getDoc } from "firebase/firestore"
import { getGeminiResponse } from "@/lib/gemini"

interface PYQ {
  id: string
  question: string
  subject: string
  year: number
  answer?: string
}

export default function PYQPage() {
  const [user] = useAuthState(auth)
  const [pyqs, setPyqs] = useState<PYQ[]>([])
  const [tokens, setTokens] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPYQs = async () => {
      const q = query(collection(db, "pyqs"))
      const querySnapshot = await getDocs(q)
      const fetchedPyqs: PYQ[] = []
      querySnapshot.forEach((doc) => {
        fetchedPyqs.push({ id: doc.id, ...doc.data() } as PYQ)
      })
      setPyqs(fetchedPyqs)
    }

    const fetchTokens = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        setTokens(userDoc.data()?.tokens || 0)
      }
    }

    fetchPYQs()
    fetchTokens()
  }, [user])

  const handleGetAnswer = async (pyq: PYQ) => {
    if (!user || tokens < 1) return

    setLoading(true)
    try {
      const aiResponse = await getGeminiResponse(pyq.question, pyq.subject)

      // Update the PYQ with the AI-generated answer
      const pyqRef = doc(db, "pyqs", pyq.id)
      await updateDoc(pyqRef, { answer: aiResponse })

      // Update local state
      setPyqs(pyqs.map((q) => (q.id === pyq.id ? { ...q, answer: aiResponse } : q)))

      // Deduct a token
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        tokens: increment(-1),
      })
      setTokens(tokens - 1)
    } catch (error) {
      console.error("Error getting AI response:", error)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center neon-glow">Previous Year Questions</h1>
      <div className="mb-4">Available Tokens: {tokens}</div>
      {pyqs.map((pyq) => (
        <div key={pyq.id} className="glassmorphism p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            {pyq.subject} - {pyq.year}
          </h2>
          <p className="mb-2">{pyq.question}</p>
          {pyq.answer ? (
            <div>
              <h3 className="font-semibold">Answer:</h3>
              <p>{pyq.answer}</p>
            </div>
          ) : (
            <button
              onClick={() => handleGetAnswer(pyq)}
              disabled={loading || tokens < 1}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Get AI Answer"}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

