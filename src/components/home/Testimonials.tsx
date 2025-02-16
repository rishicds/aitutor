import { motion } from "framer-motion"
import Image from "next/image"

const testimonials = [
  { name: "Priya S.", role: "JEE Aspirant", content: "AI Tutor has been a game-changer for my JEE preparation. The instant solutions and explanations are incredibly helpful!" },
  { name: "Rahul M.", role: "NEET Student", content: "I love how I can ask questions anytime and get expert-level answers. It's like having a personal tutor 24/7." },
  { name: "Ananya K.", role: "CSE Undergrad", content: "The AI's ability to explain complex CS concepts is impressive. It's helped me tackle challenging programming problems with ease." },
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">What Our Students Say</h2>
        <div className="flex flex-wrap justify-center">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-80 m-4 bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <Image
                    src={`https://i.pravatar.cc/60?img=${index + 1}`}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
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