import Link from "next/link"
import { motion } from "framer-motion"

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-200 opacity-50"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center"
      >
        <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Your AI Tutor, Anytime, Anywhere
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          AI-powered learning for JEE, NEET, CSE, & Electrical students with expert-level answers, instant solutions, and an interactive experience.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
            Start Learning Free
          </Link>
          <Link href="/tutors" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
            Explore AI Tutors
          </Link>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-0 right-0 w-1/3 h-1/3"
      >
        {/* Add a 3D or animated AI tutor illustration here */}
      </motion.div>
    </section>
  )
}