"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash, Plus, RefreshCw, Download, Wand2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { getGeminiResponse } from "@/lib/gemini"


// Function to safely evaluate mathematical expressions
function evaluateExpression(expression: string, x: number): number | null {
  // Add debug logging
  console.log(`Evaluating expression: ${expression} with x = ${x}`);
  
  // Empty or invalid expression check
  if (!expression || expression.trim() === "") {
    return 0; // Return 0 for empty expressions
  }

  // Replace common mathematical functions with Math equivalents
  const preparedExpression = expression
    .replace(/sin\(/g, "Math.sin(")
    .replace(/cos\(/g, "Math.cos(")
    .replace(/tan\(/g, "Math.tan(")
    .replace(/sqrt\(/g, "Math.sqrt(")
    .replace(/abs\(/g, "Math.abs(")
    .replace(/log\(/g, "Math.log(")
    .replace(/exp\(/g, "Math.exp(")
    .replace(/\^/g, "**")
    .replace(/pi/g, "Math.PI")
    .replace(/e/g, "Math.E")

  try {
    // Set a timeout to prevent long-running evaluations
    const evalResult = Function("x", `"use strict"; 
      try {
        return ${preparedExpression};
      } catch (err) {
        console.error('Expression evaluation error:', err);
        return null;
      }`)(x);

    // Check for extreme values that might cause rendering issues
    if (evalResult !== null && (evalResult > 1e10 || evalResult < -1e10 || !isFinite(evalResult))) {
      console.warn(`Expression produced extreme value: ${evalResult} at x=${x}`);
      return null;
    }
    
    return evalResult;
  } catch (error) {
    console.error("Error evaluating expression:", error);
    return null;
  }
}

// Define a type for graph functions
interface GraphFunction {
  id: string
  expression: string
  color: string
  visible: boolean
}

// Define available colors
const COLORS = [
  "#8b5cf6", // Lavender
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
]

export default function GraphPlotterContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [functions, setFunctions] = useState<GraphFunction[]>([
    { id: "1", expression: "x^2", color: COLORS[0], visible: true },
    { id: "2", expression: "sin(x)", color: COLORS[1], visible: true },
  ])

  // Add error state to track rendering problems
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Graph settings
  const [xMin, setXMin] = useState(-10)
  const [xMax, setXMax] = useState(10)
  const [yMin, setYMin] = useState(-10)
  const [yMax, setYMax] = useState(10)
  const [gridSize, setGridSize] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showAxes, setShowAxes] = useState(true)

  // New state variables for AI math assistant
  const [mathQuery, setMathQuery] = useState<string>("")
  const [mathResponse, setMathResponse] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastAddedFunction, setLastAddedFunction] = useState<string | null>(null)

  // Function to add a new function
  const addFunction = () => {
    const newId = (Math.max(0, ...functions.map((f) => Number.parseInt(f.id))) + 1).toString()
    const colorIndex = functions.length % COLORS.length
    setFunctions([
      ...functions,
      {
        id: newId,
        expression: "x",
        color: COLORS[colorIndex],
        visible: true,
      },
    ])
  }

  // Function to remove a function
  const removeFunction = (id: string) => {
    setFunctions(functions.filter((f) => f.id !== id))
  }

  // Function to update a function expression
  const updateFunctionExpression = (id: string, expression: string) => {
    setFunctions((prevFunctions) => 
      prevFunctions.map((f) => (f.id === id ? { ...f, expression } : f))
    )
  }

  // Function to toggle function visibility
  const toggleFunctionVisibility = (id: string) => {
    setFunctions((prevFunctions) => 
      prevFunctions.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f))
    )
  }

  // Function to change function color
  const updateFunctionColor = (id: string, color: string) => {
    setFunctions((prevFunctions) => 
      prevFunctions.map((f) => (f.id === id ? { ...f, color } : f))
    )
  }

  // Function to reset view
  const resetView = () => {
    setXMin(-10)
    setXMax(10)
    setYMin(-10)
    setYMax(10)
    setGridSize(1)
  }

  // Function to save the graph as an image
  const saveAsImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "graph.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  // Handler for numeric input changes with validation
  const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: string) => {
    const numericValue = parseFloat(value)
    if (!isNaN(numericValue)) {
      setter(numericValue)
    }
  }

  // Function to process math queries with AI
  const processMathQuery = async () => {
    if (!mathQuery.trim()) return

    setIsProcessing(true)
    try {
      // Create a specialized prompt for math assistance
      const tutorParams = {
        subject: "math",
        level: "intermediate" as const,
        personality: "neutral" as const,
        teachingStyle: "conceptual" as const,
        extraNotes: "Focus on algebraic simplification, equation solving, and function suggestions for graphing."
      }
      
      const aiResponse = await getGeminiResponse(
        `I'm using a graphing calculator. Please help me with this math question: ${mathQuery}. 
        If my query contains an equation or expression, simplify it if possible. 
        If I'm asking about what functions to graph, suggest interesting functions with brief explanations.
        Format any mathematical expressions properly.`, 
        tutorParams
      )
      
      setMathResponse(aiResponse)
    } catch (error) {
      console.error("Error processing math query:", error)
      setMathResponse("Sorry, there was an error processing your request. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to add a suggested function from AI response
  const addSuggestedFunction = (expression: string) => {
    const newId = (Math.max(0, ...functions.map((f) => Number.parseInt(f.id))) + 1).toString()
    const colorIndex = functions.length % COLORS.length
    
    setFunctions([
      ...functions,
      {
        id: newId,
        expression: expression,
        color: COLORS[colorIndex],
        visible: true,
      },
    ])
    
    setLastAddedFunction(expression)
    
    // Clear the last added function after a delay
    setTimeout(() => {
      setLastAddedFunction(null)
    }, 3000)
  }

  // Draw the graph
  useEffect(() => {
    // Set a flag to track rendering operation
    setIsRendering(true);
    setRenderError(null);
    
    // Create a debounced rendering function to prevent UI blocking
    const renderTimeout = setTimeout(() => {
      try {
        const canvas = canvasRef.current
        if (!canvas) {
          setIsRendering(false);
          return;
        }

        console.log("Starting graph rendering");
        const startTime = performance.now();

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          setIsRendering(false);
          return;
        }

        // Validate graph bounds to prevent issues
        if (xMin >= xMax || yMin >= yMax) {
          setRenderError("Invalid graph bounds: min must be less than max");
          setIsRendering(false);
          return;
        }

        // Set canvas dimensions
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr

        ctx.scale(dpr, dpr)
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, rect.width, rect.height)

        // Calculate scale factors
        const xScale = rect.width / (xMax - xMin)
        const yScale = rect.height / (yMax - yMin)

        // Function to convert x coordinate to canvas x
        const toCanvasX = (x: number) => (x - xMin) * xScale

        // Function to convert y coordinate to canvas y
        const toCanvasY = (y: number) => rect.height - (y - yMin) * yScale

        // Draw grid if enabled
        if (showGrid) {
          ctx.strokeStyle = "#f0f0f0"
          ctx.lineWidth = 1

          // Draw vertical grid lines
          for (let x = Math.ceil(xMin / gridSize) * gridSize; x <= xMax; x += gridSize) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(x), 0)
            ctx.lineTo(toCanvasX(x), rect.height)
            ctx.stroke()
          }

          // Draw horizontal grid lines
          for (let y = Math.ceil(yMin / gridSize) * gridSize; y <= yMax; y += gridSize) {
            ctx.beginPath()
            ctx.moveTo(0, toCanvasY(y))
            ctx.lineTo(rect.width, toCanvasY(y))
            ctx.stroke()
          }
        }

        // Draw axes if enabled
        if (showAxes) {
          ctx.strokeStyle = "#666666"
          ctx.lineWidth = 2

          // Draw x-axis if it's in view
          if (yMin <= 0 && yMax >= 0) {
            ctx.beginPath()
            ctx.moveTo(0, toCanvasY(0))
            ctx.lineTo(rect.width, toCanvasY(0))
            ctx.stroke()

            // Draw x-axis ticks and labels
            ctx.textAlign = "center"
            ctx.textBaseline = "top"
            ctx.font = "12px Arial"
            ctx.fillStyle = "#666666"

            for (let x = Math.ceil(xMin / gridSize) * gridSize; x <= xMax; x += gridSize) {
              if (x === 0) continue // Skip zero

              const canvasX = toCanvasX(x)
              ctx.beginPath()
              ctx.moveTo(canvasX, toCanvasY(0) - 5)
              ctx.lineTo(canvasX, toCanvasY(0) + 5)
              ctx.stroke()

              ctx.fillText(x.toString(), canvasX, toCanvasY(0) + 8)
            }
          }

          // Draw y-axis if it's in view
          if (xMin <= 0 && xMax >= 0) {
            ctx.beginPath()
            ctx.moveTo(toCanvasX(0), 0)
            ctx.lineTo(toCanvasX(0), rect.height)
            ctx.stroke()

            // Draw y-axis ticks and labels
            ctx.textAlign = "right"
            ctx.textBaseline = "middle"

            for (let y = Math.ceil(yMin / gridSize) * gridSize; y <= yMax; y += gridSize) {
              if (y === 0) continue // Skip zero

              const canvasY = toCanvasY(y)
              ctx.beginPath()
              ctx.moveTo(toCanvasX(0) - 5, canvasY)
              ctx.lineTo(toCanvasX(0) + 5, canvasY)
              ctx.stroke()

              ctx.fillText(y.toString(), toCanvasX(0) - 8, canvasY)
            }
          }

          // Draw origin label
          if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) {
            ctx.textAlign = "right"
            ctx.textBaseline = "top"
            ctx.fillText("0", toCanvasX(0) - 8, toCanvasY(0) + 8)
          }
        }

        // Calculate approximate number of points to plot based on canvas width
        // Limit the number of points to prevent freezing
        const maxPoints = Math.min(rect.width, 1000);
        const step = (xMax - xMin) / maxPoints;

        // Draw each function with performance monitoring
        functions.forEach((func) => {
          if (!func.visible) return
          
          console.log(`Rendering function: ${func.expression}`);
          const funcStartTime = performance.now();

          // Skip empty expressions
          if (!func.expression || func.expression.trim() === "") {
            return;
          }

          ctx.strokeStyle = func.color
          ctx.lineWidth = 2
          ctx.beginPath()

          let isFirstPoint = true
          let pointsProcessed = 0;
          let lastY = null;
          
          for (let pixelX = 0; pixelX <= rect.width; pixelX += 1) {
            // Safety check for excessive processing
            pointsProcessed++;
            if (pointsProcessed > maxPoints) {
              console.warn("Reached max points limit for function rendering");
              break;
            }
            
            const x = xMin + (pixelX / rect.width) * (xMax - xMin);
            const y = evaluateExpression(func.expression, x);

            if (y === null || !isFinite(y)) {
              isFirstPoint = true;
              continue;
            }

            // Skip extreme jumps in y-values (likely discontinuities)
            if (lastY !== null && Math.abs(y - lastY) > (yMax - yMin) / 2) {
              isFirstPoint = true;
            }
            lastY = y;

            if (y < yMin || y > yMax) {
              isFirstPoint = true;
              continue;
            }

            if (isFirstPoint) {
              ctx.moveTo(pixelX, toCanvasY(y));
              isFirstPoint = false;
            } else {
              ctx.lineTo(pixelX, toCanvasY(y));
            }
          }

          ctx.stroke();
          console.log(`Function rendered in ${performance.now() - funcStartTime}ms`);
        })

        const endTime = performance.now();
        console.log(`Graph rendering completed in ${endTime - startTime}ms`);
        setIsRendering(false);
      } catch (error) {
        console.error("Error rendering graph:", error);
        setRenderError(`Error rendering graph: ${error instanceof Error ? error.message : String(error)}`);
        setIsRendering(false);
      }
    }, 250); // 250ms debounce delay

    // Cleanup function
    return () => {
      clearTimeout(renderTimeout);
    };
  }, [functions, xMin, xMax, yMin, yMax, gridSize, showGrid, showAxes])

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 h-full">
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="functions" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="functions">
              Functions
            </TabsTrigger>
            <TabsTrigger value="settings">
              Graph Settings
            </TabsTrigger>
            <TabsTrigger value="math-assist">
              Math Assistant
            </TabsTrigger>
          </TabsList>

          {/* Show error message if rendering fails */}
          {renderError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>Rendering error: {renderError}</p>
              <p className="text-sm">Try simplifying your functions or adjusting the graph bounds.</p>
            </div>
          )}

          {/* Show loading indicator during rendering */}
          {isRendering && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              <p>Rendering graph...</p>
            </div>
          )}

          <TabsContent value="functions" className="space-y-4 mt-0">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {functions.map((func) => (
                    <div key={func.id} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full cursor-pointer"
                        style={{ backgroundColor: func.color, opacity: func.visible ? 1 : 0.3 }}
                        onClick={() => toggleFunctionVisibility(func.id)}
                        title={func.visible ? "Hide function" : "Show function"}
                      />

                      <Select 
                        value={func.color} 
                        onValueChange={(value) => updateFunctionColor(func.id, value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLORS.map((color) => (
                            <SelectItem key={color} value={color}>
                              <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color }} />
                                <span>
                                  {color === "#8b5cf6"
                                    ? "Purple"
                                    : color === "#ef4444"
                                      ? "Red"
                                      : color === "#3b82f6"
                                        ? "Blue"
                                        : color === "#10b981"
                                          ? "Green"
                                          : color === "#f59e0b"
                                            ? "Amber"
                                            : color === "#ec4899"
                                              ? "Pink"
                                              : color === "#6366f1"
                                                ? "Indigo"
                                                : color === "#14b8a6"
                                                  ? "Teal"
                                                  : "Color"}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex-grow">
                        <Input
                          value={func.expression}
                          onChange={(e) => updateFunctionExpression(func.id, e.target.value)}
                          placeholder="Enter function of x"
                          className={!func.visible ? "opacity-50" : ""}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFunction(func.id)}
                        title="Remove function"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button onClick={addFunction} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Function
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Function Examples</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded-md">
                    <code>x^2</code> - Parabola
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <code>sin(x)</code> - Sine wave
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <code>x^3 - 2*x</code> - Cubic function
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <code>1/x</code> - Hyperbola
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <code>sqrt(x)</code> - Square root
                  </div>
                  <div className="p-2 bg-gray-50 rounded-md">
                    <code>abs(x)</code> - Absolute value
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-0">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Graph Settings</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="xMin">X Minimum</Label>
                      <Input 
                        id="xMin" 
                        type="number" 
                        value={xMin} 
                        onChange={(e) => handleNumericInputChange(setXMin, e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="xMax">X Maximum</Label>
                      <Input 
                        id="xMax" 
                        type="number" 
                        value={xMax} 
                        onChange={(e) => handleNumericInputChange(setXMax, e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yMin">Y Minimum</Label>
                      <Input 
                        id="yMin" 
                        type="number" 
                        value={yMin} 
                        onChange={(e) => handleNumericInputChange(setYMin, e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yMax">Y Maximum</Label>
                      <Input 
                        id="yMax" 
                        type="number" 
                        value={yMax} 
                        onChange={(e) => handleNumericInputChange(setYMax, e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="gridSize">Grid Size</Label>
                      <span className="text-sm">{gridSize}</span>
                    </div>
                    <Slider
                      id="gridSize"
                      value={[gridSize]}
                      min={0.5}
                      max={5}
                      step={0.5}
                      onValueChange={(value) => setGridSize(value[0])}
                      className="py-2"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showGrid"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="showGrid">Show Grid</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showAxes"
                      checked={showAxes}
                      onChange={(e) => setShowAxes(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="showAxes">Show Axes</Label>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={resetView} className="flex-1">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset View
                    </Button>

                    <Button variant="outline" onClick={saveAsImage} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Save as Image
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Math Assistant Tab */}
          <TabsContent value="math-assist" className="space-y-4 mt-0">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">AI Math Assistant</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mathQuery" className="mb-2 block">Ask a math question or enter an expression to simplify</Label>
                    <Textarea
                      id="mathQuery"
                      value={mathQuery}
                      onChange={(e) => setMathQuery(e.target.value)}
                      placeholder="e.g., 'Simplify (x^2 - 9)/(x - 3)' or 'Suggest interesting trigonometric functions to graph'"
                      className="min-h-[100px]" 
                    />
                  </div>

                  <Button
                    onClick={processMathQuery}
                    className="w-full"
                    disabled={isProcessing || !mathQuery.trim()}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isProcessing ? "Processing..." : "Get Math Help"}
                  </Button>

                  {mathResponse && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Response:</h4>
                      <div className="bg-gray-50 p-4 rounded-lg prose max-w-none max-h-[240px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: mathResponse.replace(/\n/g, '<br>') }} />
                      </div>
                      
                      {/* Extract expressions from the response using regex */}
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Suggested Functions:</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                          {Array.from(
                            mathResponse.matchAll(/`([^`]+)`|\\begin\{align\}([^\\]+)\\end\{align\}|\$([^\$]+)\$/g)
                          ).map((match, index) => {
                            const expression = (match[1] || match[2] || match[3] || "").trim()
                              .replace(/\\cdot/g, "*")
                              .replace(/\\times/g, "*")
                              .replace(/\\div/g, "/")
                              .replace(/\\sqrt/g, "sqrt")
                              .replace(/\\sin/g, "sin")
                              .replace(/\\cos/g, "cos")
                              .replace(/\\tan/g, "tan")
                              .replace(/\\pi/g, "pi")
                              .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")

                            // Skip empty or obviously non-function expressions
                            if (!expression || !expression.includes("x") || expression.length > 50) return null

                            return (
                              <div key={index} className="flex items-center">
                                <code className="flex-grow p-2 bg-gray-100 rounded">{expression}</code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addSuggestedFunction(expression)}
                                  className="ml-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add
                                </Button>
                              </div>
                            )
                          }).filter(Boolean)}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {lastAddedFunction && (
                    <div className="mt-2 p-2 bg-green-100 text-green-800 rounded-md">
                      Function <code>{lastAddedFunction}</code> added successfully!
                    </div>
                  )}
                  
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium mb-2">You can ask:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Simplify trigonometric expressions</li>
                      <li>Factor polynomials</li>
                      <li>Solve equations</li>
                      <li>Get suggestions for interesting functions to graph</li>
                      <li>Help understanding function behavior</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-lg">
        <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
      </div>
    </div>
  )
}