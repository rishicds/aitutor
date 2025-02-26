"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Play } from "lucide-react"

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-300 to-purple-400 text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-display font-bold mb-6"
        >
          Start Your AI-Powered Learning Journey Today!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl mb-8 max-w-2xl mx-auto"
        >
          Join thousands of students who are already benefiting from our AI tutors.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
        >
          <Link
            href="/signup"
            className="bg-white text-black hover:bg-gray-100 font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/demo"
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          >
            See AI Tutors in Action
            <Play className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

