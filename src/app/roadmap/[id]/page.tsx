import { notFound } from "next/navigation"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoadmapTopicList } from "@/components/roadmap/RoadmapTopicList"
import { ResourcesList } from "@/components/roadmap/ResourcesList"
import { Progress } from "@/components/ui/progress"
import { TopicDetails } from "@/components/roadmap/TopicDetails"
import Link from "next/link"
import { Trophy, Star, Target, ArrowLeft, BookOpen, Brain } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RoadmapPageProps {
  params: { id: string }
  searchParams: { topic?: string }
}

export default async function RoadmapPage({ params, searchParams }: RoadmapPageProps) {
  // Get roadmap data
  const roadmapRef = doc(db, "roadmaps", params.id)
  const roadmapSnap = await getDoc(roadmapRef)

  if (!roadmapSnap.exists()) {
    notFound()
  }

  const roadmapData = roadmapSnap.data()

  // Calculate progress
  const totalTopics = roadmapData.topics?.length || 0
  const completedTopics = roadmapData.topics?.filter((topic: any) => topic.completed)?.length || 0
  const progressPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0

  // Calculate achievements
  const achievements = [
    { id: 1, title: "Getting Started", icon: Star, completed: completedTopics > 0 },
    { id: 2, title: "Halfway There", icon: Target, completed: progressPercentage >= 50 },
    { id: 3, title: "Master", icon: Trophy, completed: progressPercentage === 100 },
  ]

  // Check if a specific topic is selected
  const selectedTopicId = searchParams.topic
  const selectedTopic = selectedTopicId ? roadmapData.topics?.find((topic: any) => topic.id === selectedTopicId) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4 md:px-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/roadmap" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to roadmaps
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                {roadmapData.title}
              </h1>
              <p className="text-muted-foreground mt-1">{roadmapData.course || "Course"}</p>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">
                  {completedTopics}/{totalTopics} topics
                </span>
                <Badge className="bg-primary/10 text-primary">
                  {progressPercentage}% Complete
                </Badge>
              </div>
              <Progress value={progressPercentage} className="w-[200px] h-2" />
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className={`${achievement.completed ? 'border-primary/50' : ''}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-full ${achievement.completed ? 'bg-primary/10' : 'bg-muted'}`}>
                  <achievement.icon className={`w-6 h-6 ${achievement.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h3 className="font-medium">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {achievement.completed ? 'Achieved!' : 'In progress...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RoadmapTopicList
                  topics={roadmapData.topics || []}
                  roadmapId={params.id}
                  selectedTopicId={selectedTopicId}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Practice Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href={`/mocktest?roadmapId=${params.id}`} className="block">
                  <Button className="w-full justify-start">
                    <span>Mock Tests</span>
                  </Button>
                </Link>
                <Link href={`/pyq?related=${encodeURIComponent(roadmapData.title)}`} className="block">
                  <Button className="w-full justify-start">
                    <span>Previous Year Questions</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {selectedTopic ? (
              <TopicDetails topic={selectedTopic} roadmapId={params.id} />
            ) : (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resources">All Resources</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Roadmap Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">Description</h3>
                          <p className="text-muted-foreground">
                            {roadmapData.description || "No description available."}
                          </p>
                        </div>

                        <div>
                          <h3 className="font-medium">Start Learning</h3>
                          <p className="text-muted-foreground">
                            Select a topic from the list to begin your learning journey.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recommended Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {roadmapData.topics && roadmapData.topics.length > 0 ? (
                        <div className="space-y-4">
                          {roadmapData.topics
                            .filter((topic: any) => !topic.completed)
                            .slice(0, 3)
                            .map((topic: any) => (
                              <Link
                                key={topic.id}
                                href={`/roadmap/${params.id}?topic=${topic.id}`}
                                className="block p-4 border rounded-lg hover:bg-accent transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-medium group-hover:text-primary transition-colors">{topic.title}</h3>
                                    <p className="text-sm text-muted-foreground">{topic.description?.substring(0, 100)}...</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No topics available. Try generating a new roadmap.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="space-y-6">
                  <ResourcesList topics={roadmapData.topics || []} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
