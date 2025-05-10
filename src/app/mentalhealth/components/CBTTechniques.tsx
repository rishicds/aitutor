"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { LoadingSkeleton } from "@/components/mental health/LoadingSkeleton";
import { useToast } from "@/components/ui/use-toast";

const techniques = [
  {
    id: "cognitive-restructuring",
    title: "Cognitive Restructuring",
    description: "Challenge and change negative thought patterns.",
    steps: [
      "Identify negative thoughts",
      "Evaluate the evidence for and against these thoughts",
      "Develop more balanced, realistic thoughts",
      "Practice replacing negative thoughts with balanced ones",
    ],
    resources: [
      {
        title: "Cognitive Restructuring Worksheet",
        url: "https://www.psychpoint.com/mental-health/worksheets/cognitive-restructuring",
      },
      {
        title: "Video: Cognitive Restructuring",
        url: "https://www.youtube.com/watch?v=1VYsO6HlUHw",
      },
    ],
  },
  {
    id: "exposure-therapy",
    title: "Exposure Therapy",
    description: "Gradually face fears and anxieties in a controlled manner.",
    steps: [
      "Create a fear hierarchy",
      "Start with less challenging exposures",
      "Gradually work up to more difficult situations",
      "Practice relaxation techniques during exposures",
    ],
    resources: [
      {
        title: "Exposure Therapy Guide",
        url: "https://www.apa.org/ptsd-guideline/patients-and-families/exposure-therapy",
      },
      {
        title: "Fear Hierarchy Worksheet",
        url: "https://www.therapistaid.com/therapy-worksheet/fear-hierarchy",
      },
    ],
  },
  {
    id: "behavioral-activation",
    title: "Behavioral Activation",
    description: "Increase engagement in positive activities to improve mood.",
    steps: [
      "Identify activities that bring joy or a sense of accomplishment",
      "Schedule these activities into your daily routine",
      "Monitor your mood before and after each activity",
      "Gradually increase the frequency and duration of positive activities",
    ],
    resources: [
      {
        title: "Behavioral Activation Guide",
        url: "https://www.div12.org/treatment/behavioral-activation-for-depression/",
      },
      {
        title: "Activity Planning Worksheet",
        url: "https://www.therapistaid.com/therapy-worksheet/activity-planning",
      },
    ],
  },
  {
    id: "mindfulness",
    title: "Mindfulness Techniques",
    description:
      "Practice being present in the moment to reduce stress and anxiety.",
    steps: [
      "Focus on your breath or a specific sensation",
      "Observe thoughts and feelings without judgment",
      "Gently return focus when your mind wanders",
      "Practice regularly, starting with short sessions",
    ],
    resources: [
      {
        title: "Mindfulness Exercises",
        url: "https://www.mayoclinic.org/healthy-lifestyle/consumer-health/in-depth/mindfulness-exercises/art-20046356",
      },
      {
        title: "Guided Mindfulness Meditation (Audio)",
        url: "https://www.uclahealth.org/programs/marc/mindful-meditations",
      },
    ],
  },
  {
    id: "problem-solving",
    title: "Problem-Solving Therapy",
    description: "Develop effective strategies to address life challenges.",
    steps: [
      "Identify and define the problem",
      "Generate potential solutions",
      "Evaluate and choose the best solution",
      "Implement and review the outcome",
      "Adjust approach based on results",
    ],
    resources: [
      {
        title: "Problem-Solving Therapy Guide",
        url: "https://www.apa.org/ptsd-guideline/treatments/problem-solving-therapy",
      },
      {
        title: "Problem-Solving Worksheet",
        url: "https://www.therapistaid.com/therapy-worksheet/dbt-problem-solving",
      },
    ],
  },
  {
    id: "relaxation-techniques",
    title: "Relaxation Techniques",
    description:
      "Practice methods to reduce physical tension and promote calmness.",
    steps: [
      "Learn deep breathing exercises",
      "Practice progressive muscle relaxation",
      "Try guided imagery or visualization",
      "Incorporate regular relaxation sessions into your routine",
    ],
    resources: [
      {
        title: "Progressive Muscle Relaxation Guide",
        url: "https://www.uofmhealth.org/health-library/uz2225",
      },
      {
        title: "Relaxation Techniques for Stress Relief",
        url: "https://www.helpguide.org/articles/stress/relaxation-techniques-for-stress-relief.htm",
      },
    ],
  },
  {
    id: "acceptance-commitment-therapy",
    title: "Acceptance and Commitment Therapy (ACT)",
    description:
      "Learn to accept difficult thoughts and feelings while committing to value-driven actions.",
    steps: [
      "Practice mindfulness and present-moment awareness",
      "Develop psychological flexibility",
      "Identify personal values",
      "Commit to actions aligned with your values",
    ],
    resources: [
      {
        title: "ACT: An Overview",
        url: "https://www.psychologytoday.com/us/therapy-types/acceptance-and-commitment-therapy",
      },
      {
        title: "Values Clarification Worksheet",
        url: "https://www.therapistaid.com/therapy-worksheet/values-clarification",
      },
    ],
  },
];

export default function CBTTechniques() {
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleResourceClick = (url: string) => {
    toast({
      title: "Opening resource",
      description: "The resource will open in a new tab.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CBT Techniques</CardTitle>
          <CardDescription>Loading techniques...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="h2 text-primary">CBT Techniques</CardTitle>
          <CardDescription>
            Explore various Cognitive Behavioral Therapy techniques and related
            approaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {techniques.map((technique) => (
              <AccordionItem key={technique.id} value={technique.id}>
                <AccordionTrigger
                  onClick={() => setExpandedTechnique(technique.id)}
                  className="hover-lift"
                >
                  {technique.title}
                </AccordionTrigger>
                <AccordionContent>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="mb-4">{technique.description}</p>
                    <h4 className="font-semibold mb-2">Steps:</h4>
                    <ul className="list-disc pl-5 mb-4">
                      {technique.steps.map((step, index) => (
                        <li key={index} className="mb-1">
                          {step}
                        </li>
                      ))}
                    </ul>
                    <h4 className="font-semibold mb-2">Resources:</h4>
                    <ul className="space-y-2">
                      {technique.resources.map((resource, index) => (
                        <li key={index}>
                          <Button
                            variant="link"
                            asChild
                            className="p-0 h-auto text-primary hover:text-primary/80 hover-lift"
                            onClick={() => handleResourceClick(resource.url)}
                          >
                            <Link
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {resource.title}
                              <ExternalLink className="ml-1 h-4 w-4 inline" />
                            </Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
}
