import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Clock, X, User, Bot } from "lucide-react";

interface Message {
  role: string;
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  subject: string;
  course: string;
  examCategory?: string;
  createdAt: Date;
  messages: Message[];
}

export default function ChatHistory() {
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && isOpen) {
      fetchChats();
    }
  }, [user, isOpen]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/chats?userId=${user?.uid}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch chats");
      }

      setChats(data.chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | number | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        aria-label="View chat history"
      >
        <Book size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
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
                  Chat History
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close chat history"
                >
                  <X size={24} />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading chat history...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : chats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No chat history found
                </div>
              ) : (
                <div className="space-y-6">
                  {chats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Clock size={16} />
                        <span>{formatDate(chat.createdAt)}</span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {chat.subject} - {chat.course}
                        {chat.examCategory && ` (${chat.examCategory})`}
                      </h3>
                      <div className="space-y-2">
                        {chat.messages.slice(0, 2).map((message, index) => (
                          <div
                            key={index}
                            className={`flex items-start gap-2 ${
                              message.role === "user"
                                ? "flex-row-reverse"
                                : "flex-row"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === "user"
                                  ? "bg-blue-500"
                                  : "bg-blue-100"
                              }`}
                            >
                              {message.role === "user" ? (
                                <User size={12} className="text-white" />
                              ) : (
                                <Bot size={12} className="text-blue-600" />
                              )}
                            </div>
                            <div
                              className={`p-3 rounded-lg flex-1 ${
                                message.role === "user"
                                  ? "bg-blue-100 ml-4"
                                  : "bg-gray-100 mr-4"
                              }`}
                            >
                              <p className="text-sm text-gray-700">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        ))}
                        {chat.messages.length > 2 && (
                          <p className="text-sm text-gray-500 text-center">
                            +{chat.messages.length - 2} more messages
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
