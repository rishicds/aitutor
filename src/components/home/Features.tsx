"use client"

import { motion } from "framer-motion"
import { Brain, FileQuestion, FileUp, Globe, Repeat, CreditCard } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Tutors",
    description: "Expert AI tutors with predefined personas for every subject",
  },
  {
    icon: FileQuestion,
    title: "PYQs with AI Solutions",
    description: "Instant AI explanations for past exam questions",
  },
  { icon: FileUp, title: "Upload PDFs & Images", description: "OCR-powered AI interpretation of your study materials" },
  { icon: Globe, title: "Multilingual AI Support", description: "Seamless learning in multiple languages" },
  { icon: Repeat, title: "Token-Based Access", description: "Affordable and flexible AI interactions" },
  { icon: CreditCard, title: "Secure Payments", description: "Easy token purchase with Razorpay integration" },
]

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gray-800">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out group"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4 group-hover:text-secondary transition-colors duration-300" />
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

