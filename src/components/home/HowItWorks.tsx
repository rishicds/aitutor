import { motion } from "framer-motion"

const steps = [
  { number: 1, title: "Choose Your Subject & Tutor", description: "Select from a wide range of subjects and AI tutors" },
  { number: 2, title: "Ask AI Any Question", description: "Get instant help on any topic or problem" },
  { number: 3, title: "Get Instant, Step-by-Step Solutions", description: "Receive detailed explanations and guidance" },
  { number: 4, title: "Purchase More Tokens if Needed", description: "Easily buy more tokens to continue learning" },
]

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="flex flex-wrap justify-center">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-64 m-4 bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-blue-600 text-white text-center py-4">
                <span className="text-3xl font-bold">Step {step.number}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}