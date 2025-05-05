"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { motion } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Fallback subject validation
const commonSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Political Science",
  "Psychology",
  "Sociology",
  "Environmental Science",
  "Statistics",
  "Philosophy",
  "Art",
  "Music",
  "Physical Education",
  "Business Studies",
  "Law",
  "Engineering",
  "Medicine",
  "Architecture",
  "Agriculture",
  "Astronomy",
  "Geology",
  "Meteorology",
  "Oceanography",
  "Anthropology",
  "Archaeology",
  "Linguistics",
  "Literature",
  "Drama",
  "Dance",
  "Film Studies",
  "Media Studies",
  "Journalism",
  "Public Relations",
  "Marketing",
  "Finance",
  "Accounting",
  "Management",
  "Information Technology",
  "Robotics",
  "Artificial Intelligence",
  "Data Science",
  "Cybersecurity",
  "Web Development",
  "Mobile Development",
  "Game Development",
  "Digital Arts",
];

export default function CreateTutorPage() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [course, setCourse] = useState("");
  const [examCategory, setExamCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateSubject = async (input: string) => {
    if (!input.trim()) {
      setSubjectSuggestions([]);
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: input,
          course: course || "general",
          userId: user?.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If API validation fails, use fallback validation
        const normalizedInput = input.toLowerCase();
        const suggestions = commonSubjects.filter(
          (subject) =>
            subject.toLowerCase().includes(normalizedInput) ||
            normalizedInput.includes(subject.toLowerCase())
        );

        if (suggestions.length > 0) {
          setSubjectSuggestions(suggestions);
          setError(`Did you mean one of these subjects?`);
        } else {
          setError(
            "This doesn't appear to be a valid academic subject. Please enter a standard educational subject."
          );
        }
      } else {
        setSubjectSuggestions([]);
        setError("");
      }
    } catch (error) {
      console.error("Error validating subject:", error);
      // Use fallback validation on error
      const normalizedInput = input.toLowerCase();
      const suggestions = commonSubjects.filter(
        (subject) =>
          subject.toLowerCase().includes(normalizedInput) ||
          normalizedInput.includes(subject.toLowerCase())
      );

      if (suggestions.length > 0) {
        setSubjectSuggestions(suggestions);
        setError(`Did you mean one of these subjects?`);
      } else {
        setError(
          "This doesn't appear to be a valid academic subject. Please enter a standard educational subject."
        );
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubjectChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setSubject(value);
    setError("");

    // Debounce the validation
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        validateSubject(value);
      } else {
        setSubjectSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      // Basic validation
      if (!subject.trim()) {
        setError("Please enter a subject");
        setIsLoading(false);
        return;
      }

      // Create tutor document
      const tutorRef = await addDoc(
        collection(db, "users", user.uid, "tutors"),
        {
          name: name || `${subject} Tutor`,
          subject,
          course,
          examCategory: examCategory || null,
          createdAt: serverTimestamp(),
        }
      );

      // Also store the tutor name in the chat collection for reference
      await addDoc(collection(db, "users", user.uid, "chats"), {
        tutorName: name || `${subject} Tutor`,
        subject,
        course,
        examCategory: examCategory || null,
        messages: [],
        createdAt: serverTimestamp(),
      });

      console.log("Created tutor:", { name, subject, course, examCategory });

      // Redirect to chat with the new tutor
      const queryParams = new URLSearchParams({
        subject: subject,
        course: course,
        ...(examCategory && { examCategory: examCategory }),
      }).toString();

      router.push(`/ai-tutors/chat?${queryParams}`);
    } catch (error) {
      console.error("Error creating tutor:", error);
      setError("Failed to create tutor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            Create Your AI Tutor
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tutor Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Give your tutor a name"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subject
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={handleSubjectChange}
                    placeholder="Enter a subject (e.g., Physics, Mathematics)"
                    className={`w-full bg-white border ${
                      error ? "border-red-500" : "border-gray-300"
                    } rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  {isValidating && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                {subjectSuggestions.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">Did you mean:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {subjectSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setSubject(suggestion);
                            setSubjectSuggestions([]);
                            setError("");
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>

              <div>
                <label
                  htmlFor="course"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Course Level
                </label>
                <input
                  type="text"
                  id="course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g., High School, College, University"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="examCategory"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Exam Category (Optional)
                </label>
                <input
                  type="text"
                  id="examCategory"
                  value={examCategory}
                  onChange={(e) => setExamCategory(e.target.value)}
                  placeholder="e.g., JEE, NEET, GATE"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || isValidating || !!error}
                className={`w-full py-3 px-6 rounded-xl text-white font-medium ${
                  isLoading || isValidating || !!error
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isLoading ? "Creating..." : "Create Tutor"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
