"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Users, MessageSquare, ThumbsUp, Reply } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Mock data for community chat
const mockUsers = [
  { id: 1, name: "Sarah Johnson", avatar: "/placeholder.svg?height=40&width=40", role: "Community Member" },
  { id: 2, name: "Michael Chen", avatar: "/placeholder.svg?height=40&width=40", role: "Community Member" },
  { id: 3, name: "Emma Rodriguez", avatar: "/placeholder.svg?height=40&width=40", role: "CBT Specialist" },
  { id: 4, name: "David Kim", avatar: "/placeholder.svg?height=40&width=40", role: "Community Member" },
  { id: 5, name: "Olivia Wilson", avatar: "/placeholder.svg?height=40&width=40", role: "Peer Support" },
]

const mockTopics = [
  { id: 1, title: "Anxiety Management", messages: 24, lastActive: "2 hours ago" },
  { id: 2, title: "Depression Support", messages: 18, lastActive: "4 hours ago" },
  { id: 3, title: "Mindfulness Practices", messages: 32, lastActive: "1 hour ago" },
  { id: 4, title: "Sleep Improvement", messages: 15, lastActive: "6 hours ago" },
  { id: 5, title: "Stress Reduction", messages: 27, lastActive: "30 minutes ago" },
]

const mockMessages = [
  {
    id: 1,
    userId: 1,
    content: "I've been struggling with anxiety lately. Does anyone have tips for managing panic attacks?",
    timestamp: "10:30 AM",
    likes: 3,
    replies: 2,
  },
  {
    id: 2,
    userId: 3,
    content:
      "Deep breathing exercises can help during panic attacks. Try the 4-7-8 technique: inhale for 4 seconds, hold for 7, exhale for 8. Also, grounding techniques like naming 5 things you can see, 4 you can touch, 3 you can hear, etc. can help bring you back to the present moment.",
    timestamp: "10:35 AM",
    likes: 5,
    replies: 0,
  },
  {
    id: 3,
    userId: 2,
    content:
      "I use the DARE approach (Defuse, Accept, Run toward, Engage) and it's been really helpful for my anxiety. There's a book about it that changed my perspective on panic attacks.",
    timestamp: "10:42 AM",
    likes: 4,
    replies: 1,
  },
  {
    id: 4,
    userId: 5,
    content:
      "Regular exercise has made a huge difference for my anxiety levels. Even just a 20-minute walk can help reduce the intensity of anxious feelings.",
    timestamp: "10:50 AM",
    likes: 2,
    replies: 0,
  },
  {
    id: 5,
    userId: 4,
    content: "Has anyone tried meditation apps? I'm looking for recommendations.",
    timestamp: "11:05 AM",
    likes: 1,
    replies: 3,
  },
]

export default function CommunityChat() {
  const [activeTab, setActiveTab] = useState("chat")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)
  const [activeTopic, setActiveTopic] = useState(mockTopics[0])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      userId: 1, // Current user
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      likes: 0,
      replies: 0,
    }

    setMessages([...messages, newMessage])
    setMessage("")

    toast({
      title: "Message sent",
      description: "Your message has been posted to the community.",
    })
  }

  const handleLike = (messageId: number) => {
    setMessages(messages.map((msg) => (msg.id === messageId ? { ...msg, likes: msg.likes + 1 } : msg)))
  }

  const handleTopicChange = (topic: (typeof mockTopics)[0]) => {
    setActiveTopic(topic)
    // In a real app, we would fetch messages for this topic
    toast({
      title: `Switched to ${topic.title}`,
      description: `Viewing community discussion on ${topic.title}.`,
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Chat
          </CardTitle>
          <CardDescription>Connect with others and share experiences</CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="m-0">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">{activeTopic.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activeTopic.messages} messages</span>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const user = mockUsers.find((u) => u.id === msg.userId)
                    return (
                      <div key={msg.id} className="flex gap-3">
                        <Avatar>
                          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                          <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user?.name}</span>
                            {user?.role === "CBT Specialist" && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                {user.role}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                          </div>
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleLike(msg.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                            >
                              <ThumbsUp className="h-3 w-3" /> {msg.likes}
                            </button>
                            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                              <Reply className="h-3 w-3" /> Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </TabsContent>

          <TabsContent value="topics" className="m-0">
            <CardContent className="p-6">
              <div className="space-y-4">
                {mockTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicChange(topic)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeTopic.id === topic.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{topic.title}</h3>
                      <span className="text-xs text-muted-foreground">{topic.messages} messages</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Last active: {topic.lastActive}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Community Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Be respectful and supportive of other community members.</li>
              <li>Maintain confidentiality and privacy.</li>
              <li>Focus on sharing experiences rather than giving medical advice.</li>
              <li>Use content warnings for potentially triggering topics.</li>
              <li>Report any concerning content to moderators.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
