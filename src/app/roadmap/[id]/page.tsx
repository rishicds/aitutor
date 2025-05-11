import { notFound } from "next/navigation"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoadmapTopicList } from "@/components/roadmap/RoadmapTopicList"
import { ResourcesList } from "@/components/roadmap/ResourcesList"
import { Progress } from "@/components/ui/progress"
import { TopicDetails } from "@/components/roadmap/TopicDetails"
import Link from "next/link"
import { Trophy, Star, Target, ArrowLeft, BookOpen, Brain, Lightbulb, Zap, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RoadmapPageProps {
  params: { id: string }
  searchParams: { topic?: string; level?: string }
}

export default async function RoadmapPage({ params, searchParams }: RoadmapPageProps) {
  // Get roadmap data
  const roadmapRef = doc(db, "roadmaps", params.id)
  const roadmapSnap = await getDoc(roadmapRef)

  if (!roadmapSnap.exists()) {
    notFound()
  }

  const roadmapData = roadmapSnap.data()
  
  // Get difficulty level from search params or use a default
  const difficultyLevel = searchParams.level || roadmapData.currentLevel || "intermediate"
  
  // If the currentLevel in the database is different from the requested level, update it
  if (difficultyLevel !== roadmapData.currentLevel) {
    await updateDoc(roadmapRef, {
      currentLevel: difficultyLevel,
      updatedAt: serverTimestamp(),
    })
  }
  
  // Filter topics based on difficulty level if the topics array exists
  let filteredTopics = roadmapData.topics || []
  
  if (filteredTopics.length > 0) {
    if (difficultyLevel === "beginner") {
      // For beginners: Include fewer topics (basic ones) and provide more detailed descriptions
      filteredTopics = filteredTopics.filter((topic: any, index: number) => 
        index < Math.ceil(filteredTopics.length * 0.6) // Include ~60% of topics for beginners
      )
    } else if (difficultyLevel === "advanced") {
      // For advanced: Include all topics with a focus on complex ones
      // We can keep all topics but in a real implementation you might want to add advanced-specific content
    }
    // For intermediate (default): Keep all topics as they are
  }

  // Calculate progress
  const totalTopics = filteredTopics.length || 0
  const completedTopics = filteredTopics.filter((topic: any) => topic.completed)?.length || 0
  const progressPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0

  // Calculate achievements
  const achievements = [
    { id: 1, title: "Getting Started", icon: Star, completed: completedTopics > 0 },
    { id: 2, title: "Halfway There", icon: Target, completed: progressPercentage >= 50 },
    { id: 3, title: "Master", icon: Trophy, completed: progressPercentage === 100 },
  ]

  // Check if a specific topic is selected
  const selectedTopicId = searchParams.topic
  const selectedTopic = selectedTopicId ? filteredTopics.find((topic: any) => topic.id === selectedTopicId) : null

  // Difficulty level icons
  const difficultyIcons = {
    beginner: Lightbulb,
    intermediate: Zap,
    advanced: Award
  }
  
  const DifficultyIcon = difficultyIcons[difficultyLevel as keyof typeof difficultyIcons] || Zap

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
              <p className="text-muted-foreground mt-1">
                {roadmapData.course || "Course"} • 
                <span className="ml-2 inline-flex items-center">
                  <DifficultyIcon className="h-4 w-4 mr-1" /> {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
                </span>
              </p>
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

        {/* Difficulty Level Tabs */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <h2 className="font-medium text-lg">Difficulty Level</h2>
            <p className="text-sm text-muted-foreground">Select the level that matches your experience</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Link href={`/roadmap/${params.id}?level=beginner${selectedTopicId ? `&topic=${selectedTopicId}` : ''}`}>
              <Card className={`cursor-pointer hover:border-primary transition-colors ${difficultyLevel === "beginner" ? "border-primary bg-primary/5" : ""}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-full ${difficultyLevel === "beginner" ? "bg-primary/20" : "bg-muted"}`}>
                    <Lightbulb className={`h-5 w-5 ${difficultyLevel === "beginner" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">Beginner</h3>
                    <p className="text-xs text-muted-foreground">Essential concepts</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/roadmap/${params.id}?level=intermediate${selectedTopicId ? `&topic=${selectedTopicId}` : ''}`}>
              <Card className={`cursor-pointer hover:border-primary transition-colors ${difficultyLevel === "intermediate" ? "border-primary bg-primary/5" : ""}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-full ${difficultyLevel === "intermediate" ? "bg-primary/20" : "bg-muted"}`}>
                    <Zap className={`h-5 w-5 ${difficultyLevel === "intermediate" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">Intermediate</h3>
                    <p className="text-xs text-muted-foreground">Comprehensive coverage</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/roadmap/${params.id}?level=advanced${selectedTopicId ? `&topic=${selectedTopicId}` : ''}`}>
              <Card className={`cursor-pointer hover:border-primary transition-colors ${difficultyLevel === "advanced" ? "border-primary bg-primary/5" : ""}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-full ${difficultyLevel === "advanced" ? "bg-primary/20" : "bg-muted"}`}>
                    <Award className={`h-5 w-5 ${difficultyLevel === "advanced" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">Advanced</h3>
                    <p className="text-xs text-muted-foreground">Deep specialization</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
                  topics={filteredTopics}
                  roadmapId={params.id}
                  selectedTopicId={selectedTopicId}
                  difficultyLevel={difficultyLevel}
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
                <Link href={`/mocktest?roadmapId=${params.id}&level=${difficultyLevel}`} className="block">
                  <Button className="w-full justify-start">
                    <span>Mock Tests</span>
                  </Button>
                </Link>
                <Link href={`/pyq?related=${encodeURIComponent(roadmapData.title)}&level=${difficultyLevel}`} className="block">
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
              <TopicDetails 
                topic={selectedTopic} 
                roadmapId={params.id} 
                difficultyLevel={difficultyLevel} 
              />
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
                          <h3 className="font-medium">Current Learning Path: <span className="text-primary">{difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}</span></h3>
                          <p className="text-muted-foreground">
                            {difficultyLevel === "beginner" 
                              ? "This path focuses on essential concepts and fundamentals. Perfect for those new to the subject."
                              : difficultyLevel === "advanced"
                                ? "This path includes advanced topics and in-depth analysis. Designed for those with strong foundations in the subject."
                                : "This path provides a comprehensive coverage of the subject with balanced depth and breadth."
                            }
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
                      {filteredTopics && filteredTopics.length > 0 ? (
                        <div className="space-y-4">
                          {filteredTopics
                            .filter((topic: any) => !topic.completed)
                            .slice(0, 3)
                            .map((topic: any) => (
                              <Link
                                key={topic.id}
                                href={`/roadmap/${params.id}?topic=${topic.id}&level=${difficultyLevel}`}
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
                  <ResourcesList 
                    topics={filteredTopics} 
                    difficultyLevel={difficultyLevel} 
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
