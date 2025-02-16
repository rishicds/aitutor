import { motion } from "framer-motion"

const plans = [
  { name: "Free", tokens: 10, price: "₹0", features: ["Limited AI interactions", "Basic subjects coverage", "24/7 AI support"] },
  { name: "Standard", tokens: 50, price: "₹499", features: ["50 AI interactions", "All subjects covered", "24/7 AI support", "PDF upload (limited)"] },
  { name: "Pro", tokens: "Unlimited", price: "₹1999/month", features: ["Unlimited AI interactions", "All subjects covered", "24/7 AI support", "Unlimited PDF uploads", "Priority response"] },
]

export default function Pricing() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="flex flex-wrap justify-center">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-80 m-4 bg-gray-50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out"
            >
              <div className="bg-blue-600 text-white text-center py-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-4xl font-bold mt-2">{plan.price}</p>
              </div>
              <div className="p-6">
                <p className="text-xl font-semibold mb-4">{plan.tokens} Tokens</p>
                <ul className="mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center mb-2">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out">
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