"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaYoutube, FaLink, FaBook } from "react-icons/fa";
import Link from "next/link";

interface Resource {
  id: string;
  title: string;
  url: string;
  type: "video" | "article" | "other";
  platform?: string;
}

interface Topic {
  id: string;
  title: string;
  resources?: Resource[];
  completed: boolean;
}

interface ResourcesListProps {
  topics: Topic[];
  difficultyLevel?: string;
}

export function ResourcesList({ topics, difficultyLevel = "intermediate" }: ResourcesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState<"all" | "video" | "article" | "other">("all");
  
  // Extract all resources from topics
  let allResources = topics.flatMap(topic => 
    (topic.resources || []).map(resource => ({
      ...resource,
      topicId: topic.id,
      topicTitle: topic.title,
      topicCompleted: topic.completed
    }))
  );
  
  // Filter resources based on difficulty level
  if (difficultyLevel === "beginner") {
    // For beginners: prioritize video resources and filter out complex academic resources
    allResources = allResources.filter(resource => {
      // Prioritize video resources for beginners
      if (resource.type === "video") return true;
      
      // Include resources from beginner-friendly platforms
      if (resource.platform && 
          ["YouTube", "Khan Academy", "Coursera", "Udemy", "FreeCodeCamp"].includes(resource.platform)) {
        return true;
      }
      
      // Exclude resources with "advanced" or "academic" in the title
      if (resource.title.toLowerCase().includes("advanced") || 
          resource.title.toLowerCase().includes("academic")) {
        return false;
      }
      
      return true;
    });
  } else if (difficultyLevel === "advanced") {
    // For advanced users: prioritize academic and comprehensive resources
    // We can show all resources, but we could optionally filter here if needed
  }
  
  // Filter resources based on search query and resource type
  const filteredResources = allResources.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.topicTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = resourceFilter === "all" || resource.type === resourceFilter;
    
    return matchesSearch && matchesType;
  });
  
  // Group resources by topic
  const resourcesByTopic: Record<string, typeof filteredResources> = {};
  
  filteredResources.forEach(resource => {
    if (!resourcesByTopic[resource.topicId]) {
      resourcesByTopic[resource.topicId] = [];
    }
    resourcesByTopic[resource.topicId].push(resource);
  });
  
  const ResourceTypeIcon = ({ type }: { type: Resource["type"] }) => {
    switch (type) {
      case "video":
        return <FaYoutube className="text-red-500" />;
      case "article":
        return <FaBook className="text-blue-500" />;
      default:
        return <FaLink className="text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col md:flex-row gap-4">
          <Input 
            placeholder="Search resources..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={resourceFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setResourceFilter("all")}
            >
              All
            </Button>
            <Button
              variant={resourceFilter === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setResourceFilter("video")}
              className="flex gap-1 items-center"
            >
              <FaYoutube /> Videos
            </Button>
            <Button
              variant={resourceFilter === "article" ? "default" : "outline"}
              size="sm"
              onClick={() => setResourceFilter("article")}
              className="flex gap-1 items-center"
            >
              <FaBook /> Articles
            </Button>
            <Button
              variant={resourceFilter === "other" ? "default" : "outline"}
              size="sm"
              onClick={() => setResourceFilter("other")}
              className="flex gap-1 items-center"
            >
              <FaLink /> Other
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {filteredResources.length} resources found
          </p>
          {difficultyLevel && (
            <Badge variant="outline" className="capitalize">
              {difficultyLevel} level resources
            </Badge>
          )}
        </div>
      </div>
      
      {Object.keys(resourcesByTopic).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No resources match your search criteria.</p>
        </div>
      ) : (
        Object.entries(resourcesByTopic).map(([topicId, resources]) => {
          const topic = topics.find(t => t.id === topicId);
          if (!topic) return null;
          
          return (
            <Card key={topicId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {topic.title}
                  {topic.completed && <Badge variant="outline">Completed</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resources.map(resource => (
                    <Link
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="mr-3 mt-1">
                        <ResourceTypeIcon type={resource.type} />
                      </div>
                      <div>
                        <h4 className="font-medium">{resource.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {resource.platform || resource.type}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
} 