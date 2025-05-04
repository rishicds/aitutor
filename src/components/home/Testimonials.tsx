"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Quote } from "lucide-react"

const testimonials = [
  {
    name: "Priya S.",
    role: "JEE Aspirant",
    content:
      "AI Tutor has been a game-changer for my JEE preparation. The instant solutions and explanations are incredibly helpful!",
  },
  {
    name: "Rahul M.",
    role: "NEET Student",
    content:
      "I love how I can ask questions anytime and get expert-level answers. It's like having a personal tutor 24/7.",
  },
  {
    name: "Ananya K.",
    role: "CSE Undergrad",
    content:
      "The AI's ability to explain complex CS concepts is impressive. It's helped me tackle challenging programming problems with ease.",
  },
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gray-800">What Our Students Say</h2>
        <div className="flex flex-wrap justify-center">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-80 m-4 bg-gray-50 rounded-lg shadow-sm overflow-hidden relative"
            >
              <Quote className="absolute top-4 left-4 w-8 h-8 text-primary opacity-20" />
              <div className="p-6 pt-12">
                <p className="text-gray-600 mb-4 italic">&quot;{testimonial.content}&quot;</p>
                <div className="flex items-center">
                  <Image
                    src={`https://i.pravatar.cc/60?img=${index + 1}`}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
