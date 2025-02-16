import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SubjectCard({ subject, index }) {
  const [studentsStudying, setStudentsStudying] = useState(0);

  // Generate a random student count between 2 and 24 when the component mounts
  useEffect(() => {
    setStudentsStudying(Math.floor(Math.random() * (24 - 2 + 1)) + 2);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/subject/${subject.id}`}>
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <span className="text-4xl">{subject.icon}</span>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {subject.category}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{subject.name}</h3>
          <p className="text-gray-600 text-sm">
            Explore AI-powered lessons and practice questions
          </p>
          {/* Display students currently studying */}
          <p className="text-gray-500 text-xs mt-3">
            📚 {studentsStudying} students currently studying
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
