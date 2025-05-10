"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react'
import LinkedListVisualization from "./visualizations/linked-list-visualization"
import DynamicProgrammingVisualization from "./visualizations/dynamic-programming-visualization"
import SortingVisualization from "./visualizations/sorting-visualization"
import GraphAlgorithmVisualization from "./visualizations/graph-algorithm-visualization"
import SearchingVisualization from "./visualizations/searching-visualization"
import GreedyAlgorithmVisualization from "./visualizations/greedy-algorithm-visualization"
// Define the available visualizations
const VISUALIZATIONS = [
  { id: "linked-list", name: "Linked List", description: "Visualize singly and doubly linked lists operations" },
  {
    id: "dynamic-programming",
    name: "Dynamic Programming",
    description: "Visualize DP algorithms like Fibonacci and Knapsack",
  },
  { id: "sorting", name: "Sorting Algorithms", description: "Visualize various sorting algorithms in 3D space" },
  { id: "graph", name: "Graph Algorithms", description: "Visualize graph traversal and shortest path algorithms" },
  {
    id: "searching",
    name: "Searching Algorithms",
    description: "Visualize binary search and other searching techniques",
  },
  {
    id: "greedy",
    name: "Greedy Algorithms",
    description: "Visualize greedy algorithms like Minimum Spanning Tree and Activity Selection",
  },
  {
    id: "backtracking",
    name: "Backtracking",
    description: "Visualize backtracking algorithms like N-Queens and Sudoku Solver",
  },
]

