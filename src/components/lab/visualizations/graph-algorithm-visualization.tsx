"use client"

import { useRef, useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Play } from "lucide-react"

interface GraphNode {
  id: number
  x: number
  y: number
  connections: number[]
}

interface GraphAlgorithmVisualizationProps {
  currentStep: number
  speed: number
  isPlaying: boolean
}

export default function GraphAlgorithmVisualization({
  currentStep,
  speed,
  isPlaying,
}: GraphAlgorithmVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [algorithm, setAlgorithm] = useState<string>("bfs")
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [message, setMessage] = useState<string>("")
  const [visitedNodes, setVisitedNodes] = useState<number[]>([])
  const [currentNode, setCurrentNode] = useState<number | null>(null)
  const [startNode, setStartNode] = useState<number>(0)

  // Initialize canvas and create initial graph
  useEffect(() => {
    if (!canvasRef.current) return

    // Create initial graph
    createInitialGraph()
    
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

  // Update visualization when currentStep changes
  useEffect(() => {
    if (currentStep > 0 && visitedNodes.length > 0) {
      const nodeIndex = Math.min(currentStep - 1, visitedNodes.length - 1)
      highlightNode(visitedNodes[nodeIndex])
    }
  }, [currentStep, visitedNodes])
  
  // Draw the graph whenever nodes, currentNode, or visitedNodes change
  useEffect(() => {
    drawGraph()
  }, [nodes, currentNode, visitedNodes])

  // Create initial graph
  const createInitialGraph = () => {
    const scale = 50 // Scale factor for node positions
    const offsetX = canvasRef.current ? canvasRef.current.width / 2 : 250
    const offsetY = canvasRef.current ? canvasRef.current.height / 2 : 250
    
    // Create a 3x3 grid of nodes
    const newNodes: GraphNode[] = [
      { id: 0, x: offsetX - scale, y: offsetY - scale, connections: [1, 3] },
      { id: 1, x: offsetX, y: offsetY - scale, connections: [0, 2, 4] },
      { id: 2, x: offsetX + scale, y: offsetY - scale, connections: [1, 5] },
      { id: 3, x: offsetX - scale, y: offsetY, connections: [0, 4, 6] },
      { id: 4, x: offsetX, y: offsetY, connections: [1, 3, 5, 7] },
      { id: 5, x: offsetX + scale, y: offsetY, connections: [2, 4, 8] },
      { id: 6, x: offsetX - scale, y: offsetY + scale, connections: [3, 7] },
      { id: 7, x: offsetX, y: offsetY + scale, connections: [4, 6, 8] },
      { id: 8, x: offsetX + scale, y: offsetY + scale, connections: [5, 7] },
    ]

    setNodes(newNodes)
    setMessage("Graph created with 9 nodes")
    
    // Reset visualization state
    resetVisualization()
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
    ctx.lineWidth = 2
    ctx.strokeStyle = '#333333'
    
    nodes.forEach(node => {
      node.connections.forEach(connectedId => {
        // Only draw each edge once (when from node id < to node id)
        if (node.id < connectedId) {
          const connectedNode = nodes.find(n => n.id === connectedId)
          if (connectedNode) {
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(connectedNode.x, connectedNode.y)
            ctx.stroke()
          }
        }
      })
    })
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 16, 0, Math.PI * 2)
      
      // Set fill color based on node state
      if (currentNode === node.id) {
        ctx.fillStyle = '#ef4444' // Red for current node
      } else if (visitedNodes.includes(node.id)) {
        ctx.fillStyle = '#10b981' // Green for visited nodes
      } else {
        ctx.fillStyle = '#8b5cf6' // Lavender for unvisited nodes
      }
      
      ctx.fill()
      
      // Draw node ID
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.id.toString(), node.x, node.y)
    })
  }

  // Highlight a node
  const highlightNode = (nodeId: number) => {
    setCurrentNode(nodeId)
    
    // Update message
    if (algorithm === "bfs") {
      setMessage(`BFS: Visiting node ${nodeId}`)
    } else if (algorithm === "dfs") {
      setMessage(`DFS: Visiting node ${nodeId}`)
    }
  }

  // Run Breadth-First Search
  const runBFS = () => {
    if (nodes.length === 0) return

    // Reset previous visualization
    resetVisualization()

    const visited: boolean[] = Array(nodes.length).fill(false)
    const queue: number[] = []
    const visitOrder: number[] = []

    // Start from the selected node
    queue.push(startNode)
    visited[startNode] = true

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      visitOrder.push(nodeId)

      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        // Add all unvisited neighbors to queue
        node.connections.forEach((connectedId) => {
          if (!visited[connectedId]) {
            queue.push(connectedId)
            visited[connectedId] = true
          }
        })
      }
    }

    setVisitedNodes(visitOrder)
    setMessage(`BFS starting from node ${startNode}`)
  }

  // Run Depth-First Search
  const runDFS = () => {
    if (nodes.length === 0) return

    // Reset previous visualization
    resetVisualization()

    const visited: boolean[] = Array(nodes.length).fill(false)
    const visitOrder: number[] = []

    // DFS recursive function
    const dfs = (nodeId: number) => {
      visited[nodeId] = true
      visitOrder.push(nodeId)

      const node = nodes.find((n) => n.id === nodeId)
      if (node) {
        // Visit all unvisited neighbors
        node.connections.forEach((connectedId) => {
          if (!visited[connectedId]) {
            dfs(connectedId)
          }
        })
      }
    }

    // Start from the selected node
    dfs(startNode)

    setVisitedNodes(visitOrder)
    setMessage(`DFS starting from node ${startNode}`)
  }

  // Reset visualization
  const resetVisualization = () => {
    setVisitedNodes([])
    setCurrentNode(null)
  }

  // Execute the selected algorithm
  const executeAlgorithm = () => {
    switch (algorithm) {
      case "bfs":
        runBFS()
        break
      case "dfs":
        runDFS()
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
            <Label htmlFor="algorithm">Algorithm</Label>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger id="algorithm" className="w-[180px]">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bfs">Breadth-First Search</SelectItem>
                <SelectItem value="dfs">Depth-First Search</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startNode">Start Node</Label>
            <Select 
              value={startNode.toString()} 
              onValueChange={(value) => setStartNode(Number.parseInt(value))}
            >
              <SelectTrigger id="startNode" className="w-[100px]">
                <SelectValue placeholder="Start node" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id.toString()}>
                    Node {node.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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