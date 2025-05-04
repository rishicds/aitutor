"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"
import Link from "next/link"
import SearchBar from "@/components/shared/SearchBar"
import TokenDisplay from "@/components/TokenDisplay"
import SubjectCard from "@/components/SubjectCard"
import { auth, db } from "@/lib/firebaseConfig"
import { Coins, Book, Filter, Plus, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const subjects = [
  // JEE subjects
  { id: "jee-math", name: "JEE Mathematics", icon: "🧮", category: "JEE" },
  { id: "jee-physics", name: "JEE Physics", icon: "⚛️", category: "JEE" },
  { id: "jee-chemistry", name: "JEE Chemistry", icon: "🧪", category: "JEE" },

  // NEET subjects
  { id: "neet-biology", name: "NEET Biology", icon: "🧬", category: "NEET" },
  { id: "neet-physics", name: "NEET Physics", icon: "⚛️", category: "NEET" },
  { id: "neet-chemistry", name: "NEET Chemistry", icon: "🧪", category: "NEET" },

  // BTech CSE subjects
  { id: "cse-programming", name: "Programming", icon: "💻", category: "BTech CSE" },
  { id: "cse-data-structures", name: "Data Structures", icon: "🌳", category: "BTech CSE" },
  { id: "cse-algorithms", name: "Algorithms", icon: "🧠", category: "BTech CSE" },
  { id: "cse-databases", name: "Databases", icon: "🗄️", category: "BTech CSE" },
  { id: "cse-networking", name: "Computer Networks", icon: "🌐", category: "BTech CSE" },
  { id: "cse-os", name: "Operating Systems", icon: "💽", category: "BTech CSE" },

  // Additional subjects
  { id: "english", name: "English", icon: "📚", category: "General" },
  { id: "history", name: "History", icon: "🏛️", category: "General" },
  { id: "geography", name: "Geography", icon: "🌍", category: "General" },
]

export default function Dashboard() {
  const [user] = useAuthState(auth)
  const [tokens, setTokens] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)
        if (userDocSnap.exists()) {
          setTokens(userDocSnap.data().tokens || 0)
        }
      }
    }
    fetchTokens()
  }, [user])

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "All" || subject.category === selectedCategory),
  )

  const categories = ["All", "JEE", "NEET", "BTech CSE", "General"]

  const openModal = () => {
    setIsModalOpen(true)
    // Prevent scrolling when modal is open
    document.body.style.overflow = "hidden"
  }

  const closeModal = () => {
    setIsModalOpen(false)
    // Re-enable scrolling
    document.body.style.overflow = "auto"
  }

  // Create Your Own Tutor Card Component
  const CreateYourOwnTutorCard = () => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 shadow-xl cursor-pointer text-white flex flex-col items-center justify-center min-h-[220px]"
      onClick={openModal}
    >
      <div className="bg-white/20 p-4 rounded-full mb-4">
        <Plus size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2">Create Your Own Tutor</h3>
      <p className="text-white/80 text-center">Customize a tutor for your specific learning needs</p>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">AI Tutor Dashboard</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Personalized learning powered by artificial intelligence</p>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <TokenDisplay tokens={tokens} />
          <div className="flex gap-4">
            <Link href="/purchase">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md"
              >
                <Coins size={20} />
                Purchase Tokens
              </motion.button>
            </Link>
            <Link href="/pyq">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-md"
              >
                <Book size={20} />
                Previous Year Questions
              </motion.button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12"
        >
          {filteredSubjects.map((subject, index) => (
            <SubjectCard key={subject.id} subject={subject} index={index} />
          ))}

          {/* Create Your Own Tutor Card */}
          <CreateYourOwnTutorCard />
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
