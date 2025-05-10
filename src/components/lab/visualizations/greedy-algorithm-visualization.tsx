"use client"

import { useRef, useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Play, Shuffle } from "lucide-react"

interface Edge {
  from: number
  to: number
  weight: number
  selected?: boolean
}

interface GreedyAlgorithmVisualizationProps {
  currentStep: number
  speed: number
  isPlaying: boolean
}

export default function GreedyAlgorithmVisualization({
  currentStep,
  speed,
  isPlaying,
}: GreedyAlgorithmVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [algorithm, setAlgorithm] = useState<string>("kruskal")
  const [message, setMessage] = useState<string>("")
  const [nodes, setNodes] = useState<{ x: number, y: number }[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [algorithmSteps, setAlgorithmSteps] = useState<Edge[][]>([])
  
  // Initialize canvas and create random graph
  useEffect(() => {
    if (!canvasRef.current) return
    
    // Create initial graph
    createRandomGraph()
    
    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current) return
      
      const canvas = canvasRef.current
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
      
      drawGraph()
    }
    
    window.addEventListener("resize", handleResize)
    handleResize()
    
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])
  
  // Update visualization when step changes
  useEffect(() => {
    if (algorithmSteps.length > 0 && currentStep > 0) {
      const stepIndex = Math.min(currentStep - 1, algorithmSteps.length - 1)
      updateVisualization(algorithmSteps[stepIndex])
    }
  }, [currentStep, algorithmSteps])
  
  // Draw the graph whenever nodes or edges change
  useEffect(() => {
    drawGraph()
  }, [nodes, edges])
  
  // Create a random graph
  const createRandomGraph = () => {
    // Create nodes
    const numNodes = 8
    const radius = 160
    const centerX = canvasRef.current ? canvasRef.current.width / 2 : 250
    const centerY = canvasRef.current ? canvasRef.current.height / 2 : 250
    const newNodes: { x: number, y: number }[] = []
    
    for (let i = 0; i < numNodes; i++) {
      // Position nodes in a circle
      const angle = (i / numNodes) * Math.PI * 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      newNodes.push({ x, y })
    }
    
    setNodes(newNodes)
    
    // Create edges with random weights
    const newEdges: Edge[] = []
    
    // Create a connected graph (minimum spanning tree) to ensure connectivity
    const visited = new Array(numNodes).fill(false)
    visited[0] = true
    let visitedCount = 1
    
    while (visitedCount < numNodes) {
      for (let i = 0; i < numNodes; i++) {
        if (!visited[i]) continue
        
        for (let j = 0; j < numNodes; j++) {
          if (visited[j] || i === j) continue
          
          // Add edge between visited and unvisited node
          const weight = Math.floor(Math.random() * 9) + 1 // Random weight between 1-9
          const edge: Edge = { from: i, to: j, weight, selected: false }
          newEdges.push(edge)
          visited[j] = true
          visitedCount++
          break
        }
        if (visitedCount === numNodes) break
      }
    }
    
    // Add some additional random edges
    const additionalEdges = Math.floor(numNodes * 0.7)
    for (let i = 0; i < additionalEdges; i++) {
      const from = Math.floor(Math.random() * numNodes)
      let to = Math.floor(Math.random() * numNodes)
      
      // Ensure we don't create self-loops or duplicate edges
      while (
        to === from ||
        newEdges.some((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from))
      ) {
        to = Math.floor(Math.random() * numNodes)
      }
      
      const weight = Math.floor(Math.random() * 9) + 1 // Random weight between 1-9
      const edge: Edge = { from, to, weight, selected: false }
      newEdges.push(edge)
    }
    
    setEdges(newEdges)
    setAlgorithmSteps([])
    setMessage(`Created random graph with ${numNodes} nodes and ${newEdges.length} edges`)
  }
  
  // Draw the graph on canvas
  const drawGraph = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid (optional)
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5
    
    const gridSize = 20
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    // Draw edges
    edges.forEach(edge => {
      const startNode = nodes[edge.from]
      const endNode = nodes[edge.to]
      
      if (!startNode || !endNode) return
      
      // Draw edge line
      ctx.beginPath()
      ctx.moveTo(startNode.x, startNode.y)
      ctx.lineTo(endNode.x, endNode.y)
      ctx.strokeStyle = edge.selected ? '#10b981' : '#666666' // Green if selected, gray otherwise
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Draw weight label
      const midX = (startNode.x + endNode.x) / 2
      const midY = (startNode.y + endNode.y) / 2
      
      // Add small white background for better readability
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(midX, midY, 12, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = 'black'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(edge.weight.toString(), midX, midY)
    })
    
    // Draw nodes
    nodes.forEach((node, index) => {
      // Draw node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, 16, 0, Math.PI * 2)
      ctx.fillStyle = '#8b5cf6' // Lavender
      ctx.fill()
      
      // Draw node ID
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(index.toString(), node.x, node.y)
    })
  }
  
  // Update the visualization for a specific step
  const updateVisualization = (selectedEdges: Edge[]) => {
    // Reset all edges to unselected
    const updatedEdges = edges.map(edge => ({ ...edge, selected: false }))
    
    // Highlight selected edges
    selectedEdges.forEach(selectedEdge => {
      const edgeIndex = updatedEdges.findIndex(
        e => (e.from === selectedEdge.from && e.to === selectedEdge.to) || 
             (e.from === selectedEdge.to && e.to === selectedEdge.from)
      )
      
      if (edgeIndex !== -1) {
        updatedEdges[edgeIndex].selected = true
      }
    })
    
    setEdges(updatedEdges)
    
    // Update message based on algorithm
    if (algorithm === "kruskal") {
      setMessage(
        `Kruskal's MST: Selected ${selectedEdges.length} edges with total weight ${selectedEdges.reduce((sum, edge) => sum + edge.weight, 0)}`
      )
    } else if (algorithm === "activity") {
      setMessage(`Activity Selection: Selected ${selectedEdges.length} non-overlapping activities`)
    }
  }

  // Run Kruskal's algorithm
  const runKruskal = () => {
    if (edges.length === 0 || nodes.length === 0) return
    
    // Sort edges by weight
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight)
    
    // Initialize disjoint set for cycle detection
    const parent = Array.from({ length: nodes.length }, (_, i) => i)
    
    // Find function for disjoint set
    const find = (i: number): number => {
      if (parent[i] !== i) {
        parent[i] = find(parent[i])
      }
      return parent[i]
    }
    
    // Union function for disjoint set
    const union = (i: number, j: number) => {
      parent[find(i)] = find(j)
    }
    
    const mst: Edge[] = []
    const steps: Edge[][] = []
    
    for (const edge of sortedEdges) {
      const rootFrom = find(edge.from)
      const rootTo = find(edge.to)
      
      // If including this edge doesn't form a cycle
      if (rootFrom !== rootTo) {
        mst.push(edge)
        union(edge.from, edge.to)
        steps.push([...mst]) // Save current state of MST
      }
    }
    
    setAlgorithmSteps(steps)
    setMessage(`Kruskal's MST: Starting with ${edges.length} edges`)
  }
  
  // Run Activity Selection algorithm
  const runActivitySelection = () => {
    if (edges.length === 0) return
    
    // For activity selection, we'll interpret edges as activities
    // with 'from' as start time and 'to' as end time
    // We'll use the weight as the activity duration
    
    // Create activities from edges
    const activities = edges.map((edge) => ({
      ...edge,
      start: edge.from,
      end: edge.from + edge.weight, // End time = start time + duration
    }))
    
    // Sort activities by end time
    const sortedActivities = [...activities].sort((a, b) => a.end - b.end)
    
    const selected: Edge[] = []
    const steps: Edge[][] = []
    
    // Select first activity
    if (sortedActivities.length > 0) {
      selected.push(sortedActivities[0])
      steps.push([...selected])
    }
    
    // Select remaining compatible activities
    let lastEnd = sortedActivities[0]?.end || 0
    
    for (let i = 1; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i]
      
      // If this activity starts after the last selected activity ends
      if (activity.start >= lastEnd) {
        selected.push(activity)
        lastEnd = activity.end
        steps.push([...selected])
      }
    }
    
    setAlgorithmSteps(steps)
    setMessage(`Activity Selection: Starting with ${activities.length} activities`)
  }
  
  // Execute the selected algorithm
  const executeAlgorithm = () => {
    switch (algorithm) {
      case "kruskal":
        runKruskal()
        break
      case "activity":
        runActivitySelection()
        break
      default:
        break
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-white border-b">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="algorithm" className="text-black">
              Algorithm
            </Label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger id="algorithm" className="w-[220px]">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kruskal">Kruskal's MST</SelectItem>
                <SelectItem value="activity">Activity Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" onClick={createRandomGraph} className="mb-0.5">
            <Shuffle className="mr-2 h-4 w-4" />
            New Graph
          </Button>
          
          <Button onClick={executeAlgorithm} className="mb-0.5">
            <Play className="mr-2 h-4 w-4" />
            Run Algorithm
          </Button>
        </div>
        
        {message && <div className="mt-2 text-sm font-medium text-black">{message}</div>}
      </div>
      
      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
}