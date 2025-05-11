"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { db } from "@/lib/firebaseConfig"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Topic {
  id: string
  title: string
  description?: string
  completed: boolean
  order: number
}

interface RoadmapTopicListProps {
  topics: Topic[]
  roadmapId: string
  selectedTopicId?: string
  difficultyLevel?: string
}

export function RoadmapTopicList({ topics, roadmapId, selectedTopicId, difficultyLevel = "intermediate" }: RoadmapTopicListProps) {
  const [updating, setUpdating] = useState<string | null>(null)
  const router = useRouter()

  // Sort topics by order
  const sortedTopics = [...topics].sort((a, b) => {
    // First sort by completion status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    // Then by order
    return (a.order || 0) - (b.order || 0)
  })

  const handleToggleComplete = async (topic: Topic) => {
    try {
      setUpdating(topic.id)

      const roadmapRef = doc(db, "roadmaps", roadmapId)

      // Create an updated topic with the completion status toggled
      const updatedTopic = {
        ...topic,
        completed: !topic.completed,
      }

      // Remove the old topic and add the updated one
      await updateDoc(roadmapRef, {
        topics: arrayRemove(topic),
      })

      await updateDoc(roadmapRef, {
        topics: arrayUnion(updatedTopic),
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error("Error updating topic completion:", error)
    } finally {
      setUpdating(null)
    }
  }

  if (topics.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No topics available.</div>
  }

  return (
    <div className="space-y-2">
      {sortedTopics.map((topic) => {
        const isSelected = topic.id === selectedTopicId

        return (
          <div
            key={topic.id}
            className={`
              p-3 border rounded-lg flex items-start gap-3 
              ${isSelected ? "bg-accent" : "hover:bg-muted"} 
              ${topic.completed ? "opacity-75" : ""}
              transition-colors
            `}
          >
            <Checkbox
              checked={topic.completed}
              onCheckedChange={() => handleToggleComplete(topic)}
              disabled={updating === topic.id}
              className="mt-1"
            />

            <Link href={`/roadmap/${roadmapId}?topic=${topic.id}&level=${difficultyLevel}`} className="flex-1">
              <div>
                <h3 className={`font-medium ${topic.completed ? "line-through text-muted-foreground" : ""}`}>
                  {topic.title}
                </h3>
                {topic.description && <p className="text-xs text-muted-foreground line-clamp-1">{topic.description}</p>}
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
