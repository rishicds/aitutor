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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Minus, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "../../../../hooks/use-media-query";
import { LoadingSkeleton } from "@/components/mental health/LoadingSkeleton";

// Mock data - replace with real data fetching in production
const moodData = [
  { date: "01/01", mood: 5, anxiety: 6, depression: 5 },
  { date: "01/02", mood: 6, anxiety: 5, depression: 4 },
  { date: "01/03", mood: 6, anxiety: 5, depression: 4 },
  { date: "01/04", mood: 7, anxiety: 4, depression: 3 },
  { date: "01/05", mood: 7, anxiety: 4, depression: 3 },
  { date: "01/06", mood: 8, anxiety: 3, depression: 2 },
  { date: "01/07", mood: 8, anxiety: 3, depression: 2 },
];

const thoughtPatterns = [
  { pattern: "Gratitude", shortLabel: "Gratitude", frequency: 8 },
  { pattern: "Positive Self-talk", shortLabel: "Self-talk", frequency: 7 },
  { pattern: "Balanced Perspective", shortLabel: "Balanced", frequency: 6 },
  { pattern: "Solution-Focused", shortLabel: "Solutions", frequency: 5 },
  { pattern: "Mindfulness", shortLabel: "Mindful", frequency: 4 },
  { pattern: "Strength Recognition", shortLabel: "Strengths", frequency: 4 },
  { pattern: "Growth Mindset", shortLabel: "Growth", frequency: 3 },
];

const behavioralActivities = [
  { activity: "Exercise", frequency: 3, mood_impact: 7 },
  { activity: "Socializing", frequency: 2, mood_impact: 6 },
  { activity: "Reading", frequency: 5, mood_impact: 5 },
  { activity: "Meditation", frequency: 4, mood_impact: 8 },
  { activity: "Hobby", frequency: 3, mood_impact: 7 },
];

