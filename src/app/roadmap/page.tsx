import React from "react";
import { FileUpload } from "@/components/roadmap/FileUpload";
import { RoadmapList } from "@/components/roadmap/RoadmapList";
import { auth } from "@/lib/firebaseConfig";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RoadmapPage() {
  // Check authentication
  

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Learning Roadmap</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your syllabus into an interactive learning path with curated resources and progress tracking.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Syllabus</CardTitle>
              <CardDescription>
                Upload a PDF syllabus to generate a personalized learning roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>
                Learn how we transform your syllabus into an interactive roadmap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Upload Syllabus</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your course syllabus PDF document
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Topic Extraction</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI identifies key topics from your syllabus
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Resource Curation</h3>
                  <p className="text-sm text-muted-foreground">
                    Get recommended videos, articles, and practice materials
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full">
                  <span className="text-primary font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-medium">Track Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    Mark topics as complete and track your learning journey
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Roadmaps</h2>
          <RoadmapList />
        </div>
      </div>
    </div>
  );
}