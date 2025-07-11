"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { db } from "@/lib/firebaseConfig"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { FaYoutube, FaLink, FaBook, FaArrowRight } from "react-icons/fa"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Resource {
  id: string
  title: string
  url: string
  type: "video" | "article" | "other"
  platform?: string
  description?: string
}

interface Topic {
  id: string
  title: string
  description?: string
  content?: string
  resources?: Resource[]
  completed: boolean
  order: number
  keyPoints?: string[]
  nextTopics?: string[] // IDs of recommended next topics
}

interface TopicDetailsProps {
  topic: Topic
  roadmapId: string
  difficultyLevel?: string
}

export function TopicDetails({ topic, roadmapId, difficultyLevel = "intermediate" }: TopicDetailsProps) {
  const [updating, setUpdating] = useState<boolean>(false)
  const router = useRouter()

  // Adapt content based on difficulty level
  const adaptedKeyPoints = topic.keyPoints ? [...topic.keyPoints] : [];
  let adaptedContent = topic.content;
  let contentNotice = "";

  if (difficultyLevel === "beginner") {
    // For beginners: show simplified content and fewer key points
    adaptedContent = topic.content?.split("\n").slice(0, Math.max(2, Math.floor((topic.content.split("\n").length * 0.7)))).join("\n");
    contentNotice = "Showing simplified content optimized for beginners.";
    // Keep only the first 3-4 key points for beginners if there are many
    if (adaptedKeyPoints.length > 4) {
      adaptedKeyPoints.splice(4);
    }
  } else if (difficultyLevel === "advanced") {
    // For advanced: show all content and add a notice
    contentNotice = "Showing complete advanced content.";
  }

  const handleToggleComplete = async () => {
    try {
      setUpdating(true)

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
      setUpdating(false)
    }
  }

  const ResourceTypeIcon = ({ type }: { type: Resource["type"] }) => {
    switch (type) {
      case "video":
        return <FaYoutube className="text-red-500" />
      case "article":
        return <FaBook className="text-blue-500" />
      default:
        return <FaLink className="text-gray-500" />
    }
  }

  // Filter resources based on difficulty level
  const filteredResources = topic.resources ? topic.resources.filter(resource => {
    // For beginners, prioritize easier content (e.g., video tutorials)
    if (difficultyLevel === "beginner") {
      return resource.type === "video" || (resource.platform && 
             ["YouTube", "Khan Academy", "Coursera"].includes(resource.platform));
    }
    // For advanced, prioritize more academic/detailed content
    if (difficultyLevel === "advanced") {
      return true; // Show all resources for advanced
    }
    // For intermediate (default), show all resources
    return true;
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{topic.title}</h1>
          {topic.description && <p className="text-muted-foreground mt-1 mb-2">{topic.description}</p>}

          <div className="flex gap-2 items-center">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="topicComplete"
                checked={topic.completed}
                onCheckedChange={handleToggleComplete}
                disabled={updating}
              />
              <label
                htmlFor="topicComplete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mark as complete
              </label>
            </div>

            <Link href={`/roadmap/${roadmapId}?level=${difficultyLevel}`}>
              <Button variant="outline" size="sm">
                Back to roadmap
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Content</CardTitle>
              {contentNotice && (
                <p className="text-sm text-muted-foreground">{contentNotice}</p>
              )}
            </CardHeader>
            <CardContent>
              {adaptedContent ? (
                <div className="prose max-w-none">
                  {adaptedContent.split("\n").map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No content available for this topic.</p>
              )}
              
              {difficultyLevel === "beginner" && topic.content && topic.content.split("\n").length > adaptedContent.split("\n").length && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This is a simplified version of the content optimized for beginners. 
                    <Link href={`/roadmap/${roadmapId}?topic=${topic.id}&level=intermediate`} className="ml-1 text-primary hover:underline">
                      Switch to intermediate
                    </Link> or 
                    <Link href={`/roadmap/${roadmapId}?topic=${topic.id}&level=advanced`} className="ml-1 text-primary hover:underline">
                      advanced
                    </Link> to see more detailed content.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {adaptedKeyPoints && adaptedKeyPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {adaptedKeyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {topic.nextTopics && topic.nextTopics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>What&apos;s Next</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  After mastering this topic, we recommend exploring these related topics:
                </p>

                <div className="space-y-2">
                  {topic.nextTopics.map((nextTopicId) => (
                    <Link
                      key={nextTopicId}
                      href={`/roadmap/${roadmapId}?topic=${nextTopicId}&level=${difficultyLevel}`}
                      className="flex items-center p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="mr-2">
                        <FaArrowRight className="text-primary" />
                      </div>
                      <span>
                        {/* Try to find the topic title from the ID */}
                        {nextTopicId}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Learning Resources</CardTitle>
              {difficultyLevel && (
                <p className="text-sm text-muted-foreground">
                  {difficultyLevel === "beginner" 
                    ? "Showing beginner-friendly learning resources." 
                    : difficultyLevel === "advanced" 
                      ? "Showing all resources including advanced materials." 
                      : "Showing comprehensive learning resources."
                  }
                </p>
              )}
            </CardHeader>
            <CardContent>
              {!filteredResources || filteredResources.length === 0 ? (
                <p className="text-muted-foreground">No resources available for this topic.</p>
              ) : (
                <div className="space-y-4">
                  {filteredResources.map((resource) => (
                    <div key={resource.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <ResourceTypeIcon type={resource.type} />
                        <h3 className="font-medium">{resource.title}</h3>
                      </div>

                      {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}

                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{resource.platform || resource.type}</Badge>
                        <Link href={resource.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm">Visit Resource</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-medium mb-3">Practice Opportunities</h3>
                <div className="space-y-2">
                  <Link href={`/mocktest?topic=${encodeURIComponent(topic.title)}&level=${difficultyLevel}`}>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Take Practice Quiz</span>
                      <FaArrowRight className="text-xs" />
                    </Button>
                  </Link>
                  <Link href={`/pyq?topic=${encodeURIComponent(topic.title)}&level=${difficultyLevel}`}>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Relevant Previous Questions</span>
                      <FaArrowRight className="text-xs" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