const goalProgress = [
  { goal: "Reduce anxiety", progress: 65 },
  { goal: "Improve sleep", progress: 40 },
  { goal: "Increase positive activities", progress: 80 },
  { goal: "Challenge negative thoughts", progress: 55 },
];

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#A4DE6C",
];

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState("mood");
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const renderMoodTrend = () => {
    const lastMood = moodData[moodData.length - 1].mood;
    const firstMood = moodData[0].mood;
    const diff = lastMood - firstMood;
    if (diff > 0) {
      return (
        <span className="text-green-500 flex items-center">
          <ArrowUpRight size={16} /> Improving steadily
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-yellow-500 flex items-center">
          <ArrowDownRight size={16} /> Slight fluctuation, but managing well
        </span>
      );
    } else {
      return (
        <span className="text-blue-500 flex items-center">
          <Minus size={16} /> Maintaining stability
        </span>
      );
    }
  };

  const renderInfoPopover = (title: string, content: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open info</span>
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h3 className="font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{content}</p>
      </PopoverContent>
    </Popover>
  );

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Data Driven Insights</CardTitle>
          <CardDescription>Loading insights...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container mx-auto px-4 py-8"
      >
        <h1 className="text-3xl font-bold mb-6">Data Driven Insights</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="mood" className="text-sm px-2 py-1">
              Mood & Symptoms
            </TabsTrigger>
            <TabsTrigger value="thoughts" className="text-sm px-2 py-1">
              Thought Patterns
            </TabsTrigger>
            <TabsTrigger value="behaviors" className="text-sm px-2 py-1">
              Behavioral Activities
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-sm px-2 py-1">
              Goal Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mood">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mood & Symptom Trends</CardTitle>
                  {renderInfoPopover(
                    "Mood & Symptom Trends",
                    "This chart shows your daily mood, anxiety, and depression levels over the past week. Higher values indicate better mood and lower anxiety/depression."
                  )}
                </div>
                <CardDescription>
                  Track your mood and symptom changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full"
                  style={{ height: isMobile ? "300px" : "400px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="mood"
                        stroke="#8884d8"
                        name="Mood"
                      />
                      <Line
                        type="monotone"
                        dataKey="anxiety"
                        stroke="#82ca9d"
                        name="Anxiety"
                      />
                      <Line
                        type="monotone"
                        dataKey="depression"
                        stroke="#ffc658"
                        name="Depression"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <p>
                    Your average mood over the past week:{" "}
                    {(
                      moodData.reduce((sum, day) => sum + day.mood, 0) /
                      moodData.length
                    ).toFixed(1)}{" "}
                    / 10
                  </p>
                  <p>Mood trend: {renderMoodTrend()}</p>
                  <p>
                    Average anxiety level:{" "}
                    {(
                      moodData.reduce((sum, day) => sum + day.anxiety, 0) /
                      moodData.length
                    ).toFixed(1)}{" "}
                    / 10
                  </p>
                  <p>
                    Average depression level:{" "}
                    {(
                      moodData.reduce((sum, day) => sum + day.depression, 0) /
                      moodData.length
                    ).toFixed(1)}{" "}
                    / 10
                  </p>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-semibold mb-2">Positive Insights:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Your mood has been steadily improving over the week. Great
                      job on your progress!
                    </li>
                    <li>
                      Anxiety and depression levels have decreased. Your coping
                      strategies seem to be working well.
                    </li>
                    <li>
                      Consider what activities or thoughts contributed to your
                      mood improvement and try to incorporate more of these into
                      your routine.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="thoughts">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Thought Patterns</CardTitle>
                  {renderInfoPopover(
                    "Thought Patterns",
                    "This chart shows the frequency of different cognitive distortions in your thought records. Identifying these patterns is the first step in challenging and changing them."
                  )}
                </div>
                <CardDescription>
                  Identify recurring thought patterns in your entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full"
                  style={{ height: isMobile ? "300px" : "400px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={thoughtPatterns}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="shortLabel"
                        interval={0}
                        tick={({ x, y, payload }) => (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={0}
                              y={0}
                              dy={16}
                              textAnchor="end"
                              fill="#666"
                              transform="rotate(-45)"
                              fontSize={isMobile ? 10 : 12}
                            >
                              {payload.value}
                            </text>
                          </g>
                        )}
                      />
                      <YAxis />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background p-2 border border-border rounded shadow-md">
                                <p className="font-semibold">
                                  {payload[0].payload.pattern}
                                </p>
                                <p>Frequency: {payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="frequency" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <p>
                    Most common thought pattern:{" "}
                    {
                      thoughtPatterns.reduce((max, pattern) =>
                        max.frequency > pattern.frequency ? max : pattern
                      ).pattern
                    }
                  </p>
                  <p>
                    Total identified thought distortions:{" "}
                    {thoughtPatterns.reduce(
                      (sum, pattern) => sum + pattern.frequency,
                      0
                    )}
                  </p>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-semibold mb-2">
                    Positive Thinking Patterns:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>
                      <strong>Gratitude:</strong> Recognizing and appreciating
                      positive aspects in your life.
                    </li>
                    <li>
                      <strong>Positive Self-talk:</strong> Encouraging and
                      supportive internal dialogue.
                    </li>
                    <li>
                      <strong>Balanced Perspective:</strong> Considering
                      multiple viewpoints in situations.
                    </li>
                    <li>
                      <strong>Solution-Focused:</strong> Concentrating on
                      finding solutions rather than dwelling on problems.
                    </li>
                    <li>
                      <strong>Mindfulness:</strong> Being present and aware of
                      your thoughts and surroundings.
                    </li>
                    <li>
                      <strong>Strength Recognition:</strong> Acknowledging and
                      utilizing your personal strengths.
                    </li>
                    <li>
                      <strong>Growth Mindset:</strong> Viewing challenges as
                      opportunities for learning and growth.
                    </li>
                  </ul>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-semibold mb-2">Recommendations:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Your most frequent positive thinking pattern is "
                      {thoughtPatterns[0].pattern}". Keep practicing this
                      beneficial mindset!
                    </li>
                    <li>
                      Try incorporating more "
                      {thoughtPatterns[thoughtPatterns.length - 1].pattern}"
                      into your daily reflections to further enhance your
                      positive thinking.
                    </li>
                    <li>
                      Consider sharing your success in cultivating positive
                      thought patterns with a friend or therapist to reinforce
                      your progress.
                    </li>
                    <li>
                      Experiment with combining different positive thinking
                      strategies to create a personalized approach that works
                      best for you.
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row justify-between mt-6 gap-4">
                  <Button className="w-full sm:w-auto">
                    Learn More About Thought Patterns
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Access CBT Exercises
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behaviors">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Behavioral Activities</CardTitle>
                  {renderInfoPopover(
                    "Behavioral Activities",
                    "This chart compares the frequency of your activities with their impact on your mood. Activities with high frequency and high mood impact are particularly beneficial."
                  )}
                </div>
                <CardDescription>
                  Analyze the impact of activities on your mood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full"
                  style={{ height: isMobile ? "300px" : "400px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={behavioralActivities}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="activity" />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#8884d8"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#82ca9d"
                      />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="frequency"
                        fill="#8884d8"
                        name="Frequency (days/week)"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="mood_impact"
                        fill="#82ca9d"
                        name="Mood Impact (1-10)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <p>
                    Most frequent activity:{" "}
                    {
                      behavioralActivities.reduce((max, activity) =>
                        max.frequency > activity.frequency ? max : activity
                      ).activity
                    }
                  </p>
                  <p>
                    Activity with highest mood impact:{" "}
                    {
                      behavioralActivities.reduce((max, activity) =>
                        max.mood_impact > activity.mood_impact ? max : activity
                      ).activity
                    }
                  </p>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-semibold mb-2">Positive Insights:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Great job incorporating mood-boosting activities into your
                      routine!
                    </li>
                    <li>
                      Your engagement in{" "}
                      {
                        behavioralActivities.reduce((max, activity) =>
                          max.mood_impact > activity.mood_impact
                            ? max
                            : activity
                        ).activity
                      }{" "}
                      has a significant positive impact on your mood. Keep it
                      up!
                    </li>
                    <li>
                      Consider slightly increasing the frequency of activities
                      with high mood impact to further enhance your well-being.
                    </li>
                    <li>
                      Explore new activities that combine elements of your
                      high-impact activities to discover more enjoyable options.
                    </li>
                  </ul>
                </div>
                <Button className="mt-6 w-full sm:w-auto">
                  Suggest New Activities
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Goal Progress</CardTitle>
                  {renderInfoPopover(
                    "Goal Progress",
                    "This chart shows your progress towards personal goals. Each slice represents a goal, with the size indicating the percentage of progress made."
                  )}
                </div>
                <CardDescription>
                  Track your progress towards personal goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full"
                  style={{ height: isMobile ? "300px" : "400px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goalProgress}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={isMobile ? 80 : 100}
                        fill="#8884d8"
                        dataKey="progress"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {goalProgress.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  <p>
                    Highest progress:{" "}
                    {
                      goalProgress.reduce((max, goal) =>
                        max.progress > goal.progress ? max : goal
                      ).goal
                    }{" "}
                    (
                    {
                      goalProgress.reduce((max, goal) =>
                        max.progress > goal.progress ? max : goal
                      ).progress
                    }
                    %)
                  </p>
                  <p>
                    Area needing most attention:{" "}
                    {
                      goalProgress.reduce((min, goal) =>
                        min.progress < goal.progress ? min : goal
                      ).goal
                    }{" "}
                    (
                    {
                      goalProgress.reduce((min, goal) =>
                        min.progress < goal.progress ? min : goal
                      ).progress
                    }
                    %)
                  </p>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <h4 className="font-semibold mb-2">Progress Celebration:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Excellent progress on "
                      {
                        goalProgress.reduce((max, goal) =>
                          max.progress > goal.progress ? max : goal
                        ).goal
                      }
                      "! Reflect on the strategies that contributed to this
                      success.
                    </li>
                    <li>
                      You're making steady progress on all your goals. Keep up
                      the great work!
                    </li>
                    <li>
                      For "
                      {
                        goalProgress.reduce((min, goal) =>
                          min.progress < goal.progress ? min : goal
                        ).goal
                      }
                      ", consider breaking it down into smaller, achievable
                      steps to maintain motivation.
                    </li>
                    <li>
                      Regularly review and adjust your goals to ensure they
                      remain challenging yet attainable, celebrating each
                      milestone along the way.
                    </li>
                  </ul>
                </div>
                <Button className="mt-6 w-full sm:w-auto">
                  Update Goal Progress
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </ScrollArea>
  );
}
