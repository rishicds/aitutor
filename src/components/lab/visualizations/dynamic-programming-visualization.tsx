"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Pause, SkipForward, SkipBack } from "lucide-react"

interface DynamicProgrammingVisualizationProps {
  currentStep: number
  speed: number
  isPlaying: boolean
  onPlayPause?: () => void
  onStepForward?: () => void
  onStepBack?: () => void
}

export default function DynamicProgrammingVisualization({
  currentStep = 0,
  speed = 1,
  isPlaying = false,
  onPlayPause,
  onStepForward,
  onStepBack
}: DynamicProgrammingVisualizationProps) {
  const [algorithm, setAlgorithm] = useState<string>("fibonacci")
  const [inputValue, setInputValue] = useState<string>("5")
  const [dpTable, setDpTable] = useState<number[][]>([])
  const [message, setMessage] = useState<string>("")
  const [activeCell, setActiveCell] = useState<{i: number, j: number} | null>(null)
  const [steps, setSteps] = useState<{i: number, j: number, message: string}[]>([])

  // Run the selected algorithm and create visualization data
  const executeAlgorithm = () => {
    const n = parseInt(inputValue)
    
    if (isNaN(n) || n < 1) {
      setMessage("Please enter a valid positive number")
      return
    }
    
    if (n > 20) {
      setMessage("For better visualization, please use a value <= 20")
      return
    }
    
    switch (algorithm) {
      case "fibonacci":
        runFibonacci(n)
        break
      case "knapsack":
        runKnapsack(n)
        break
      case "lcs":
        runLCS()
        break
      default:
        break
    }
  }

  // Update visualization based on current step
  useEffect(() => {
    if (steps.length > 0 && currentStep >= 0 && currentStep < steps.length) {
      const step = steps[currentStep]
      setActiveCell({i: step.i, j: step.j})
      setMessage(step.message)
    } else if (steps.length > 0) {
      setMessage("Visualization complete")
      setActiveCell(null)
    }
  }, [currentStep, steps])

  // Generate Fibonacci sequence visualization
  const runFibonacci = (n: number) => {
    // Create 1D table but display as 2D for consistency
    const dp: number[] = new Array(n + 1).fill(0)
    dp[0] = 0
    dp[1] = 1
    
    const newTable: number[][] = [[...dp]]
    const newSteps: {i: number, j: number, message: string}[] = []
    
    // Add base cases to steps
    newSteps.push({
      i: 0, 
      j: 0, 
      message: "Base case: F(0) = 0"
    })
    
    newSteps.push({
      i: 0, 
      j: 1, 
      message: "Base case: F(1) = 1"
    })
    
    // Calculate and add steps
    for (let i = 2; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2]
      newSteps.push({
        i: 0,
        j: i,
        message: `F(${i}) = F(${i-1}) + F(${i-2}) = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}`
      })
    }
    
    setDpTable(newTable)
    setSteps(newSteps)
    setMessage(`Fibonacci sequence up to F(${n}) calculated`)
  }

  // Generate Knapsack problem visualization
  const runKnapsack = (n: number) => {
    // Sample items (value, weight)
    const items = [
      { value: 60, weight: 10 },
      { value: 100, weight: 20 },
      { value: 120, weight: 30 },
      { value: 80, weight: 15 },
      { value: 40, weight: 5 },
    ].slice(0, Math.min(n, 5))
    
    const capacity = 50
    
    // Create DP table (2D)
    const dp: number[][] = Array(items.length + 1)
      .fill(0)
      .map(() => Array(capacity + 1).fill(0))
    
    const newSteps: {i: number, j: number, message: string}[] = []
    
    // Fill the DP table
    for (let i = 0; i <= items.length; i++) {
      for (let w = 0; w <= capacity; w++) {
        if (i === 0 || w === 0) {
          dp[i][w] = 0
          newSteps.push({
            i,
            j: w,
            message: `Base case: No items or no capacity, value = 0`
          })
        } else if (items[i - 1].weight <= w) {
          // Can include this item
          const includeItem = items[i - 1].value + dp[i - 1][w - items[i - 1].weight]
          const excludeItem = dp[i - 1][w]
          dp[i][w] = Math.max(includeItem, excludeItem)
          
          newSteps.push({
            i,
            j: w,
            message: `Item ${i} (value: ${items[i-1].value}, weight: ${items[i-1].weight}): 
                    Max of including (${includeItem}) vs excluding (${excludeItem}) = ${dp[i][w]}`
          })
        } else {
          // Can't include this item
          dp[i][w] = dp[i - 1][w]
          newSteps.push({
            i,
            j: w,
            message: `Item ${i} (weight: ${items[i-1].weight}) too heavy for capacity ${w}, 
                    take previous value ${dp[i][w]}`
          })
        }
      }
    }
    
    // We don't want to display the full capacity table (too large)
    // So we'll display a simplified version showing key weights
    const simplifiedTable = dp.map(row => 
      [0, 10, 20, 30, 40, 50].map(w => row[w])
    )
    
    setDpTable(simplifiedTable)
    setSteps(newSteps.filter(step => [0, 10, 20, 30, 40, 50].includes(step.j)))
    setMessage(`Knapsack problem with ${items.length} items solved`)
  }

  // Generate Longest Common Subsequence visualization
  const runLCS = () => {
    const s1 = "ABCBDAB"
    const s2 = "BDCABA"
    
    // Create DP table
    const dp: number[][] = Array(s1.length + 1)
      .fill(0)
      .map(() => Array(s2.length + 1).fill(0))
    
    const newSteps: {i: number, j: number, message: string}[] = []
    
    // Fill the DP table
    for (let i = 0; i <= s1.length; i++) {
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0 || j === 0) {
          dp[i][j] = 0
          newSteps.push({
            i,
            j,
            message: `Base case: Empty string, LCS length = 0`
          })
        } else if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
          newSteps.push({
            i,
            j,
            message: `Characters match: '${s1[i-1]}' = '${s2[j-1]}', 
                    LCS length = ${dp[i-1][j-1]} + 1 = ${dp[i][j]}`
          })
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
          newSteps.push({
            i,
            j,
            message: `Characters don't match: '${s1[i-1]}' ≠ '${s2[j-1]}', 
                    Take max of left (${dp[i][j-1]}) and top (${dp[i-1][j]}) = ${dp[i][j]}`
          })
        }
      }
    }
    
    setDpTable(dp)
    setSteps(newSteps)
    setMessage(`LCS of "${s1}" and "${s2}" calculated`)
  }

  // Reset visualization
  const clearVisualization = () => {
    setDpTable([])
    setSteps([])
    setActiveCell(null)
    setMessage("")
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
                <SelectItem value="fibonacci">Fibonacci</SelectItem>
                <SelectItem value="knapsack">Knapsack Problem</SelectItem>
                <SelectItem value="lcs">Longest Common Subsequence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inputValue">
              {algorithm === "fibonacci" ? "N (sequence length)" : 
               algorithm === "knapsack" ? "Number of items" : "Use default strings"}
            </Label>
            {algorithm !== "lcs" && (
              <Input
                id="inputValue"
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-[120px]"
              />
            )}
          </div>

          <Button onClick={executeAlgorithm} className="mb-0.5">
            <Play className="mr-2 h-4 w-4" />
            Run Algorithm
          </Button>
          
          <Button onClick={clearVisualization} variant="outline" className="mb-0.5">
            Clear
          </Button>
        </div>

        {message && <div className="mt-2 text-sm font-medium text-black">{message}</div>}
        
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onStepBack}
            disabled={!steps.length || currentStep <= 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onPlayPause}
            disabled={!steps.length}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onStepForward}
            disabled={!steps.length || currentStep >= steps.length - 1}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {dpTable.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="dp-grid-container overflow-auto max-h-full">
              <table className="dp-grid">
                <tbody>
                  {dpTable.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td 
                          key={j}
                          className={`dp-cell ${
                            activeCell && activeCell.i === i && activeCell.j === j 
                              ? 'active' 
                              : ''
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {algorithm === "lcs" && (
              <div className="mt-4 grid grid-cols-2 gap-8">
                <div className="text-center">
                  <h3 className="font-medium">String 1</h3>
                  <div className="flex justify-center mt-2">
                    {["", ...Array.from("ABCBDAB")].map((char, idx) => (
                      <div 
                        key={idx} 
                        className={`w-8 h-8 border flex items-center justify-center
                                  ${idx === 0 ? 'bg-gray-100' : ''}`}
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-medium">String 2</h3>
                  <div className="flex justify-center mt-2">
                    {["", ...Array.from("BDCABA")].map((char, idx) => (
                      <div 
                        key={idx} 
                        className={`w-8 h-8 border flex items-center justify-center
                                  ${idx === 0 ? 'bg-gray-100' : ''}`}
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {algorithm === "knapsack" && (
              <div className="mt-4 text-center">
                <h3 className="font-medium">Weights</h3>
                <div className="flex justify-center mt-2">
                  {[0, 10, 20, 30, 40, 50].map((weight) => (
                    <div 
                      key={weight} 
                      className="w-12 h-8 border flex items-center justify-center bg-gray-100"
                    >
                      {weight}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .dp-grid {
          border-collapse: collapse;
        }
        
        .dp-cell {
          width: 50px;
          height: 50px;
          border: 1px solid #ccc;
          text-align: center;
          transition: all 0.3s ease;
        }
        
        .dp-cell.active {
          background-color: #10b981;
          color: white;
          transform: scale(1.05);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}