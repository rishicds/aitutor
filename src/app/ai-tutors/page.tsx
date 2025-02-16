"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useState } from "react";

// Function to convert subject names into URL-friendly slugs
const formatSubjectSlug = (subject: string) => {
  return subject.toLowerCase().replace(/\s+/g, "-"); // Convert spaces to dashes
};

// AI Tutors categorized by subject type
const tutors = [
  // 🔵 JEE Tutors
  { id: 1, name: "Dr. Anil Sharma", subject: "Mathematics", category: "JEE", description: "Expert in calculus, algebra, and trigonometry" },
  { id: 2, name: "Dr. Neha Kapoor", subject: "Physics", category: "JEE", description: "Specialist in mechanics, optics, and thermodynamics" },
  { id: 3, name: "Prof. Rajesh Verma", subject: "Chemistry", category: "JEE", description: "In-depth knowledge of organic, inorganic & physical chemistry" },

  // 🟢 NEET Tutors
  { id: 4, name: "Dr. Priya Nair", subject: "Biology", category: "NEET", description: "Expert in human anatomy, botany, and zoology" },
  { id: 5, name: "Dr. Rakesh Iyer", subject: "Physics", category: "NEET", description: "Specializes in electromagnetism & nuclear physics" },
  { id: 6, name: "Dr. Kavita Bose", subject: "Chemistry", category: "NEET", description: "Focus on chemical bonding & reaction mechanisms" },

  // 🖥️ CSE Tutors
  { id: 7, name: "Prof. Sarah Mitchell", subject: "Applied Cryptography", category: "CSE", description: "Expert in cryptographic protocols & security algorithms" },
  { id: 8, name: "Dr. David Kumar", subject: "Data Analytics", category: "CSE", description: "Specialist in statistical analysis and visualization" },
  { id: 9, name: "Alex Chen", subject: "Machine Learning", category: "CSE", description: "Focused on deep learning and neural networks" },
  { id: 10, name: "Dr. Emma Rodriguez", subject: "Algorithms", category: "CSE", description: "Expert in algorithmic complexity and optimization" },
];

// Available Categories
const categories = ["All", "JEE", "NEET", "CSE"];

export default function AITutors() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Filter tutors based on category selection
  const filteredTutors = selectedCategory === "All" ? tutors : tutors.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-screen text-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 🔹 Page Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Meet Your AI Tutors</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Learn from specialized AI tutors, each trained in their respective fields.</p>
        </motion.div>

        {/* 🔹 Category Filters */}
        <div className="flex justify-center mb-8 space-x-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedCategory === category ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 🔹 Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* AI Tutor Cards */}
          {filteredTutors.map((tutor, index) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-200 rounded-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="relative h-64 w-full">
                <Image src={`https://i.pravatar.cc/720?img=${tutor.id}`} alt={tutor.name} fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{tutor.subject}</h3>
                <div className="mb-4">
                  <span className="inline-block bg-green-900 text-green-400 text-xs font-semibold px-2.5 py-1 rounded">{tutor.category}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{tutor.description}</p>
                <Link
                  href={`/subject/${formatSubjectSlug(tutor.subject)}`}
                  className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  <span>Start Learning</span>
                  <Sparkles className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}

          {/* 🟢 Create Your Own Tutor Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredTutors.length * 0.1 }}
            className="bg-gray-300 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 flex items-center justify-center"
          >
            <Link href="/create-tutor" className="flex flex-col items-center py-12 px-8 text-center text-gray-700 hover:text-blue-600">
              <span className="text-5xl mb-4">➕</span>
              <h3 className="text-lg font-semibold">Create Your Own Tutor</h3>
              <p className="text-gray-600 text-sm">Customize an AI tutor for your learning needs</p>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
