"use client"

import { motion } from "framer-motion"

const steps = [
  {
    number: 1,
    title: "Choose Your Subject & Tutor",
    description: "Select from a wide range of subjects and AI tutors",
  },
  { number: 2, title: "Ask AI Any Question", description: "Get instant help on any topic or problem" },
  {
    number: 3,
    title: "Get Instant, Step-by-Step Solutions",
    description: "Receive detailed explanations and guidance",
  },
  { number: 4, title: "Purchase More Tokens if Needed", description: "Easily buy more tokens to continue learning" },
]

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gray-800">How It Works</h2>
        <div className="flex flex-wrap justify-center">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-64 m-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary opacity-10 rounded-full transform -rotate-6"></div>
                <div className="relative z-10 bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{step.number}</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-800">{step.title}</h3>
              <p className="text-gray-600 text-center">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

