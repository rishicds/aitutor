"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Code, Eye } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import LinkedListVisualization from "@/components/lab/visualizations/linked-list-visualization"
import DynamicProgrammingVisualization from "@/components/lab/visualizations/dynamic-programming-visualization"
import GreedyAlgorithmVisualization from "@/components/lab/visualizations/greedy-algorithm-visualization"
import GraphAlgorithmVisualization from "@/components/lab/visualizations/graph-algorithm-visualization"
import SearchingVisualization from "@/components/lab/visualizations/searching-visualization"
import SortingVisualization from "@/components/lab/visualizations/sorting-visualization"

// Define the available visualizations with their details
const ALGORITHM_DATA = {
  "linked-list": {
    name: "Linked List Operations",
    description: "A linked list is a linear data structure where elements are stored in nodes, and each node points to the next node in the sequence.",
    operations: ["Insertion (at beginning, end, or position)", "Deletion (from beginning, end, or position)", "Traversal", "Searching", "Reversal"],
    complexity: ["Access: O(n)", "Search: O(n)", "Insertion: O(1) - with reference to node", "Deletion: O(1) - with reference to node"],
    maxSteps: 10
  },
  "dynamic-programming": {
    name: "Dynamic Programming",
    description: "Dynamic Programming is an algorithmic technique for solving complex problems by breaking them down into simpler subproblems and storing the results to avoid redundant calculations.",
    concepts: ["Optimal Substructure", "Overlapping Subproblems", "Memoization (Top-down)", "Tabulation (Bottom-up)"],
    problems: ["Fibonacci Sequence", "Knapsack Problem", "Longest Common Subsequence", "Matrix Chain Multiplication"],
    maxSteps: 15
  },
  "sorting": {
    name: "Sorting Algorithms",
    description: "Sorting algorithms arrange elements in a specific order, typically in ascending or descending order.",
    algorithms: ["Bubble Sort - O(n²)", "Selection Sort - O(n²)", "Insertion Sort - O(n²)", "Merge Sort - O(n log n)", "Quick Sort - O(n log n) average", "Heap Sort - O(n log n)"],
    maxSteps: 20
  },
  "graph": {
    name: "Graph Algorithms",
    description: "Graph algorithms solve problems related to graph data structures, consisting of vertices and edges.",
    algorithms: ["Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Dijkstra's Algorithm", "Bellman-Ford Algorithm", "Minimum Spanning Tree (Prim's, Kruskal's)"],
    maxSteps: 12
  },
  "searching": {
    name: "Searching Algorithms", 
    description: "Searching algorithms find the position of a target value within a data structure.",
    algorithms: ["Linear Search - O(n)", "Binary Search - O(log n)", "Jump Search - O(√n)", "Interpolation Search - O(log log n) average", "Exponential Search - O(log n)"],
    maxSteps: 8
  },
  "greedy": {
    name: "Greedy Algorithms",
    description: "Greedy algorithms make locally optimal choices at each step with the hope of finding a global optimum.",
    characteristics: ["Makes locally optimal choices", "Never reconsiders previous choices", "Simple and efficient implementation", "May not always find the global optimum"],
    problems: ["Minimum Spanning Tree (Kruskal's, Prim's)", "Activity Selection Problem", "Huffman Coding", "Fractional Knapsack", "Coin Change (with certain constraints)"],
    maxSteps: 15
  },
  "backtracking": {
    name: "Backtracking",
    description: "Backtracking is an algorithmic technique that builds solutions incrementally and abandons a solution as soon as it determines the solution cannot be completed.",
    characteristics: ["Depth-first search approach", "Explores all possible solutions", "Prunes search space when constraints are violated", "Often used for constraint satisfaction problems"],
    problems: ["N-Queens Problem", "Sudoku Solver", "Maze Solving", "Hamiltonian Path", "Subset Sum"],
    maxSteps: 25
  }
}

// Visualization options - for the select dropdown
const VISUALIZATIONS = Object.entries(ALGORITHM_DATA).map(([id, data]) => ({
  id,
  name: data.name,
  description: data.description
}))

