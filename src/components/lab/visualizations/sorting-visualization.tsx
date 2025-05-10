"use client"

import { useRef, useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Play, Shuffle } from "lucide-react"

interface SortingVisualizationProps {
  currentStep?: number
  speed?: number
  isPlaying?: boolean
}

export default function SortingVisualization({ currentStep = 0, speed = 1, isPlaying = false }: SortingVisualizationProps) {
  const [algorithm, setAlgorithm] = useState<string>("bubble")
  const [arraySize, setArraySize] = useState<number>(10)
  const [array, setArray] = useState<number[]>([])
  const [sortingSteps, setSortingSteps] = useState<number[][]>([])
  const [currentSortingStep, setCurrentSortingStep] = useState<number>(0)
  const [message, setMessage] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize canvas and generate initial random array
  useEffect(() => {
    generateRandomArray()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update visualization when array or step changes
  useEffect(() => {
    drawBars()
  }, [array, currentSortingStep])

  // Update when props change
  useEffect(() => {
    if (sortingSteps.length > 0 && currentStep > 0) {
      const stepIndex = Math.min(currentStep - 1, sortingSteps.length - 1)
      setCurrentSortingStep(stepIndex)
      updateVisualization(sortingSteps[stepIndex], stepIndex)
    }
  }, [currentStep, sortingSteps])

  // Generate a random array
  const generateRandomArray = () => {
    const newArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 20) + 1)
    setArray(newArray)
    setSortingSteps([newArray.slice()])
    setCurrentSortingStep(0)
    setMessage("")
  }

  // Draw bars on canvas
  const drawBars = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate bar dimensions
    const barWidth = Math.max(canvas.width / (array.length * 2), 20)
    const maxBarHeight = canvas.height * 0.8
    const maxValue = Math.max(...array, 1)
    const scaleY = maxBarHeight / maxValue

    // Draw each bar
    array.forEach((value, index) => {
      const x = index * (barWidth * 1.5) + (canvas.width - array.length * barWidth * 1.5) / 2
      const barHeight = value * scaleY
      const y = canvas.height - barHeight - 20 // Leave space at bottom

      // Determine bar color based on algorithm and current step
      let color = '#8b5cf6' // Default lavender

      if (currentSortingStep > 0 && currentSortingStep < sortingSteps.length) {
        if (algorithm === "bubble") {
          const stepInPass = currentSortingStep % (array.length - 1)
          if (index === stepInPass || index === stepInPass + 1) {
            color = '#ef4444' // Red for comparison
          }
        } else if (algorithm === "selection") {
          const currentPass = Math.floor(currentSortingStep / (array.length - 1))
          if (index === currentPass || index === (currentSortingStep % (array.length - 1)) + 1) {
            color = '#ef4444' // Red for comparison
          } else if (index < currentPass) {
            color = '#10b981' // Green for sorted
          }
        }
      }

      // Draw bar
      ctx.fillStyle = color
      ctx.fillRect(x, y, barWidth, barHeight)

      // Draw value text
      ctx.fillStyle = '#000000'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(value.toString(), x + barWidth / 2, y - 5)
    })
  }

  // Update the visualization for a specific step
  const updateVisualization = (stepArray: number[], stepIndex: number) => {
    // Update array with the step data
    setArray([...stepArray])

    // Update message based on algorithm and step
    if (algorithm === "bubble") {
      if (stepIndex === sortingSteps.length - 1) {
        setMessage("Bubble Sort completed!")
      } else {
        const i = Math.floor(stepIndex / (array.length - 1))
        const j = stepIndex % (array.length - 1)
        setMessage(`Pass ${i + 1}, comparing elements at positions ${j} and ${j + 1}`)
      }
    } else if (algorithm === "selection") {
      if (stepIndex === sortingSteps.length - 1) {
        setMessage("Selection Sort completed!")
      } else {
        const i = Math.floor(stepIndex / (array.length - 1))
        const j = (stepIndex % (array.length - 1)) + 1
        setMessage(`Pass ${i + 1}, comparing minimum (${i}) with element at position ${j}`)
      }
    }
  }

  // Run bubble sort algorithm and capture steps
  const runBubbleSort = () => {
    const arr = [...array]
    const steps = [arr.slice()]

    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
          // Swap elements
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
          steps.push(arr.slice())
        } else {
          // Still add a step to show comparison
          steps.push(arr.slice())
        }
      }
    }

    setSortingSteps(steps)
    setCurrentSortingStep(0)
    setMessage("Bubble Sort: comparing adjacent elements and swapping if they're in the wrong order")
    return steps
  }

  // Run selection sort algorithm and capture steps
  const runSelectionSort = () => {
    const arr = [...array]
    const steps = [arr.slice()]

    for (let i = 0; i < arr.length - 1; i++) {
      let minIndex = i

      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j] < arr[minIndex]) {
          minIndex = j
        }
        steps.push(arr.slice())
      }

      if (minIndex !== i) {
        // Swap elements
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]]
        steps.push(arr.slice())
      }
    }

    setSortingSteps(steps)
    setCurrentSortingStep(0)
    setMessage("Selection Sort: finding the minimum element and placing it at the beginning")
    return steps
  }

  // Execute the selected sorting algorithm and start animation
  const executeSortingAlgorithm = () => {
    let steps: number[][] = [];
    
    switch (algorithm) {
      case "bubble":
        steps = runBubbleSort();
        break;
      case "selection":
        steps = runSelectionSort();
        break;
      default:
        return;
    }

    // Animate through steps
    let stepIndex = 0;
    const animateInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentSortingStep(stepIndex);
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
                <SelectItem value="bubble">Bubble Sort</SelectItem>
                <SelectItem value="selection">Selection Sort</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-[200px]">
            <div className="flex justify-between">
              <Label htmlFor="arraySize">Array Size</Label>
              <span className="text-sm">{arraySize}</span>
            </div>
            <Slider
              id="arraySize"
              value={[arraySize]}
              min={5}
              max={20}
              step={1}
              onValueChange={(value) => setArraySize(value[0])}
            />
          </div>

          <Button variant="outline" onClick={generateRandomArray} className="mb-0.5">
            <Shuffle className="mr-2 h-4 w-4" />
            Randomize
          </Button>

          <Button onClick={executeSortingAlgorithm} className="mb-0.5">
            <Play className="mr-2 h-4 w-4" />
            Sort
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