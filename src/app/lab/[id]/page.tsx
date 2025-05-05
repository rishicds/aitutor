"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Bookmark, Share2, Download, ThumbsUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import ExperimentViewer from "@/components/lab/experiment-viewer"

// Define experiment interface
interface Experiment {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  tags: string[]
  thumbnail: string
  modelPath: string
  views: number
  featured: boolean
  theory?: string
  procedure?: string
}

export default function ExperimentPage() {
  const params = useParams()
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching experiment data
    const fetchExperiment = () => {
      setLoading(true)

      // Mock data for the experiment
      setTimeout(() => {
        const experimentData: Experiment = {
          id: params.id as string,
          title:
            params.id === "pendulum-motion"
              ? "Pendulum Motion Analysis"
              : params.id === "molecular-bonds"
                ? "Molecular Bonding Visualization"
                : params.id === "wave-interference"
                  ? "Wave Interference Patterns"
                  : params.id === "salt-analysis"
                    ? "Salt Analysis Chemistry Lab"
                    : params.id === "pendulum-2d"
                      ? "2D Pendulum Simulation"
                      : params.id === "graph-plotter"
                        ? "Mathematical Graph Plotter"
                        : "Experiment",
          description:
            "This experiment allows you to visualize and analyze scientific phenomena through interactive 3D models and simulations.",
          category:
            params.id === "pendulum-motion" ||
            params.id === "wave-interference" ||
            params.id === "pendulum-2d" ||
            params.id === "graph-plotter"
              ? "physics"
              : params.id === "molecular-bonds" || params.id === "salt-analysis"
                ? "chemistry"
                : "biology",
          difficulty: "Intermediate",
          tags: ["visualization", "3D", "interactive"],
          thumbnail: "/placeholder.svg?height=200&width=300",
          modelPath: `/models/${params.id}.glb`,
          views: 1245,
          featured: true,
          theory: ` Theoretical Background

## ${
            params.id === "pendulum-motion"
              ? "Simple Harmonic Motion"
              : params.id === "molecular-bonds"
                ? "Chemical Bonding"
                : params.id === "wave-interference"
                  ? "Wave Superposition"
                  : params.id === "salt-analysis"
                    ? "Qualitative Analysis of Salts"
                    : params.id === "pendulum-2d"
                      ? "2D Pendulum Physics"
                      : params.id === "graph-plotter"
                        ? "Mathematical Functions and Graphing"
                        : "Scientific Principles"
          }

${
  params.id === "pendulum-motion"
    ? "A simple pendulum consists of a mass (bob) attached to a weightless string. When displaced from equilibrium and released, it oscillates about the equilibrium position. The motion is approximately simple harmonic for small angles.\n\nThe period of oscillation is given by: $T = 2\\pi\\sqrt{\\frac{L}{g}}$ where $L$ is the length of the pendulum and $g$ is the acceleration due to gravity."
    : params.id === "molecular-bonds"
      ? "Chemical bonds are the forces that hold atoms together to form molecules. The two main types of chemical bonds are ionic bonds and covalent bonds.\n\nCovalent bonds involve the sharing of electron pairs between atoms. The shared electrons are attracted to the nuclei of both atoms, which keeps the atoms together."
      : params.id === "wave-interference"
        ? "When two or more waves overlap, they interfere with each other. The resulting wave is the sum of the individual waves at each point in space.\n\nConstructive interference occurs when the peaks of two waves align, resulting in a larger amplitude. Destructive interference occurs when a peak aligns with a trough, resulting in a smaller amplitude or complete cancellation."
        : params.id === "salt-analysis"
          ? "Qualitative analysis is a branch of chemistry that deals with the identification of elements or compounds in a sample. Salt analysis involves the systematic identification of cations and anions present in a given salt.\n\nThe analysis typically involves a series of chemical tests and observations of reactions, color changes, and precipitate formation to identify the ions present in the salt."
            : params.id === "graph-plotter"
              ? "Mathematical functions describe relationships between variables. When plotted on a coordinate system, these functions create visual representations that help us understand their behavior.\n\nDifferent types of functions (linear, quadratic, trigonometric, etc.) produce different characteristic shapes when graphed. Analyzing these graphs helps in understanding concepts like domain, range, intercepts, and asymptotes."
              : "This section contains the theoretical principles behind the experiment."
}
`,
          procedure: ` Experimental Procedure

1. **Setup**: ${
            params.id === "pendulum-motion"
              ? "Adjust the pendulum length and gravity settings to observe different oscillation behaviors."
              : params.id === "molecular-bonds"
                ? "Examine the molecular structure and observe how different atoms bond together."
                : params.id === "wave-interference"
                  ? "Adjust the amplitude and frequency of the waves to observe different interference patterns."
                  : params.id === "salt-analysis"
                    ? "Select a known or unknown salt sample and prepare reagents for testing."
                    : params.id === "pendulum-2d"
                      ? "Set the initial position of the pendulum and adjust parameters like gravity, length, and damping."
                      : params.id === "graph-plotter"
                        ? "Enter mathematical functions and adjust the graph settings like axes ranges and grid size."
                        : "Configure the experimental parameters."
          }

2. **Observation**: Observe the 3D visualization and note how changes in parameters affect the behavior.

3. **Data Collection**: Record measurements and observations in the data section.

4. **Analysis**: Analyze the collected data to draw conclusions about the underlying principles.`,
        }

        setExperiment(experimentData)
        setLoading(false)
      }, 500)
    }

    fetchExperiment()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-8 border-dashed border-teal-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-8 border-l-transparent border-teal-400 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.53L9.4 7.13L12 9.33L14.6 7.13L12 4.53ZM4.53 12L7.13 14.6L9.33 12L7.13 9.4L4.53 12ZM12 19.47L14.6 16.87L12 14.67L9.4 16.87L12 19.47ZM19.47 12L16.87 9.4L14.67 12L16.87 14.6L19.47 12ZM12 1L7 6L12 10L17 6L12 1ZM1 12L6 17L10 12L6 7L1 12ZM12 23L17 18L12 14L7 18L12 23ZM23 12L18 7L14 12L18 17L23 12Z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-teal-600 font-medium animate-pulse">Loading experiment...</p>
        <style jsx global>{`
          @keyframes spin-slow {
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  if (!experiment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Experiment Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The experiment you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/">Return to Experiments</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/lab" className="flex items-center">
            <ChevronLeft className="mr-2" size={16} />
            Back to Experiments
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{experiment.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {experiment.category.charAt(0).toUpperCase() + experiment.category.slice(1)}
              </Badge>
              <Badge variant="outline">{experiment.difficulty}</Badge>
              <span className="text-sm text-muted-foreground">{experiment.views.toLocaleString()} views</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Bookmark size={16} />
              Save
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Share2 size={16} />
              Share
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download size={16} />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg shadow-md overflow-hidden h-[700px]">
            <ExperimentViewer experiment={experiment} />
          </div>

          <div className="mt-6">
            <Tabs defaultValue="theory">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="theory">Theory</TabsTrigger>
                <TabsTrigger value="procedure">Procedure</TabsTrigger>
                <TabsTrigger value="discussion">Discussion</TabsTrigger>
              </TabsList>

              <TabsContent value="theory" className="prose max-w-none">
                <div className="bg-white border rounded-lg shadow-sm p-6">
                  {experiment.theory && (
                    <div dangerouslySetInnerHTML={{ __html: experiment.theory.replace(/\n/g, "<br>") }} />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="procedure" className="prose max-w-none">
                <div className="bg-white border rounded-lg shadow-sm p-6">
                  {experiment.procedure && (
                    <div dangerouslySetInnerHTML={{ __html: experiment.procedure.replace(/\n/g, "<br>") }} />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="discussion" className="prose max-w-none">
                <div className="bg-white border rounded-lg shadow-sm p-6">
                  <h2>Discussion</h2>
                  <p>
                    This section contains a discussion of the experimental results and their implications. Users can
                    share their observations and insights about the experiment.
                  </p>

                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Comments</h3>

                    <div className="space-y-4">
                      <div className="flex gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">User123</span>
                            <span className="text-xs text-muted-foreground">2 days ago</span>
                          </div>
                          <p className="mt-1">
                            This visualization really helped me understand the concept. I was able to see how changing
                            the parameters affects the outcome.
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <button className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <ThumbsUp size={12} />
                              <span>12</span>
                            </button>
                            <button className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <MessageSquare size={12} />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Professor42</span>
                            <span className="text-xs text-muted-foreground">1 week ago</span>
                          </div>
                          <p className="mt-1">
                            Excellent visualization. I recommend trying different parameter values to see how they
                            affect the system's behavior.
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <button className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <ThumbsUp size={12} />
                              <span>24</span>
                            </button>
                            <button className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <MessageSquare size={12} />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <textarea
                        className="w-full p-3 border rounded-lg focus:ring-teal-500 focus:outline-none min-h-24"
                        placeholder="Add your comment..."
                      ></textarea>
                      <Button className="mt-2 bg-gradient-to-r from-teal-500 to-blue-600">Post Comment</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div>
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">About This Experiment</h2>
            <p className="text-muted-foreground mb-4">{experiment.description}</p>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">CATEGORY</h3>
                <p>{experiment.category.charAt(0).toUpperCase() + experiment.category.slice(1)}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">DIFFICULTY</h3>
                <p>{experiment.difficulty}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">TAGS</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {experiment.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Learning Objectives</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <span>
                  Understand the fundamental principles of {experiment.category} through interactive visualization
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <span>Observe how changing parameters affects the behavior of the system</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <span>Collect and analyze data from the experiment</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <span>Apply theoretical knowledge to practical scenarios</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
