"use client"

import { useRef, useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Shuffle } from "lucide-react"

interface SearchingVisualizationProps {
  currentStep?: number
  speed?: number
  isPlaying?: boolean
}

export default function SearchingVisualization({ currentStep = 0, speed = 1, isPlaying = false }: SearchingVisualizationProps) {
  const [algorithm, setAlgorithm] = useState<string>("binary")
  const [array, setArray] = useState<number[]>([])
  const [searchValue, setSearchValue] = useState<string>("42")
  const [message, setMessage] = useState<string>("")
  const [searchSteps, setSearchSteps] = useState<number[][]>([])
  const [currentSearchStep, setCurrentSearchStep] = useState<number>(0)
  const [foundIndex, setFoundIndex] = useState<number | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)


  
  // Initialize canvas and generate initial array
  useEffect(() => {
    generateSortedArray()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update visualization when array or step changes
  useEffect(() => {
    drawBoxes()
  }, [array, currentSearchStep, foundIndex])

  // Update when props change
  useEffect(() => {
    if (searchSteps.length > 0 && currentStep > 0) {
      const stepIndex = Math.min(currentStep - 1, searchSteps.length - 1)
      setCurrentSearchStep(stepIndex)
      updateVisualization(searchSteps[stepIndex], stepIndex)
    }
  }, [currentStep, searchSteps])

  // Generate a sorted array
  const generateSortedArray = () => {
    // Generate 15 sorted numbers between 1 and 100
    const newArray = Array.from({ length: 15 }, (_, i) => i * 7 + 1)
    
    setArray(newArray)
    setSearchSteps([])
    setFoundIndex(null)
    setMessage("")
  }

  // Draw boxes on canvas
  const drawBoxes = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate box dimensions
    const boxWidth = Math.max(canvas.width / (array.length * 1.5), 60)
    const boxHeight = 60
    const startX = (canvas.width - (array.length * boxWidth * 1.2)) / 2
    const startY = canvas.height / 2 - boxHeight / 2

    // Draw each box
    array.forEach((value, index) => {
      const x = startX + index * (boxWidth * 1.2)
      const y = startY

      // Determine box color based on algorithm and current step
      let color = '#8b5cf6' // Default lavender
      
      if (currentSearchStep < searchSteps.length) {
        const highlightIndices = searchSteps[currentSearchStep]
        
        if (algorithm === "binary") {
          const [left, mid, right] = highlightIndices
          
          if (index >= left && index <= right) {
            color = '#fcd34d' // Yellow for search range
          }
          
          if (index === mid) {
            color = '#ef4444' // Red for current comparison
          }
        } else if (algorithm === "linear") {
          const [current] = highlightIndices
          
          if (index === current) {
            color = '#ef4444' // Red for current comparison
          } else if (index < current) {
            color = '#94a3b8' // Gray for already checked
          }
        }
      }
      
      // Highlight found index
      if (foundIndex === index && currentSearchStep === searchSteps.length - 1) {
        color = '#10b981' // Green for found
      }

      // Draw box
      ctx.fillStyle = color
      ctx.fillRect(x, y, boxWidth, boxHeight)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, boxWidth, boxHeight)

      // Draw value text
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(value.toString(), x + boxWidth / 2, y + boxHeight / 2 - 10)
      
      // Draw index
      ctx.font = '12px Arial'
      ctx.fillText(`[${index}]`, x + boxWidth / 2, y + boxHeight / 2 + 15)
    })
  }

  // Update the visualization for a specific step
  const updateVisualization = (highlightIndices: number[], stepIndex: number) => {
    // Update message based on algorithm
    if (algorithm === "binary") {
      if (stepIndex === searchSteps.length - 1) {
        if (foundIndex !== null) {
          setMessage(`Found value ${searchValue} at index ${foundIndex}`)
        } else {
          setMessage(`Value ${searchValue} not found in the array`)
        }
      } else {
        const [left, mid, right] = highlightIndices
        setMessage(`Binary Search: Checking mid element at index ${mid} (value: ${array[mid]})`)
      }
    } else if (algorithm === "linear") {
      if (stepIndex === searchSteps.length - 1) {
        if (foundIndex !== null) {
          setMessage(`Found value ${searchValue} at index ${foundIndex}`)
        } else {
          setMessage(`Value ${searchValue} not found in the array`)
        }
      } else {
        const [current] = highlightIndices
        setMessage(`Linear Search: Checking element at index ${current} (value: ${array[current]})`)
      }
    }
  }

  // Run binary search algorithm
  const runBinarySearch = () => {
    const target = Number.parseInt(searchValue)

    if (isNaN(target)) {
      setMessage("Please enter a valid number")
      return
    }

    const steps: number[][] = []
    let left = 0
    let right = array.length - 1
    let found = false

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)

      // Add current search range to steps
      steps.push([left, mid, right])

      if (array[mid] === target) {
        found = true
        setFoundIndex(mid)
        break
      } else if (array[mid] < target) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    if (!found) {
      steps.push([0, 0, 0]) // Add a final step
      setFoundIndex(null)
    }

    setSearchSteps(steps)
    setCurrentSearchStep(0)
    setMessage("Binary Search: divide and conquer approach for sorted arrays")
    
    // Start animation
    return steps
  }

  // Run linear search algorithm
  const runLinearSearch = () => {
    const target = Number.parseInt(searchValue)

    if (isNaN(target)) {
      setMessage("Please enter a valid number")
      return
    }

    const steps: number[][] = []
    let found = false

    for (let i = 0; i < array.length; i++) {
      // Add current index to steps
      steps.push([i])

      if (array[i] === target) {
        found = true
        setFoundIndex(i)
        break
      }
    }

    if (!found) {
      steps.push([array.length - 1]) // Add a final step
      setFoundIndex(null)
    }

    setSearchSteps(steps)
    setCurrentSearchStep(0)
    setMessage("Linear Search: sequential search through each element")
    
    // Start animation
    return steps
  }

  // Execute the selected search algorithm and start animation
  const executeSearchAlgorithm = () => {
    let steps: number[][] = [];
    
    switch (algorithm) {
      case "binary":
        steps = runBinarySearch() || [];
        break;
      case "linear":
        steps = runLinearSearch() || [];
        break;
      default:
        return;
    }

    // Animate through steps
    let stepIndex = 0;
    const animateInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentSearchStep(stepIndex);
        updateVisualization(steps[stepIndex], stepIndex);
        stepIndex++;
      } else {
        clearInterval(animateInterval);
      }
    }, 500 / speed);

    // Cleanup on component unmount
    return () => clearInterval(animateInterval);
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
                <SelectItem value="binary">Binary Search</SelectItem>
                <SelectItem value="linear">Linear Search</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchValue">Search Value</Label>
            <Input
              id="searchValue"
              type="number"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-[120px]"
            />
          </div>

          <Button variant="outline" onClick={generateSortedArray} className="mb-0.5">
            <Shuffle className="mr-2 h-4 w-4" />
            New Array
          </Button>

          <Button onClick={executeSearchAlgorithm} className="mb-0.5">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>

        {message && <div className="mt-2 text-sm font-medium text-black">{message}</div>}
      </div>

      <div className="flex-1 relative">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full border-0"
        />
      </div>
    </div>
  )
}