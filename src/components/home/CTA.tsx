import Link from "next/link"
import { motion } from "framer-motion"

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold mb-6"
        >
          Start Your AI-Powered Learning Journey Today!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl mb-8"
        >
          Join thousands of students who are already benefiting from our AI tutors.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center space-x-4"
        >
          <Link href="/signup" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
            Get Started Free
          </Link>
          <Link href="/demo" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105">
            See AI Tutors in Action
          </Link>
        </motion.div>
      </div>
    </section>
  )
}