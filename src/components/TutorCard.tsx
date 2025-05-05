import { motion } from "framer-motion";
import { MessageSquare, Book, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface TutorCardProps {
  id: string;
  name: string;
  subject: string;
  course: string;
  examCategory?: string;
  lastChatDate?: Date;
  messageCount: number;
  lastMessage: string;
}

export default function TutorCard({
  id,
  name,
  subject,
  course,
  examCategory,
  lastChatDate,
  messageCount,
  lastMessage,
}: TutorCardProps) {
  const router = useRouter();

  const formatDate = (date?: Date) => {
    if (!date) return "No chats yet";
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-1">{name}</h3>
            <p className="text-gray-600 text-sm">
              {subject} • {course}
              {examCategory && ` • ${examCategory}`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Book className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MessageSquare className="w-4 h-4" />
            <span>{messageCount} messages</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last chat: {formatDate(lastChatDate)}</span>
          </div>
          {lastMessage && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-700 mb-1">Last message:</p>
              <p className="line-clamp-2">{truncateMessage(lastMessage)}</p>
            </div>
          )}
        </div>

        <button
          onClick={() =>
            router.push(
              `/ai-tutors/chat?subject=${subject}&course=${course}${
                examCategory ? `&examCategory=${examCategory}` : ""
              }`
            )
          }
          className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <span>Continue Chat</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
