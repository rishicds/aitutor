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
  const [currentDpTable, setCurrentDpTable] = useState<number[][]>([])
  const [message, setMessage] = useState<string>("")
  const [activeCell, setActiveCell] = useState<{i: number, j: number} | null>(null)
  const [steps, setSteps] = useState<{
    i: number, 
    j: number, 
    message: string,
    table: number[][]
  }[]>([])

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
      setCurrentDpTable(step.table) // Set the current state of the DP table for this step
    } else if (steps.length > 0) {
      setMessage("Visualization complete")
      setActiveCell(null)
      // Show final table state
      if (steps.length > 0) {
        setCurrentDpTable(steps[steps.length - 1].table)
      }
    }
  }, [currentStep, steps])

  // Generate Fibonacci sequence visualization
  const runFibonacci = (n: number) => {
    // Create 1D table but display as 2D for consistency
    const dp: number[] = new Array(n + 1).fill(0)
    dp[0] = 0
    dp[1] = 1
    
    const newSteps: {i: number, j: number, message: string, table: number[][]}[] = []
    
    // Add base cases to steps
    const initialTable = [[...dp]]
    newSteps.push({
      i: 0, 
      j: 0, 
      message: "Base case: F(0) = 0",
      table: initialTable
    })
    
    const step1Table = [[...dp]]
    newSteps.push({
      i: 0, 
      j: 1, 
      message: "Base case: F(1) = 1",
      table: step1Table
    })
    
    // Calculate and add steps
    for (let i = 2; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2]
      const stepTable = [[...dp]] // Create a new copy for each step
      
      newSteps.push({
        i: 0,
        j: i,
        message: `F(${i}) = F(${i-1}) + F(${i-2}) = ${dp[i-1]} + ${dp[i-2]} = ${dp[i]}`,
        table: stepTable
      })
    }
    
    setDpTable([[...dp]]) // Final state table
    setCurrentDpTable([[...dp]]) // Current displayed table
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
    
    const newSteps: {i: number, j: number, message: string, table: number[][]}[] = []
    
    // We'll create simplified tables for display showing only key weights
    const simplifyTable = (fullTable: number[][]) => {
      return fullTable.map(row => 
        [0, 10, 20, 30, 40, 50].map(w => row[w])
      )
    }
    
    // Fill the DP table
    for (let i = 0; i <= items.length; i++) {
      for (let w = 0; w <= capacity; w++) {
        const tableCopy = dp.map(row => [...row]) // Create deep copy of current state
        
        if (i === 0 || w === 0) {
          dp[i][w] = 0
          
          // Only add steps for the weights we're actually displaying
          if ([0, 10, 20, 30, 40, 50].includes(w)) {
            newSteps.push({
              i,
              j: [0, 10, 20, 30, 40, 50].indexOf(w), // Convert to simplified table index
              message: `Base case: No items or no capacity, value = 0`,
              table: simplifyTable(tableCopy)
            })
          }
        } else if (items[i - 1].weight <= w) {
          // Can include this item
          const includeItem = items[i - 1].value + dp[i - 1][w - items[i - 1].weight]
          const excludeItem = dp[i - 1][w]
          dp[i][w] = Math.max(includeItem, excludeItem)
          
          // Only add steps for the weights we're actually displaying
          if ([0, 10, 20, 30, 40, 50].includes(w)) {
            newSteps.push({
              i,
              j: [0, 10, 20, 30, 40, 50].indexOf(w), // Convert to simplified table index
              message: `Item ${i} (value: ${items[i-1].value}, weight: ${items[i-1].weight}): 
                    Max of including (${includeItem}) vs excluding (${excludeItem}) = ${dp[i][w]}`,
              table: simplifyTable(tableCopy)
            })
          }
        } else {
          // Can't include this item
          dp[i][w] = dp[i - 1][w]
          
          // Only add steps for the weights we're actually displaying
          if ([0, 10, 20, 30, 40, 50].includes(w)) {
            newSteps.push({
              i,
              j: [0, 10, 20, 30, 40, 50].indexOf(w), // Convert to simplified table index
              message: `Item ${i} (weight: ${items[i-1].weight}) too heavy for capacity ${w}, 
                    take previous value ${dp[i][w]}`,
              table: simplifyTable(tableCopy)
            })
          }
        }
      }
    }
    
    // Final simplified table
    const finalTable = simplifyTable(dp)
    
    setDpTable(finalTable)
    setCurrentDpTable(finalTable)
    setSteps(newSteps)
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
    
    const newSteps: {i: number, j: number, message: string, table: number[][]}[] = []
    
    // Fill the DP table
    for (let i = 0; i <= s1.length; i++) {
      for (let j = 0; j <= s2.length; j++) {
        // Create a deep copy of the current state of the DP table for this step
        const tableCopy = dp.map(row => [...row])
        
        if (i === 0 || j === 0) {
          dp[i][j] = 0
          newSteps.push({
            i,
            j,
            message: `Base case: Empty string, LCS length = 0`,
            table: tableCopy
          })
        } else if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
          newSteps.push({
            i,
            j,
            message: `Characters match: '${s1[i-1]}' = '${s2[j-1]}', 
                    LCS length = ${dp[i-1][j-1]} + 1 = ${dp[i][j]}`,
            table: tableCopy
          })
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
          newSteps.push({
            i,
            j,
            message: `Characters don't match: '${s1[i-1]}' ≠ '${s2[j-1]}', 
                    Take max of left (${dp[i][j-1]}) and top (${dp[i-1][j]}) = ${dp[i][j]}`,
            table: tableCopy
          })
        }
      }
    }
    
    // Make sure to set the final dp table
    setDpTable(dp.map(row => [...row]))
    setCurrentDpTable(dp.map(row => [...row]))
    setSteps(newSteps)
    setMessage(`LCS of "${s1}" and "${s2}" calculated`)
  }

  // Reset visualization
  const clearVisualization = () => {
    setDpTable([])
    setCurrentDpTable([])
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
        {currentDpTable.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="dp-grid-container overflow-auto max-h-full">
              <table className="dp-grid">
                <tbody>
                  {currentDpTable.map((row, i) => (
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