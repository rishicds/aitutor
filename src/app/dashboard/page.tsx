"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import SearchBar from "@/components/shared/SearchBar"
import TokenDisplay from "@/components/TokenDisplay"
import SubjectCard from "@/components/SubjectCard"
import {auth, db} from "@/lib/firebaseConfig"

const subjects = [
  { id: "math", name: "Mathematics", icon: "🧮" },
  { id: "physics", name: "Physics", icon: "⚛️" },
  { id: "cs", name: "Computer Science", icon: "💻" },
  { id: "biology", name: "Biology", icon: "🧬" },
  { id: "chemistry", name: "Chemistry", icon: "🧪" },
  { id: "literature", name: "Literature", icon: "📚" },
]

export default function Dashboard() {
  const [user] = useAuthState(auth)
  const [tokens, setTokens] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        // Directly fetch the document using the user's UID as the document ID
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)
        
        if (userDocSnap.exists()) {
          setTokens(userDocSnap.data().tokens || 0)
        }
      }
    }
    fetchTokens()
  }, [user])

  const filteredSubjects = subjects.filter((subject) => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center neon-glow">AI Tutor Dashboard</h1>
      <div className="flex justify-between items-center mb-8">
        <TokenDisplay tokens={tokens} />
        <div>
          <Link
            href="/purchase"
            className="bg-accent text-accent-foreground px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300 mr-4"
          >
            Purchase Tokens
          </Link>
          <Link
            href="/pyq"
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-opacity-80 transition duration-300"
          >
            Previous Year Questions
          </Link>
        </div>
      </div>
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {filteredSubjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  )
}