// Helper function to generate code using AI
async function generateDSACode(algorithm: string, prompt: string) {
  try {
    const response = await fetch('/api/generate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        algorithm,
        prompt
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate code');
    }
    
    const data = await response.json();
    return data.code;
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

export default function DSAVisualizationLab() {
  const [activeVisualization, setActiveVisualization] = useState("linked-list")
  const [speed, setSpeed] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [maxSteps, setMaxSteps] = useState(10)
  const [activeTab, setActiveTab] = useState("visualize")
  const [codePrompt, setCodePrompt] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedCodes, setSavedCodes] = useState<Record<string, string>>({})
  const { toast } = useToast()

  // Reset visualization state when changing algorithm
  useEffect(() => {
    // Set max steps based on the current visualization
    setMaxSteps(ALGORITHM_DATA[activeVisualization]?.maxSteps || 10)
    setCurrentStep(0)
    setIsPlaying(false)
    
    // Load previously saved code for this algorithm if it exists
    if (savedCodes[activeVisualization]) {
      setGeneratedCode(savedCodes[activeVisualization])
    } else {
      setGeneratedCode("")
    }
  }, [activeVisualization, savedCodes])

  // Auto-advance steps when playing
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= maxSteps) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 1000 - speed * 9) // Map 1-100 to 100ms-1000ms

    return () => clearInterval(interval)
  }, [isPlaying, maxSteps, speed])

  // Action handlers consolidated into a single object
  const controls = {
    togglePlayPause: () => setIsPlaying(prev => !prev),
    resetVisualization: () => {
      setCurrentStep(0)
      setIsPlaying(false)
    },
    stepForward: () => currentStep < maxSteps && setCurrentStep(prev => prev + 1),
    stepBackward: () => currentStep > 0 && setCurrentStep(prev => prev - 1)
  }

  // Get current algorithm data
  const currentAlgorithm = ALGORITHM_DATA[activeVisualization]
  
  // Handle code generation
  const handleGenerateCode = async () => {
    if (!codePrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description of the code you want to generate.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const code = await generateDSACode(
        currentAlgorithm.name,
        `Generate JavaScript/TypeScript implementation for ${codePrompt} related to ${currentAlgorithm.name}`
      )
      setGeneratedCode(code)
      
      // Save this code for the current algorithm
      setSavedCodes(prev => ({
        ...prev,
        [activeVisualization]: code
      }))

      toast({
        title: "Code generated successfully",
        description: "Your algorithm code is ready to explore."
      })
    } catch (error) {
      toast({
        title: "Failed to generate code",
        description: "There was an error generating the code. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle switching to visualization tab
  const handleSwitchToVisualize = () => {
    setActiveTab("visualize")
  }

  // Render the appropriate visualization component
  const renderVisualization = () => {
    const props = {
      currentStep,
      speed,
      isPlaying,
    }

    switch (activeVisualization) {
      case "linked-list":
        return <LinkedListVisualization {...props} />
      case "dynamic-programming":
        return <DynamicProgrammingVisualization {...props} />
      case "sorting":
        return <SortingVisualization {...props} />
      case "graph":
        return <GraphAlgorithmVisualization {...props} />
      case "searching":
        return <SearchingVisualization {...props} />
      case "greedy":
        return <GreedyAlgorithmVisualization {...props} />
      
      default:
        return <div className="flex items-center justify-center h-full">Select a visualization</div>
    }
  }

  // Render the current algorithm details
  const renderAlgorithmDetails = () => {
    if (!currentAlgorithm) return null;
    
    return (
      <div className="space-y-2">
        <h3 className="font-medium text-black">{currentAlgorithm.name}</h3>
        <p className="text-sm text-muted-foreground">{currentAlgorithm.description}</p>
        
        {currentAlgorithm.operations && (
          <div className="text-sm space-y-1">
            <div className="font-medium text-black">Operations:</div>
            <ul className="list-disc list-inside text-muted-foreground">
              {currentAlgorithm.operations.map((op, i) => <li key={i}>{op}</li>)}
            </ul>
          </div>
        )}
        
        {currentAlgorithm.complexity && (
          <div className="text-sm space-y-1 pt-2">
            <div className="font-medium text-black">Time Complexity:</div>
            <ul className="list-disc list-inside text-muted-foreground">
              {currentAlgorithm.complexity.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
        
        {currentAlgorithm.concepts && (
          <div className="text-sm space-y-1">
            <div className="font-medium text-black">Key Concepts:</div>
            <ul className="list-disc list-inside text-muted-foreground">
              {currentAlgorithm.concepts.map((concept, i) => <li key={i}>{concept}</li>)}
            </ul>
          </div>
        )}
        
        {currentAlgorithm.algorithms && (
          <div className="text-sm space-y-1">
            <div className="font-medium text-black">Common Algorithms:</div>
            <ul className="list-disc list-inside text-muted-foreground">
              {currentAlgorithm.algorithms.map((algo, i) => <li key={i}>{algo}</li>)}
            </ul>
          </div>
        )}
        
        {currentAlgorithm.problems && (
          <div className="text-sm space-y-1 pt-2">
            <div className="font-medium text-black">Common Problems:</div>
            <ul className="list-disc list-inside text-muted-foreground">
              {currentAlgorithm.problems.map((problem, i) => <li key={i}>{problem}</li>)}
            </ul>
          </div>
        )}
        
        {currentAlgorithm.characteristics && (
          <div className="text-sm space-y-1">
            <div className="font-medium text-black">Key Characteristics:</div>
            <ul className="list-disc list-inside text-muted-foreground">
              {currentAlgorithm.characteristics.map((char, i) => <li key={i}>{char}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Control Panel */}
      <div className="lg:w-1/3 space-y-4">
        {/* Visualization Selection */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Select Visualization</h2>
            <div className="space-y-4">
              <Select value={activeVisualization} onValueChange={setActiveVisualization}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a visualization" />
                </SelectTrigger>
                <SelectContent>
                  {VISUALIZATIONS.map((viz) => (
                    <SelectItem key={viz.id} value={viz.id}>
                      {viz.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {currentAlgorithm?.description}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Card */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Controls</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button variant="outline" size="icon" onClick={controls.stepBackward} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button variant={isPlaying ? "destructive" : "default"} onClick={controls.togglePlayPause} className="px-6">
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Play
                    </>
                  )}
                </Button>

                <Button variant="outline" size="icon" onClick={controls.stepForward} disabled={currentStep === maxSteps}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" onClick={controls.resetVisualization} className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="speed" className="text-black">Animation Speed</Label>
                  <span className="text-sm text-black">{speed}%</span>
                </div>
                <Slider
                  id="speed"
                  value={[speed]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={(value) => setSpeed(value[0])}
                />
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Slower</span>
                <span>Faster</span>
              </div>

              {/* Progress Bar */}
              <div className="pt-2 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-black">Current Step:</span>
                  <span className="text-sm text-black">
                    {currentStep} / {maxSteps}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: `${(currentStep / maxSteps) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Algorithm Details Card - Rendered dynamically based on current algorithm */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Algorithm Details</h2>
            <div className="space-y-4">
              {renderAlgorithmDetails()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Area */}
      <div className="lg:w-2/3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visualize" className="flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Visualize
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Generate Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visualize">
            <div className="bg-white rounded-lg overflow-hidden h-[600px] border border-gray-200">
              {renderVisualization()}
            </div>
          </TabsContent>

          <TabsContent value="code">
            <Card className="border rounded-lg">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-black">Generate Algorithm Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Describe what you want to implement related to {currentAlgorithm?.name} and get the code.
                  </p>
                </div>

                <div className="space-y-4">
                  <Textarea 
                    placeholder={`E.g., "Implement a function that reverses a linked list" or "Show me a recursive approach to the Fibonacci sequence"`}
                    value={codePrompt}
                    onChange={(e) => setCodePrompt(e.target.value)}
                    className="min-h-24"
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleGenerateCode} 
                      className="flex-1"
                      disabled={isGenerating}
                    >
                      {isGenerating ? "Generating..." : "Generate Code"}
                    </Button>
                    {generatedCode && (
                      <Button 
                        variant="outline" 
                        onClick={handleSwitchToVisualize}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualize
                      </Button>
                    )}
                  </div>
                </div>

                {generatedCode && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium mb-2 text-black">Generated Code:</h4>
                    <div className="relative">
                      <pre className="p-4 bg-gray-50 rounded-md overflow-x-auto text-sm">
                        <code>{generatedCode}</code>
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          toast({
                            title: "Copied to clipboard",
                            description: "Code has been copied to your clipboard."
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
