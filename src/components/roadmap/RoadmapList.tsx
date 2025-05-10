"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebaseConfig"
import { collection, query, orderBy, getDocs } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

interface Roadmap {
  id: string
  title: string
  description: string
  course: string
  createdAt: {
    toDate: () => Date
  } // Firestore timestamp
  totalTopics: number
  completedTopics: number
}

export function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        // Get the session ID from localStorage or create a new one
        let sessionId = localStorage.getItem("sessionId")
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15)
          localStorage.setItem("sessionId", sessionId)
        }

        const roadmapsRef = collection(db, "roadmaps")
        // Fetch all roadmaps and filter client-side for this session
        const roadmapsQuery = query(roadmapsRef, orderBy("createdAt", "desc"))

        const querySnapshot = await getDocs(roadmapsQuery)
        const fetchedRoadmaps: Roadmap[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()

          // Only include roadmaps created in this session
          if (data.sessionId === sessionId) {
            // Calculate progress
            const topics = data.topics || []
            const totalTopics = topics.length
            const completedTopics = topics.filter((topic: { completed: boolean }) => topic.completed).length

            fetchedRoadmaps.push({
              id: doc.id,
              title: data.title || "Untitled Roadmap",
              description: data.description || "No description available",
              course: data.course || "Unknown Course",
              createdAt: data.createdAt,
              totalTopics,
              completedTopics,
            })
          }
        })

        setRoadmaps(fetchedRoadmaps)
      } catch (err) {
        console.error("Error fetching roadmaps:", err)
        setError("Failed to load roadmaps. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchRoadmaps()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg">
            <CardContent className="p-0">&nbsp;</CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
        <p>{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (roadmaps.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <p className="mb-4 text-muted-foreground">You haven&apos;t created any roadmaps yet.</p>
        <p className="text-sm text-muted-foreground">
          Upload a syllabus to get started with your first learning roadmap.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roadmaps.map((roadmap) => {
        const progressPercentage = roadmap.totalTopics
          ? Math.round((roadmap.completedTopics / roadmap.totalTopics) * 100)
          : 0

        return (
          <Link key={roadmap.id} href={`/roadmap/${roadmap.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{roadmap.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{roadmap.description}</p>

                <div className="mt-auto">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span>{roadmap.course}</span>
                    <span>{progressPercentage}% complete</span>
                  </div>
                  <Progress value={progressPercentage} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