export default function DSAVisualizationLab() {
  const [activeVisualization, setActiveVisualization] = useState("linked-list")
  const [speed, setSpeed] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [maxSteps, setMaxSteps] = useState(0)

  // Function to handle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Function to reset visualization
  const resetVisualization = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  // Function to step forward
  const stepForward = () => {
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Function to step backward
  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Update maxSteps based on the active visualization
  useEffect(() => {
    // This would be set dynamically based on the actual visualization
    // For now, setting some default values
    switch (activeVisualization) {
      case "linked-list":
        setMaxSteps(10)
        break
      case "dynamic-programming":
        setMaxSteps(15)
        break
      case "sorting":
        setMaxSteps(20)
        break
      case "graph":
        setMaxSteps(12)
        break
      case "searching":
        setMaxSteps(8)
        break
      case "greedy":
        setMaxSteps(15)
        break
      case "backtracking":
        setMaxSteps(25)
        break
      default:
        setMaxSteps(10)
    }

    // Reset to step 0 when changing visualizations
    setCurrentStep(0)
    setIsPlaying(false)
  }, [activeVisualization])

  // Auto-advance steps when playing
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(
      () => {
        setCurrentStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      },
      1000 - speed * 9,
    ) // Map 1-100 to 100ms-1000ms

    return () => clearInterval(interval)
  }, [isPlaying, maxSteps, speed])

  // Render the appropriate visualization component
  const renderVisualization = () => {
    const props = {
      currentStep,
      speed,
      isPlaying,
    }

    switch (activeVisualization) {
      case "linked-list":
        return <LinkedListVisualization />
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
        return <div>Select a visualization</div>
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3 space-y-4">
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
                {VISUALIZATIONS.find((v) => v.id === activeVisualization)?.description}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Controls</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button variant="outline" size="icon" onClick={stepBackward} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button variant={isPlaying ? "destructive" : "default"} onClick={togglePlayPause} className="px-6">
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

                <Button variant="outline" size="icon" onClick={stepForward} disabled={currentStep === maxSteps}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" onClick={resetVisualization} className="w-full">
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

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Algorithm Details</h2>
            <div className="space-y-4">
              {activeVisualization === "linked-list" && (
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Linked List Operations</h3>
                  <p className="text-sm text-muted-foreground">
                    A linked list is a linear data structure where elements are stored in nodes, and each node points to
                    the next node in the sequence.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-black">Operations:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Insertion (at beginning, end, or position)</li>
                      <li>Deletion (from beginning, end, or position)</li>
                      <li>Traversal</li>
                      <li>Searching</li>
                      <li>Reversal</li>
                    </ul>
                  </div>
                  <div className="text-sm space-y-1 pt-2">
                    <div className="font-medium text-black">Time Complexity:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Access: O(n)</li>
                      <li>Search: O(n)</li>
                      <li>Insertion: O(1) - with reference to node</li>
                      <li>Deletion: O(1) - with reference to node</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeVisualization === "dynamic-programming" && (
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Dynamic Programming</h3>
                  <p className="text-sm text-muted-foreground">
                    Dynamic Programming is an algorithmic technique for solving complex problems by breaking them down
                    into simpler subproblems and storing the results to avoid redundant calculations.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-black">Key Concepts:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Optimal Substructure</li>
                      <li>Overlapping Subproblems</li>
                      <li>Memoization (Top-down)</li>
                      <li>Tabulation (Bottom-up)</li>
                    </ul>
                  </div>
                  <div className="text-sm space-y-1 pt-2">
                    <div className="font-medium text-black">Common Problems:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Fibonacci Sequence</li>
                      <li>Knapsack Problem</li>
                      <li>Longest Common Subsequence</li>
                      <li>Matrix Chain Multiplication</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeVisualization === "sorting" && (
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Sorting Algorithms</h3>
                  <p className="text-sm text-muted-foreground">
                    Sorting algorithms arrange elements in a specific order, typically in ascending or descending order.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-black">Common Algorithms:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Bubble Sort - O(n²)</li>
                      <li>Selection Sort - O(n²)</li>
                      <li>Insertion Sort - O(n²)</li>
                      <li>Merge Sort - O(n log n)</li>
                      <li>Quick Sort - O(n log n) average</li>
                      <li>Heap Sort - O(n log n)</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeVisualization === "graph" && (
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Graph Algorithms</h3>
                  <p className="text-sm text-muted-foreground">
                    Graph algorithms solve problems related to graph data structures, consisting of vertices and edges.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-black">Common Algorithms:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Breadth-First Search (BFS)</li>
                      <li>Depth-First Search (DFS)</li>
                      <li>Dijkstra's Algorithm</li>
                      <li>Bellman-Ford Algorithm</li>
                      <li>Minimum Spanning Tree (Prim's, Kruskal's)</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeVisualization === "searching" && (
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Searching Algorithms</h3>
                  <p className="text-sm text-muted-foreground">
                    Searching algorithms find the position of a target value within a data structure.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-black">Common Algorithms:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Linear Search - O(n)</li>
                      <li>Binary Search - O(log n)</li>
                      <li>Jump Search - O(√n)</li>
                      <li>Interpolation Search - O(log log n) average</li>
                      <li>Exponential Search - O(log n)</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeVisualization === "greedy" && (
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Greedy Algorithms</h3>
                  <p className="text-sm text-muted-foreground">
                    Greedy algorithms make locally optimal choices at each step with the hope of finding a global optimum.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-black">Key Characteristics:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Makes locally optimal choices</li>
                      <li>Never reconsiders previous choices</li>
                      <li>Simple and efficient implementation</li>
                      <li>May not always find the global optimum</li>
                    </ul>
                  </div>
                  <div className="text-sm space-y-1 pt-2">
                    <div className="font-medium text-black">Common Problems:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Minimum Spanning Tree (Kruskal's, Prim's)</li>
                      <li>Activity Selection Problem</li>
                      <li>Huffman Coding</li>
                      <li>Fractional Knapsack</li>
                      <li>Coin Change (with certain constraints)</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeVisualization === "backtracking" && (
                <div className="space-y-2">
                  <h3 className="font-medium text-black">Backtracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Backtracking is an algorithmic technique that builds solutions incrementally and abandons a solution as soon as it determines the solution cannot be completed.
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="font-medium text-black">Key Characteristics:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Depth-first search approach</li>
                      <li>Explores all possible solutions</li>
                      <li>Prunes search space when constraints are violated</li>
                      <li>Often used for constraint satisfaction problems</li>
                    </ul>
                  </div>
                  <div className="text-sm space-y-1 pt-2">
                    <div className="font-medium text-black">Common Problems:</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>N-Queens Problem</li>
                      <li>Sudoku Solver</li>
                      <li>Maze Solving</li>
                      <li>Hamiltonian Path</li>
                      <li>Subset Sum</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:w-2/3 bg-white rounded-lg overflow-hidden h-[600px] border border-gray-200">{renderVisualization()}</div>
    </div>
  )
}
