"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    tokens: 10,
    price: "₹0",
    features: ["Limited AI interactions", "Basic subjects coverage", "24/7 AI support"],
  },
  {
    name: "Standard",
    tokens: 50,
    price: "₹499",
    features: ["50 AI interactions", "All subjects covered", "24/7 AI support", "PDF upload (limited)"],
  },
  {
    name: "Pro",
    tokens: "Unlimited",
    price: "₹1999/month",
    features: [
      "Unlimited AI interactions",
      "All subjects covered",
      "24/7 AI support",
      "Unlimited PDF uploads",
      "Priority response",
    ],
  },
]

export default function Pricing() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-display font-bold text-center mb-12 text-gray-800">Choose Your Plan</h2>
        <div className="flex flex-wrap justify-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-80 m-4 bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ease-in-out"
            >
              <div className="bg-primary bg-opacity-10 text-primary text-center py-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-4xl font-bold mt-2">{plan.price}</p>
              </div>
              <div className="p-6">
                <p className="text-xl font-semibold mb-4 text-gray-800">{plan.tokens} Tokens</p>
                <ul className="mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center mb-2">
                      <Check className="w-5 h-5 mr-2 text-secondary" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50">
                  Choose Plan
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
