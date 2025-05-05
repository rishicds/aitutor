"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/shared/SearchBar";
import TokenDisplay from "@/components/TokenDisplay";
import SubjectCard from "@/components/SubjectCard";
import { auth, db } from "@/lib/firebaseConfig";
import { Coins, Book, Filter, Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TutorCard from "@/components/TutorCard";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

const subjects = [
  // JEE subjects
  { id: "jee-math", name: "JEE Mathematics", icon: "🧮", category: "JEE" },
  { id: "jee-physics", name: "JEE Physics", icon: "⚛️", category: "JEE" },
  { id: "jee-chemistry", name: "JEE Chemistry", icon: "🧪", category: "JEE" },

  // NEET subjects
  { id: "neet-biology", name: "NEET Biology", icon: "🧬", category: "NEET" },
  { id: "neet-physics", name: "NEET Physics", icon: "⚛️", category: "NEET" },
  {
    id: "neet-chemistry",
    name: "NEET Chemistry",
    icon: "🧪",
    category: "NEET",
  },

  // BTech CSE subjects
  {
    id: "cse-programming",
    name: "Programming",
    icon: "💻",
    category: "BTech CSE",
  },
  {
    id: "cse-data-structures",
    name: "Data Structures",
    icon: "🌳",
    category: "BTech CSE",
  },
  {
    id: "cse-algorithms",
    name: "Algorithms",
    icon: "🧠",
    category: "BTech CSE",
  },
  { id: "cse-databases", name: "Databases", icon: "🗄️", category: "BTech CSE" },
  {
    id: "cse-networking",
    name: "Computer Networks",
    icon: "🌐",
    category: "BTech CSE",
  },
  {
    id: "cse-os",
    name: "Operating Systems",
    icon: "💽",
    category: "BTech CSE",
  },

  // Additional subjects
  { id: "english", name: "English", icon: "📚", category: "General" },
  { id: "history", name: "History", icon: "🏛️", category: "General" },
  { id: "geography", name: "Geography", icon: "🌍", category: "General" },
];

// Available subjects for custom tutor
const availableSubjects = [
  { value: "mathematics", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "computer-science", label: "Computer Science" },
  { value: "english", label: "English" },
];

// Available course levels
const courseLevels = [
  { value: "high-school", label: "High School" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "professional", label: "Professional" },
];

// Available exam categories
const examCategories = [
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "gate", label: "GATE" },
  { value: "upsc", label: "UPSC" },
  { value: "other", label: "Other" },
];

interface Tutor {
  id: string;
  name: string;
  subject: string;
  course: string;
  examCategory?: string;
  lastChatDate?: Date;
  messageCount: number;
  lastMessage: string;
}

export default function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [tokens, setTokens] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    course: "",
    examCategory: "",
  });
  const [formError, setFormError] = useState("");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchTutors();
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setTokens(userDocSnap.data().tokens || 0);
        }
      }
    };
    fetchTokens();
  }, [user]);

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "All" || subject.category === selectedCategory)
  );

  const categories = ["All", "JEE", "NEET", "BTech CSE", "General"];

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError(""); // Clear any previous errors
  };

  const handleCreateTutor = () => {
    if (!formData.subject || !formData.course) {
      setFormError("Please fill in all required fields");
      return;
    }

    // Basic validation for subject-exam combinations
    const subject = formData.subject.toLowerCase();
    const examCategory = formData.examCategory.toLowerCase();

    if (examCategory === "neet" && subject === "english") {
      setFormError("English is not a subject in NEET examination");
      return;
    }

    if (examCategory === "jee" && subject === "biology") {
      setFormError("Biology is not a subject in JEE examination");
      return;
    }

    const queryParams = new URLSearchParams({
      subject: formData.subject,
      course: formData.course,
      ...(formData.examCategory && { examCategory: formData.examCategory }),
    }).toString();

    router.push(`/ai-tutors/chat?${queryParams}`);
  };

  const fetchTutors = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log("Fetching tutors for user:", user.uid);

      // Get all chats
      const chatsQuery = query(
        collection(db, "users", user.uid, "chats"),
        orderBy("createdAt", "desc")
      );
      const chatsSnapshot = await getDocs(chatsQuery);

      // Group chats by subject and course
      const tutorChats = new Map();

      chatsSnapshot.docs.forEach((doc) => {
        const chatData = doc.data();
        const key = `${chatData.subject}-${chatData.course}`;

        if (!tutorChats.has(key)) {
          tutorChats.set(key, {
            chats: [chatData],
            lastChatDate: chatData.createdAt?.toDate(),
            messageCount: chatData.messages?.length || 0,
            name: chatData.tutorName || `${chatData.subject} Tutor`,
          });
        } else {
          const tutor = tutorChats.get(key);
          tutor.chats.push(chatData);
          tutor.messageCount += chatData.messages?.length || 0;
          if (chatData.createdAt?.toDate() > tutor.lastChatDate) {
            tutor.lastChatDate = chatData.createdAt?.toDate();
          }
        }
      });

      // Convert to tutor objects
      const tutorsData = Array.from(tutorChats.entries()).map(([key, data]) => {
        const [subject, course] = key.split("-");
        return {
          id: key,
          name: data.name,
          subject,
          course,
          examCategory: data.chats[0].examCategory || null,
          lastChatDate: data.lastChatDate,
          messageCount: data.messageCount,
          lastMessage:
            data.chats[0].messages?.[data.chats[0].messages.length - 1]
              ?.content || "No messages yet",
        };
      });

      console.log("Fetched tutors with chat history:", tutorsData);
      setTutors(tutorsData);
    } catch (error) {
      console.error("Error fetching tutors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            AI Tutor Dashboard
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Personalized learning powered by artificial intelligence
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <TokenDisplay tokens={tokens} />
          <div className="flex gap-4">
            <Link href="/purchase">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md"
              >
                <Coins size={20} />
                Purchase Tokens
              </motion.button>
            </Link>
            <Link href="/pyq">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-md"
              >
                <Book size={20} />
                Previous Year Questions
              </motion.button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12"
        >
          {/* Predefined Subject Cards */}
          {filteredSubjects.map((subject, index) => (
            <SubjectCard key={subject.id} subject={subject} index={index} />
          ))}

          {/* Custom Tutors */}
          {tutors.map((tutor) => (
            <TutorCard key={tutor.id} {...tutor} />
          ))}

          {/* Create New Tutor Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex items-center justify-center p-6"
          >
            <Link
              href="/ai-tutors/create"
              className="flex flex-col items-center text-center text-gray-700 hover:text-blue-600"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create New Tutor</h3>
              <p className="text-gray-600 text-sm">
                Customize an AI tutor for your learning needs
              </p>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Create Your AI Tutor
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Enter subject (e.g., Mathematics, Physics)"
                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
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
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    placeholder="Enter course level (e.g., High School, Undergraduate)"
                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    name="examCategory"
                    value={formData.examCategory}
                    onChange={handleInputChange}
                    placeholder="Enter exam category (e.g., JEE, NEET, GATE)"
                    className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formError && (
                  <div className="text-red-500 text-sm mt-2">{formError}</div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateTutor}
                  disabled={!formData.subject || !formData.course}
                  className={`w-full py-3 px-6 rounded-xl text-white font-medium ${
                    !formData.subject || !formData.course
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  Let's Create
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
