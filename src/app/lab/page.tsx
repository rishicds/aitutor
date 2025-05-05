"use client"

import { useState, useEffect, SetStateAction } from "react"
import {
  Search,
  Filter,
  BookOpen,
  Beaker,
  Atom,
  Microscope,
  Brain,
  Dna,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import ExperimentViewer from "@/components/lab/experiment-viewer"

// Define experiment categories with their respective icons
const categories = [
  { id: "physics", name: "Physics", icon: Atom },
  { id: "chemistry", name: "Chemistry", icon: Beaker },
  { id: "biology", name: "Biology", icon: Microscope },
  { id: "neuroscience", name: "Neuroscience", icon: Brain },
  { id: "genetics", name: "Genetics", icon: Dna },
]

// Define difficulty levels
const difficultyLevels = ["Beginner", "Intermediate", "Advanced"]

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
}

export default function LabExperimentsPage() {
  // Sample experiments data
  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: "pendulum-motion",
      title: "Pendulum Motion Analysis",
      description:
        "Visualize and analyze the motion of a simple pendulum, including period, amplitude, and energy conservation.",
      category: "physics",
      difficulty: "Beginner",
      tags: ["mechanics", "oscillation", "energy"],
      thumbnail: "/placeholder.svg?height=200&width=300",
      modelPath: "/models/pendulum.glb",
      views: 1245,
      featured: true,
    },
    {
      id: "molecular-bonds",
      title: "Molecular Bonding Visualization",
      description: "Explore different types of molecular bonds and how they affect molecular structure and properties.",
      category: "chemistry",
      difficulty: "Intermediate",
      tags: ["molecules", "bonds", "structure"],
      thumbnail: "/placeholder.svg?height=200&width=300",
      modelPath: "/models/molecule.glb",
      views: 987,
      featured: true,
    },
    {
      id: "dna-replication",
      title: "DNA Replication Process",
      description:
        "Visualize the process of DNA replication including the role of enzymes and the formation of new DNA strands.",
      category: "biology",
      difficulty: "Advanced",
      tags: ["genetics", "replication", "enzymes"],
      thumbnail: "/placeholder.svg?height=200&width=300",
      modelPath: "/models/dna.glb",
      views: 1532,
      featured: false,
    },
    {
      id: "neuron-firing",
      title: "Neuron Action Potential",
      description: "Observe the electrical signals in neurons and how action potentials propagate along axons.",
      category: "neuroscience",
      difficulty: "Advanced",
      tags: ["neurons", "electrical", "brain"],
      thumbnail: "/placeholder.svg?height=200&width=300",
      modelPath: "/models/neuron.glb",
      views: 876,
      featured: false,
    },
    {
      id: "wave-interference",
      title: "Wave Interference Patterns",
      description:
        "Study how waves interact to create interference patterns, including constructive and destructive interference.",
      category: "physics",
      difficulty: "Intermediate",
      tags: ["waves", "interference", "optics"],
      thumbnail: "/placeholder.svg?height=200&width=300",
      modelPath: "/models/waves.glb",
      views: 654,
      featured: true,
    },
    {
      id: "gene-expression",
      title: "Gene Expression Regulation",
      description:
        "Explore how genes are regulated and expressed through transcription factors and other regulatory mechanisms.",
      category: "genetics",
      difficulty: "Advanced",
      tags: ["genes", "regulation", "expression"],
      thumbnail: "/placeholder.svg?height=200&width=300",
      modelPath: "/models/gene.glb",
      views: 432,
      featured: false,
    },
  ])

  // State for filtering and viewing
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [filteredExperiments, setFilteredExperiments] = useState<Experiment[]>(experiments)
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null)
  const [expandedExperiments, setExpandedExperiments] = useState<{ [key: string]: boolean }>({})

  // Apply filters when any filter state changes
  useEffect(() => {
    let result = [...experiments]

    // Category filter
    if (activeCategory !== "all") {
      result = result.filter((exp) => exp.category === activeCategory)
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      result = result.filter((exp) => exp.difficulty === difficultyFilter)
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (exp) =>
          exp.title.toLowerCase().includes(query) ||
          exp.description.toLowerCase().includes(query) ||
          exp.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Sorting
    if (sortBy === "popular") {
      result.sort((a, b) => b.views - a.views)
    } else if (sortBy === "newest") {
      // In a real app, you'd sort by date
      result.sort((a, b) => a.id.localeCompare(b.id))
    } else if (sortBy === "difficulty") {
      const difficultyValue = { Beginner: 1, Intermediate: 2, Advanced: 3 }
      result.sort(
        (a, b) =>
          difficultyValue[a.difficulty as keyof typeof difficultyValue] -
          difficultyValue[b.difficulty as keyof typeof difficultyValue],
      )
    }

    setFilteredExperiments(result)
  }, [experiments, activeCategory, searchQuery, difficultyFilter, sortBy])

  // Toggle experiment details expansion
  const toggleExpanded = (expId: string) => {
    setExpandedExperiments({
      ...expandedExperiments,
      [expId]: !expandedExperiments[expId],
    })
  }

  // Open experiment in 3D viewer
  const openExperiment = (experiment: Experiment) => {
    setSelectedExperiment(experiment)
  }

  // Close 3D viewer
  const closeExperiment = () => {
    setSelectedExperiment(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">
          Interactive Lab Experiments
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore scientific concepts through interactive 3D visualizations. Select an experiment to study phenomena
          across various scientific disciplines.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/80 backdrop-blur-md border rounded-lg shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search experiments or topics..."
              value={searchQuery}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {difficultyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            All
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <category.icon className="mr-2" size={16} />
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Experiments Grid - Same content for all tabs, filtering is handled by state */}
        <TabsContent value={activeCategory} className="mt-0">
          {filteredExperiments.length === 0 ? (
            <div className="text-center py-20">
              <Beaker className="mx-auto mb-4" size={48} />
              <p className="text-lg text-gray-500">No experiments found.</p>
              <p className="text-gray-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiments.map((experiment) => (
                <Card key={experiment.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={experiment.thumbnail || "/placeholder.svg"}
                      alt={experiment.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {experiment.featured && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-teal-500 to-blue-600">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{experiment.title}</CardTitle>
                      <Badge variant="outline" className="ml-2">
                        {experiment.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>
                      {categories.find((c) => c.id === experiment.category)?.name} • {experiment.views.toLocaleString()}{" "}
                      views
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className={expandedExperiments[experiment.id] ? "" : "line-clamp-2"}>{experiment.description}</p>
                    <button
                      onClick={() => toggleExpanded(experiment.id)}
                      className="text-sm text-teal-600 mt-1 flex items-center hover:underline"
                    >
                      {expandedExperiments[experiment.id] ? (
                        <>
                          <ChevronUp size={14} className="mr-1" /> Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} className="mr-1" /> Show more
                        </>
                      )}
                    </button>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {experiment.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => openExperiment(experiment)}
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                    >
                      Launch Experiment
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 3D Experiment Viewer Modal */}
      {selectedExperiment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedExperiment.title}</h2>
                <p className="text-muted-foreground">
                  {categories.find((c) => c.id === selectedExperiment.category)?.name} • {selectedExperiment.difficulty}
                </p>
              </div>
              <Button variant="outline" onClick={closeExperiment}>
                Close
              </Button>
            </div>
            <div className="flex-grow overflow-hidden min-h-[500px]">
              <ExperimentViewer experiment={selectedExperiment} />
            </div>
            <div className="p-4 border-t">
              <h3 className="font-semibold mb-2">Description</h3>
              <p>{selectedExperiment.description}</p>
              <div className="mt-4 flex justify-between">
                <div className="flex gap-2">
                  {selectedExperiment.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <ExternalLink size={14} />
                  Full Screen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
