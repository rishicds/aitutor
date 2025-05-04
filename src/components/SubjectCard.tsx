"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SubjectCard({ subject, index }: { subject: any; index: number }) {
  const [studentsStudying, setStudentsStudying] = useState(0)

  useEffect(() => {
    setStudentsStudying(Math.floor(Math.random() * (24 - 2 + 1)) + 2)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/subject/${subject.id}`}>
        <motion.div
          className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden relative group"
          whileHover={{ scale: 1.05, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full opacity-50 group-hover:scale-150 transition-all duration-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-yellow-500">
              {subject.icon}
            </span>
            <span className="text-sm font-medium text-white bg-pink-500 px-3 py-1 rounded-full">
              {subject.category}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-black mb-3 relative z-10">{subject.name}</h3>
          <p className="text-gray-700 text-lg relative z-10">Explore AI-powered lessons and practice questions</p>
          <p className="text-gray-400 text-sm mt-4 relative z-10">📚 {studentsStudying} students currently studying</p>
        </motion.div>
      </Link>
    </motion.div>
  )
}
