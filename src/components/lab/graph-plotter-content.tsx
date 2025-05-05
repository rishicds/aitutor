"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash, Plus, RefreshCw, Download } from "lucide-react"

// Function to safely evaluate mathematical expressions
function evaluateExpression(expression: string, x: number): number | null {
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
    // eslint-disable-next-line no-new-func
    return Function("x", `"use strict"; return ${preparedExpression}`)(x)
  } catch (error) {
    console.error("Error evaluating expression:", error)
    return null
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

  // Graph settings
  const [xMin, setXMin] = useState(-10)
  const [xMax, setXMax] = useState(10)
  const [yMin, setYMin] = useState(-10)
  const [yMax, setYMax] = useState(10)
  const [gridSize, setGridSize] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showAxes, setShowAxes] = useState(true)

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
    setFunctions(functions.map((f) => (f.id === id ? { ...f, expression } : f)))
  }

  // Function to toggle function visibility
  const toggleFunctionVisibility = (id: string) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)))
  }

  // Function to change function color
  const updateFunctionColor = (id: string, color: string) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, color } : f)))
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

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

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

    // Draw each function
    functions.forEach((func) => {
      if (!func.visible) return

      ctx.strokeStyle = func.color
      ctx.lineWidth = 2
      ctx.beginPath()

      let isFirstPoint = true
      const step = (xMax - xMin) / rect.width

      for (let pixelX = 0; pixelX <= rect.width; pixelX++) {
        const x = xMin + pixelX * step
        const y = evaluateExpression(func.expression, x)

        if (y === null || !isFinite(y)) {
          isFirstPoint = true
          continue
        }

        if (y < yMin || y > yMax) {
          isFirstPoint = true
          continue
        }

        if (isFirstPoint) {
          ctx.moveTo(pixelX, toCanvasY(y))
          isFirstPoint = false
        } else {
          ctx.lineTo(pixelX, toCanvasY(y))
        }
      }

      ctx.stroke()
    })
  }, [functions, xMin, xMax, yMin, yMax, gridSize, showGrid, showAxes])

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 h-full">
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="functions" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-lavender-100">
            <TabsTrigger
              value="functions"
              className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white"
            >
              Functions
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white"
            >
              Graph Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="functions" className="space-y-4 mt-0">
            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {functions.map((func) => (
                    <div key={func.id} className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full cursor-pointer"
                        style={{ backgroundColor: func.color }}
                        onClick={() => toggleFunctionVisibility(func.id)}
                        title={func.visible ? "Hide function" : "Show function"}
                      />

                      <Select value={func.color} onValueChange={(value) => updateFunctionColor(func.id, value)}>
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

                  <Button onClick={addFunction} className="w-full bg-lavender-500 hover:bg-lavender-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Function
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-lavender-800">Function Examples</h3>
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
            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-lavender-800">Graph Settings</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="xMin">X Minimum</Label>
                      <Input id="xMin" type="number" value={xMin} onChange={(e) => setXMin(Number(e.target.value))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="xMax">X Maximum</Label>
                      <Input id="xMax" type="number" value={xMax} onChange={(e) => setXMax(Number(e.target.value))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yMin">Y Minimum</Label>
                      <Input id="yMin" type="number" value={yMin} onChange={(e) => setYMin(Number(e.target.value))} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yMax">Y Maximum</Label>
                      <Input id="yMax" type="number" value={yMax} onChange={(e) => setYMax(Number(e.target.value))} />
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
                      className="rounded border-gray-300 text-lavender-600 focus:ring-lavender-500"
                    />
                    <Label htmlFor="showGrid">Show Grid</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showAxes"
                      checked={showAxes}
                      onChange={(e) => setShowAxes(e.target.checked)}
                      className="rounded border-gray-300 text-lavender-600 focus:ring-lavender-500"
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
        </Tabs>
      </div>

      <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-lg">
        <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
      </div>
    </div>
  )
}
