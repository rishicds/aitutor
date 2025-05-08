import React from "react";
import { notFound, redirect } from "next/navigation";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoadmapTopicList } from "@/components/roadmap/RoadmapTopicList";
import { ResourcesList } from "@/components/roadmap/ResourcesList";
import { Progress } from "@/components/ui/progress";
import { TopicDetails } from "@/components/roadmap/TopicDetails";
import Link from "next/link";

interface RoadmapPageProps {
  params: { id: string };
  searchParams: { topic?: string };
}

export default async function RoadmapPage({ params, searchParams }: RoadmapPageProps) {
  const authResult = await auth.currentUser;
  
  if (!authResult) {
    redirect(`/signin?redirect=/roadmap/${params.id}`);
  }
  
  // Get roadmap data
  const roadmapRef = doc(db, "roadmaps", params.id);
  const roadmapSnap = await getDoc(roadmapRef);
  
  if (!roadmapSnap.exists()) {
    notFound();
  }
  
  const roadmapData = roadmapSnap.data();
  const userId = authResult.uid;
  
  // Check if the roadmap belongs to the user
  if (roadmapData.userId !== userId) {
    notFound();
  }
  
  // Calculate progress
  const totalTopics = roadmapData.topics?.length || 0;
  const completedTopics = roadmapData.topics?.filter((topic: any) => topic.completed)?.length || 0;
  const progressPercentage = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  // Check if a specific topic is selected
  const selectedTopicId = searchParams.topic;
  const selectedTopic = selectedTopicId 
    ? roadmapData.topics?.find((topic: any) => topic.id === selectedTopicId)
    : null;
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/roadmap" className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block">
            ← Back to roadmaps
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{roadmapData.title}</h1>
          <p className="text-muted-foreground">{roadmapData.course || "Course"}</p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Progress: {progressPercentage}%</span>
            <span className="text-sm font-medium">
              {completedTopics}/{totalTopics} topics
            </span>
          </div>
          <Progress value={progressPercentage} className="w-[200px]" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Topics</CardTitle>
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
              <CardTitle>Practice Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/mocktest?roadmapId=${params.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <span>Mock Tests</span>
                </Button>
              </Link>
              <Link href={`/pyq?related=${encodeURIComponent(roadmapData.title)}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <span>Previous Year Questions</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {selectedTopic ? (
            <TopicDetails topic={selectedTopic} roadmapId={params.id} />
          ) : (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
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
                        <p className="text-muted-foreground">{roadmapData.description || "No description available."}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium">Start Learning</h3>
                        <p className="text-muted-foreground">Select a topic from the list to begin your learning journey.</p>
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
                              className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                            >
                              <h3 className="font-medium">{topic.title}</h3>
                              <p className="text-sm text-muted-foreground">{topic.description?.substring(0, 100)}...</p>
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
  );
} 