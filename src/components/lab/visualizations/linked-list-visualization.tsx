"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash, Search } from "lucide-react"


// Node class for linked list
class ListNode {
  value: number
  next: ListNode | null
  x: number
  y: number
  color: string
  
  constructor(value: number, x: number) {
    this.value = value
    this.next = null
    this.x = x
    this.y = 100
    this.color = "#8b5cf6" // Default lavender color
  }
}

export default function LinkedListVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const headRef = useRef<ListNode | null>(null)
  
  const [operation, setOperation] = useState<string>("insert-end")
  const [nodeValue, setNodeValue] = useState<string>("42")
  const [nodePosition, setNodePosition] = useState<string>("0")
  const [listSize, setListSize] = useState<number>(0)
  const [message, setMessage] = useState<string>("")
  
  // Initialize canvas and create initial linked list
  useEffect(() => {
    // Clear any existing list first
    headRef.current = null
    setListSize(0)
    
    // Create initial linked list with 3 nodes
    insertNode(10, null)
    insertNode(20, null)
    insertNode(30, null)
    
    // Start animation loop
    const animationId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationId)
  }, [])
  
  // Main draw function
  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Resize canvas to parent size
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw linked list
    drawLinkedList(ctx)
    
    // Continue animation loop
    requestAnimationFrame(draw)
  }
  
  // Draw the linked list
  const drawLinkedList = (ctx: CanvasRenderingContext2D) => {
    let current = headRef.current
    
    while (current) {
      // Draw arrow if there's a next node
      if (current.next) {
        drawArrow(ctx, current.x + 50, current.y, current.next.x - 50, current.y)
      }
      
      // Draw node
      drawNode(ctx, current)
      
      current = current.next
    }
  }
  
  // Draw a single node
  const drawNode = (ctx: CanvasRenderingContext2D, node: ListNode) => {
    // Draw circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, 40, 0, Math.PI * 2)
    ctx.fillStyle = node.color
    ctx.fill()
    ctx.strokeStyle = "#4c1d95"
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw value
    ctx.font = "bold 24px Arial"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(node.value.toString(), node.x, node.y)
  }
  
  // Draw an arrow between nodes
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    // Line
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Arrow head
    const headLength = 10
    const angle = Math.atan2(y2 - y1, x2 - x1)
    
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fillStyle = "#333333"
    ctx.fill()
  }
  
  // Update all node positions based on their index in the list
  const updateAllNodePositions = () => {
    const spacing = 150 // Space between nodes
    let current = headRef.current
    let index = 0
    
    while (current) {
      animateNodeMovement(current, index * spacing + 100, current.y)
      current = current.next
      index++
    }
  }
  
  // Count the actual number of nodes in the list
  const countNodes = () => {
    let count = 0
    let current = headRef.current
    
    while (current) {
      count++
      current = current.next
    }
    
    return count
  }
  
  // Insert a node into the linked list
  const insertNode = (value: number, position: number | null) => {
    const spacing = 150 // Space between nodes
    const currentSize = countNodes() // Get actual current size
    
    // Create new node at a temporary position
    const newNode = new ListNode(value, 0) // Will be positioned correctly later
    
    if (!headRef.current) {
      // Empty list
      headRef.current = newNode
      animateNodeMovement(newNode, 100, 100) // Position the first node
      setMessage(`Created head node with value ${value}`)
      setListSize(1)
      return
    }
    
    if (position === 0) {
      // Insert at beginning
      newNode.next = headRef.current
      headRef.current = newNode
      setMessage(`Inserted node with value ${value} at the beginning`)
    } else {
      // Insert at end or specific position
      let current = headRef.current
      let prev = null
      let index = 0
      
      // Find insertion point
      while (current && (position === null || index < position)) {
        prev = current
        current = current.next
        index++
      }
      
      if (prev) {
        prev.next = newNode
        
        if (current) {
          // Insert in middle
          newNode.next = current
          setMessage(`Inserted node with value ${value} at position ${index}`)
        } else {
          // Insert at end
          setMessage(`Inserted node with value ${value} at the end`)
        }
      }
    }
    
    // Update all node positions after insertion
    updateAllNodePositions()
    
    // Update list size
    const newSize = countNodes()
    setListSize(newSize)
  }
  
  // Delete a node from the linked list
  const deleteNode = (position: number) => {
    if (!headRef.current) {
      setMessage("List is empty")
      return
    }
    
    let current = headRef.current
    let prev = null
    let index = 0
    
    // Find node to delete
    while (current && index < position) {
      prev = current
      current = current.next
      index++
    }
    
    if (!current) {
      setMessage(`Position ${position} not found`)
      return
    }
    
    // Remove node from list
    if (prev) {
      prev.next = current.next
    } else {
      // Deleting head
      headRef.current = current.next
    }
    
    // Animate deletion
    animateNodeDeletion(current)
    
    // Update all node positions after deletion
    setTimeout(() => {
      updateAllNodePositions()
    }, 300) // Short delay to see the deletion animation
    
    setMessage(`Deleted node at position ${position}`)
    
    // Update list size
    const newSize = countNodes() - 1 // -1 because the node is visually still there during animation
    setListSize(newSize)
  }
  
  // Search for a value in the linked list
  const searchNode = (value: number) => {
    if (!headRef.current) {
      setMessage("List is empty")
      return
    }
    
    // Reset all nodes to default color
    resetNodeColors()
    
    // Animate search process
    let found = false
    const searchStep = (node: ListNode | null, idx: number) => {
      if (!node) {
        if (!found) {
          setMessage(`Value ${value} not found in the list`)
        }
        return
      }
      
      // Highlight current node being examined
      node.color = "#ffa500" // Orange for searching
      
      setTimeout(() => {
        if (node.value === value) {
          node.color = "#10b981" // Green for found
          setMessage(`Found value ${value} at position ${idx}`)
          found = true
        } else {
          node.color = "#8b5cf6" // Reset to default purple
          // Continue search with next node
          searchStep(node.next, idx + 1)
        }
      }, 500)
    }
    
    // Start search animation
    searchStep(headRef.current, 0)
  }
  
  // Reset all node colors
  const resetNodeColors = () => {
    let current = headRef.current
    
    while (current) {
      current.color = "#8b5cf6" // Default lavender
      current = current.next
    }
  }
  
  // Animate node movement
  const animateNodeMovement = (node: ListNode, targetX: number, targetY: number) => {
    const startX = node.x
    const startY = node.y
    const startTime = Date.now()
    const duration = 500
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Use easing function for smoother animation
      const easedProgress = easeInOutCubic(progress)
      
      // Interpolate position
      node.x = startX + (targetX - startX) * easedProgress
      node.y = startY + (targetY - startY) * easedProgress
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }
  
  // Animate node deletion
  const animateNodeDeletion = (node: ListNode) => {
    node.color = "#ef4444" // Red for deletion
  }
  
  // Easing function for smoother animations
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }
  
  // Handle operation execution
  const executeOperation = () => {
    const value = Number.parseInt(nodeValue)
    
    if (isNaN(value)) {
      setMessage("Please enter a valid number")
      return
    }
    
    switch (operation) {
      case "insert-beginning":
        insertNode(value, 0)
        break
      case "insert-end":
        insertNode(value, null)
        break
      case "insert-position":
        const pos = Number.parseInt(nodePosition)
        if (isNaN(pos) || pos < 0 || pos > listSize) {
          setMessage(`Position must be between 0 and ${listSize}`)
          return
        }
        insertNode(value, pos)
        break
      case "delete-beginning":
        deleteNode(0)
        break
      case "delete-end":
        deleteNode(listSize - 1)
        break
      case "delete-position":
        const delPos = Number.parseInt(nodePosition)
        if (isNaN(delPos) || delPos < 0 || delPos >= listSize) {
          setMessage(`Position must be between 0 and ${listSize - 1}`)
          return
        }
        deleteNode(delPos)
        break
      case "search":
        searchNode(value)
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
            <Label htmlFor="operation">Operation</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger id="operation" className="w-[180px]">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="insert-beginning">Insert at Beginning</SelectItem>
                <SelectItem value="insert-end">Insert at End</SelectItem>
                <SelectItem value="insert-position">Insert at Position</SelectItem>
                <SelectItem value="delete-beginning">Delete from Beginning</SelectItem>
                <SelectItem value="delete-end">Delete from End</SelectItem>
                <SelectItem value="delete-position">Delete from Position</SelectItem>
                <SelectItem value="search">Search</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nodeValue">Value</Label>
            <Input
              id="nodeValue"
              type="number"
              value={nodeValue}
              onChange={(e) => setNodeValue(e.target.value)}
              className="w-[100px]"
            />
          </div>
          
          {(operation === "insert-position" || operation === "delete-position") && (
            <div className="space-y-2">
              <Label htmlFor="nodePosition">Position</Label>
              <Input
                id="nodePosition"
                type="number"
                value={nodePosition}
                onChange={(e) => setNodePosition(e.target.value)}
                className="w-[100px]"
              />
            </div>
          )}
          
          <Button onClick={executeOperation} className="mb-0.5">
            {operation.startsWith("insert") ? (
              <Plus className="mr-2 h-4 w-4" />
            ) : operation.startsWith("delete") ? (
              <Trash className="mr-2 h-4 w-4" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Execute
          </Button>
        </div>
        
        {message && <div className="mt-2 text-sm font-medium text-black">{message}</div>}
      </div>
      
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}