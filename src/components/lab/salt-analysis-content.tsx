"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Beaker, Droplet, FlaskRoundIcon as Flask, TestTube, Flame, Lightbulb, BarChart, Eye } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define the chemical reactions and tests for inorganic salts
const inorganicSalts = {
  FeCl3: {
    category: "inorganic",
    name: "Iron(III) Chloride",
    appearance: "Reddish-brown solution",
    naOH: "Reddish-brown precipitate of Fe(OH)3",
    nh4OH: "Reddish-brown precipitate of Fe(OH)3",
    k4FeCN6: "Deep blue precipitate (Prussian blue)",
    kSCN: "Deep red coloration due to [Fe(SCN)]2+",
    flame: "Pale green color",
    hCl: "No visible change",
    h2SO4: "Slight whitish precipitate (BaSO4) if Ba2+ is present",
    heatTest: "Water loss and formation of iron oxide",
    kI: "Brown coloration due to formation of I2",
    color: "#8B4513",
  },
  CuSO4: {
    category: "inorganic",
    name: "Copper(II) Sulfate",
    appearance: "Blue solution",
    naOH: "Blue precipitate of Cu(OH)2",
    nh4OH: "Deep blue solution [Cu(NH3)4]2+",
    k4FeCN6: "Reddish-brown precipitate",
    kSCN: "No visible change",
    flame: "Green-blue flame",
    hCl: "No visible change",
    h2SO4: "No visible change",
    heatTest: "White anhydrous salt forms",
    kI: "White precipitate of CuI with brown I2 solution",
    color: "#1E90FF",
  },
  ZnCl2: {
    category: "inorganic",
    name: "Zinc Chloride",
    appearance: "Colorless solution",
    naOH: "White precipitate of Zn(OH)2, soluble in excess",
    nh4OH: "White precipitate, soluble in excess",
    k4FeCN6: "White precipitate",
    kSCN: "No visible change",
    flame: "No characteristic color",
    hCl: "No visible change",
    h2SO4: "No visible change",
    heatTest: "Formation of ZnO (yellow when hot, white when cold)",
    kI: "No visible change",
    color: "#FFFFFF",
  },
  AlCl3: {
    category: "inorganic",
    name: "Aluminum Chloride",
    appearance: "Colorless solution",
    naOH: "White gelatinous precipitate of Al(OH)3",
    nh4OH: "White gelatinous precipitate of Al(OH)3",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    flame: "No characteristic color",
    hCl: "No visible change",
    h2SO4: "No visible change",
    heatTest: "Forms Al2O3",
    kI: "No visible change",
    color: "#F0F0F0",
  },
  MnCl2: {
    category: "inorganic",
    name: "Manganese(II) Chloride",
    appearance: "Pale pink solution",
    naOH: "White precipitate of Mn(OH)2 that turns brown on exposure to air",
    nh4OH: "White precipitate, partially soluble in excess",
    k4FeCN6: "White precipitate that turns blue on exposure to air",
    kSCN: "No visible change",
    flame: "Pale red color",
    hCl: "No visible change",
    h2SO4: "No visible change",
    heatTest: "Forms MnO (dark brown)",
    kI: "No visible change",
    color: "#FFC0CB",
  },
  NiCl2: {
    category: "inorganic",
    name: "Nickel(II) Chloride",
    appearance: "Green solution",
    naOH: "Green precipitate of Ni(OH)2",
    nh4OH: "Green precipitate, soluble in excess giving blue solution",
    k4FeCN6: "Green precipitate",
    kSCN: "No visible change",
    flame: "Yellow-green color",
    hCl: "No visible change",
    h2SO4: "No visible change",
    heatTest: "Forms NiO (green to black)",
    kI: "No visible change",
    color: "#90EE90",
  },
  BaCl2: {
    category: "inorganic",
    name: "Barium Chloride",
    appearance: "Colorless solution",
    naOH: "White precipitate of Ba(OH)2",
    nh4OH: "No visible change",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    flame: "Yellow-green color",
    hCl: "No visible change",
    h2SO4: "White precipitate of BaSO4",
    heatTest: "No significant change",
    kI: "No visible change",
    color: "#FFFFFF",
  },
  CoCl2: {
    category: "inorganic",
    name: "Cobalt(II) Chloride",
    appearance: "Pink solution",
    naOH: "Blue precipitate of Co(OH)2 that turns pink",
    nh4OH: "Blue precipitate, soluble in excess giving brown solution",
    k4FeCN6: "Green precipitate",
    kSCN: "Blue coloration",
    flame: "Blue color",
    hCl: "No visible change",
    h2SO4: "No visible change",
    heatTest: "Forms CoO (blue to black)",
    kI: "Blue coloration",
    color: "#FF69B4",
  },
  AgNO3: {
    category: "inorganic",
    name: "Silver Nitrate",
    appearance: "Colorless solution",
    naOH: "Brown precipitate of Ag2O",
    nh4OH: "Brown precipitate, soluble in excess",
    k4FeCN6: "White precipitate",
    kSCN: "White precipitate of AgSCN",
    flame: "No characteristic color",
    hCl: "White precipitate of AgCl",
    h2SO4: "White precipitate of Ag2SO4",
    heatTest: "Decomposes to silver metal",
    kI: "Yellow precipitate of AgI",
    color: "#E6E6E6",
  },
  Pb_NO3_2: {
    category: "inorganic",
    name: "Lead(II) Nitrate",
    appearance: "Colorless solution",
    naOH: "White precipitate of Pb(OH)2, soluble in excess",
    nh4OH: "White precipitate",
    k4FeCN6: "White precipitate",
    kSCN: "White precipitate",
    flame: "Bluish-white color",
    hCl: "White precipitate of PbCl2",
    h2SO4: "White precipitate of PbSO4",
    heatTest: "Decomposes to PbO (yellow)",
    kI: "Yellow precipitate of PbI2",
    color: "#F8F8FF",
  },
}

// Define organic compounds and their tests
const organicSalts = {
  NaC2H3O2: {
    category: "organic",
    name: "Sodium Acetate",
    appearance: "Colorless solution",
    naOH: "No visible change",
    nh4OH: "No visible change",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    flame: "Yellow color (sodium)",
    hCl: "Vinegar smell (acetic acid)",
    h2SO4: "Vinegar smell (acetic acid)",
    heatTest: "Decomposes with smell of acetone",
    neutralization: "Neutralizes acids",
    ferricChloride: "Deep red coloration",
    color: "#F0F0F0",
  },
  KHCO3: {
    category: "organic",
    name: "Potassium Bicarbonate",
    appearance: "Colorless solution",
    naOH: "No visible change",
    nh4OH: "No visible change",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    flame: "Lilac color (potassium)",
    hCl: "Effervescence (CO2)",
    h2SO4: "Effervescence (CO2)",
    heatTest: "Decomposes to K2CO3, H2O, and CO2",
    neutralization: "Neutralizes acids",
    ferricChloride: "No visible change",
    color: "#F0F0F0",
  },
  C6H5COONa: {
    category: "organic",
    name: "Sodium Benzoate",
    appearance: "Colorless solution",
    naOH: "No visible change",
    nh4OH: "No visible change",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    flame: "Yellow color (sodium)",
    hCl: "White precipitate of benzoic acid",
    h2SO4: "White precipitate of benzoic acid",
    heatTest: "Decomposes with aromatic odor",
    neutralization: "Neutralizes acids",
    ferricChloride: "Buff-colored precipitate",
    color: "#F0F0F0",
  },
  KC4H5O6: {
    category: "organic",
    name: "Potassium Tartrate",
    appearance: "Colorless solution",
    naOH: "No visible change",
    nh4OH: "No visible change",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    flame: "Lilac color (potassium)",
    hCl: "White precipitate of tartaric acid",
    h2SO4: "Charring on heating (black residue)",
    heatTest: "Caramelizes with burnt sugar smell",
    neutralization: "Neutralizes acids",
    ferricChloride: "Yellow-green solution",
    color: "#F0F0F0",
  },
  Na2C2O4: {
    category: "organic",
    name: "Sodium Oxalate",
    appearance: "Colorless solution",
    naOH: "No visible change",
    nh4OH: "No visible change",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    flame: "Yellow color (sodium)",
    hCl: "No visible change",
    h2SO4: "Effervescence (CO + CO2)",
    heatTest: "Decomposes to Na2CO3 + CO",
    neutralization: "Neutralizes acids",
    ferricChloride: "Yellow precipitate",
    color: "#F0F0F0",
  },
}

// Combine all salts
const saltTests = { ...inorganicSalts, ...organicSalts }

// AI Hint assistant based on test results
const generateHint = (testHistory: any[]) => {
  if (!testHistory || testHistory.length === 0) {
    return "Perform some tests to get hints about the unknown salt."
  }

  // Create a scoring system for each salt
  const saltScores: { [key: string]: number } = {}
  Object.keys(saltTests).forEach((salt) => {
    saltScores[salt] = 0
  })

  // Analyze each test and score the salts
  testHistory.forEach((test: { reagent: any; result: any }) => {
    const reagent = test.reagent
    const observedResult = test.result

    Object.keys(saltTests).forEach((salt) => {
      if (saltTests[salt][reagent] === observedResult) {
        saltScores[salt] += 1
      }
    })
  })

  // Find the most likely salts
  const maxScore = Math.max(...Object.values(saltScores))
  const likelySalts = Object.keys(saltScores).filter((salt) => saltScores[salt] === maxScore)

  // Generate hints based on number of tests and likelihood
  if (testHistory.length < 2) {
    return "Try more tests to narrow down the possibilities. Consider testing with NaOH or NH₄OH first to identify the cation group."
  } else if (likelySalts.length > 3) {
    // Suggest tests that would differentiate between the top candidates
    const remainingTests = ["naOH", "nh4OH", "k4FeCN6", "kSCN", "flame", "hCl", "h2SO4", "heatTest", "kI"].filter(
      (test) => !testHistory.some((t: { reagent: string }) => t.reagent === test),
    )

    if (remainingTests.length > 0) {
      // Find the most discriminating test for the likely salts
      const testToSuggest = remainingTests[0] // Simplified - in a real system you'd calculate the most informative test
      return `The salt could be several different compounds. Try testing with ${testToSuggest} to narrow it down further.`
    } else {
      return "You've performed many tests. Based on your results, try to match the pattern to a specific salt."
    }
  } else if (likelySalts.length > 1) {
    // More specific hint for a smaller group
    const saltNames = likelySalts.map((s) => saltTests[s].name).join(" or ")
    return `Your sample is likely ${saltNames}. Try one more confirmatory test to be certain.`
  } else if (likelySalts.length === 1) {
    return `The evidence strongly suggests your sample is ${saltTests[likelySalts[0]].name}. Enter your answer to confirm!`
  } else {
    return "The test results show mixed patterns. Check your observations again or perform additional tests."
  }
}

export default function EnhancedSaltAnalysisLab() {
  const [selectedSalt, setSelectedSalt] = useState<string | null>(null)
  const [reagent, setReagent] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testHistory, setTestHistory] = useState<Array<{ salt: string; reagent: string; result: string }>>([])
  const [unknownSalt, setUnknownSalt] = useState<string | null>(null)
  const [userGuess, setUserGuess] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [aiHint, setAiHint] = useState("")
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [solutionMode, setSolutionMode] = useState(false)
  const [saltCategory, setSaltCategory] = useState<"all" | "inorganic" | "organic">("all")
  const [selectedView, setSelectedView] = useState("test-tube")

  // Filter salts based on category
  const getFilteredSalts = () => {
    if (saltCategory === "all") return saltTests
    return Object.fromEntries(Object.entries(saltTests).filter(([_, salt]) => salt.category === saltCategory))
  }

  // Function to perform a test
  const performTest = () => {
    if (!selectedSalt || !reagent) return

    const result = saltTests[selectedSalt][reagent]

    setTestResult(result)
    setTestHistory((prev) => [...prev, { salt: selectedSalt, reagent, result }])
  }

  // Function to perform a test on unknown sample
  const performUnknownTest = () => {
    if (!unknownSalt || !reagent) return

    const result = saltTests[unknownSalt][reagent]

    setTestResult(result)
    setTestHistory((prev) => [...prev, { salt: "Unknown", reagent, result }])

    // Generate a hint after each test
    const currentHint = generateHint([...testHistory, { salt: "Unknown", reagent, result }])
    setAiHint(currentHint)
  }

  // Function to start unknown salt analysis
  const startUnknownAnalysis = () => {
    const filteredSalts = getFilteredSalts()
    const salts = Object.keys(filteredSalts)
    const randomSalt = salts[Math.floor(Math.random() * salts.length)]
    setUnknownSalt(randomSalt)
    setTestHistory([])
    setTestResult(null)
    setReagent(null)
    setIsCorrect(null)
    setUserGuess("")
    setAiHint("Perform some tests to get hints about the unknown salt.")
    setSolutionMode(false)
  }

  // Function to check user's guess
  const checkGuess = () => {
    if (!unknownSalt) return

    const correctAnswer = unknownSalt
    const userAnswer = userGuess.trim().toUpperCase()

    // Check for exact match or chemical name match
    const isExactMatch = userAnswer === correctAnswer
    const isNameMatch = userAnswer === saltTests[correctAnswer].name.toUpperCase().replace(/[()]/g, "")

    if (isExactMatch || isNameMatch) {
      setIsCorrect(true)
    } else {
      setIsCorrect(false)
    }
  }

  // Function to toggle solution mode
  const toggleSolutionMode = () => {
    setSolutionMode(!solutionMode)
  }

  // Get AI hint
  const getAiHint = () => {
    setShowHint(true)
  }

  // Render the test tube with appropriate color and animations
  const renderTestTube = () => {
    const saltKey = selectedSalt || unknownSalt
    const color = saltKey ? saltTests[saltKey].color : "#FFFFFF"

    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-60 relative">
          <div className="absolute bottom-0 w-full rounded-b-full bg-gray-200 h-2"></div>
          <div className="absolute bottom-2 w-full rounded-b-full overflow-hidden" style={{ height: "150px" }}>
            <div
              className="w-full h-full transition-all duration-1000"
              style={{
                backgroundColor: color,
                opacity: saltKey ? 0.7 : 0.1,
              }}
            ></div>
          </div>
          <div className="absolute bottom-2 w-full h-[150px] rounded-b-full border-2 border-gray-300"></div>

          {reagent && testResult && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-16 h-16 animate-dropIn">
              <Droplet className="w-full h-full text-blue-500 opacity-70" />
            </div>
          )}

          {reagent === "flame" && testResult && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 animate-pulse">
              <Flame className="w-full h-full text-orange-500 opacity-70" />
            </div>
          )}

          {reagent === "heatTest" && testResult && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-16 h-16 animate-pulse">
              <Flame className="w-full h-full text-red-500 opacity-70" />
            </div>
          )}

          {(reagent === "hCl" || reagent === "h2SO4") && testResult && testResult.includes("effervescence") && (
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-full">
              <div className="bubbles-animation">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bubble"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${Math.random() * 2 + 1}s`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {testResult && (
          <div className="mt-4 text-center p-2 bg-gray-100 rounded-md max-w-[300px] animate-fadeIn">
            <p className="text-sm font-medium">{testResult}</p>
          </div>
        )}
      </div>
    )
  }

  // Render the flame test view with enhanced animations
  const renderFlameTest = () => {
    const saltKey = selectedSalt || unknownSalt
    // Different flame colors based on the salt
    let flameColor = "#FFD700" // Default gold color

    if (saltKey && reagent === "flame") {
      if (saltKey.includes("Na") || saltKey === "NaC2H3O2" || saltKey === "C6H5COONa" || saltKey === "Na2C2O4") {
        flameColor = "#FFAA00" // Yellow for sodium
      } else if (saltKey.includes("Cu") || saltKey === "CuSO4") {
        flameColor = "#00FF00" // Green for copper
      } else if (saltKey.includes("K") || saltKey === "KHCO3" || saltKey === "KC4H5O6") {
        flameColor = "#AA00FF" // Purple for potassium
      } else if (saltKey.includes("Ba") || saltKey === "BaCl2") {
        flameColor = "#00FF00" // Green for barium
      } else if (saltKey.includes("Sr")) {
        flameColor = "#FF0000" // Red for strontium
      } else if (saltKey.includes("Li")) {
        flameColor = "#FF3333" // Crimson for lithium
      } else if (saltKey.includes("Ca")) {
        flameColor = "#FF6600" // Orange-red for calcium
      }
    }

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="relative h-40 w-40">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-20">
            <div className="absolute bottom-0 w-full h-6 bg-gray-800 rounded-t-sm"></div>
            <div className="absolute bottom-6 w-full h-2 bg-blue-700"></div>
            <div
              className={`absolute bottom-8 w-full ${reagent === "flame" ? "animate-flameIn" : ""}`}
              style={{
                height: "120px",
                background: `radial-gradient(ellipse at center, ${flameColor} 0%, rgba(255,255,255,0) 70%)`,
                borderRadius: "50% 50% 25% 25%",
                boxShadow: `0 0 40px 20px ${flameColor}`,
                opacity: reagent === "flame" ? 0.8 : 0,
              }}
            ></div>

            {/* Sparks animation */}
            {reagent === "flame" && (
              <div className="sparks-container">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="spark"
                    style={{
                      backgroundColor: flameColor,
                      left: `${Math.random() * 100}%`,
                      animationDuration: `${Math.random() * 2 + 0.5}s`,
                      animationDelay: `${Math.random() * 1}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {testResult && reagent === "flame" && (
          <div className="mt-6 text-center p-2 bg-gray-100 rounded-md max-w-[300px] animate-fadeIn">
            <p className="text-sm font-medium">{testResult}</p>
          </div>
        )}
      </div>
    )
  }

  // Render the reaction chart with statistics about the tests performed
  const renderReactionChart = () => {
    const reagentCounts = {}

    // Count how many times each reagent has been used
    testHistory.forEach((test) => {
      if (!reagentCounts[test.reagent]) {
        reagentCounts[test.reagent] = 0
      }
      reagentCounts[test.reagent]++
    })

    // Sort reagents by usage frequency
    const sortedReagents = Object.keys(reagentCounts).sort((a, b) => reagentCounts[b] - reagentCounts[a])

    // Get the max count for scaling the bars
    const maxCount = Math.max(...Object.values(reagentCounts).map(Number), 1)

    const reagentNames = {
      appearance: "Physical Appearance",
      naOH: "Sodium Hydroxide",
      nh4OH: "Ammonium Hydroxide",
      k4FeCN6: "Potassium Ferrocyanide",
      kSCN: "Potassium Thiocyanate",
      flame: "Flame Test",
      hCl: "Hydrochloric Acid",
      h2SO4: "Sulfuric Acid",
      heatTest: "Heat Test",
      kI: "Potassium Iodide",
      ferricChloride: "Ferric Chloride",
      neutralization: "Neutralization Test",
    }

    return (
      <div className="flex flex-col p-4 h-full w-full">
        <h3 className="text-lg font-bold mb-4">Test Statistics</h3>

        <div className="space-y-2 flex-grow overflow-y-auto custom-scrollbar pr-2">
          {sortedReagents.map((reagent, index) => (
            <div key={reagent} className="flex flex-col animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex justify-between text-xs mb-1">
                <span>{reagentNames[reagent] || reagent}</span>
                <span>{reagentCounts[reagent]} tests</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-lavender-600 h-2.5 rounded-full animate-growWidth"
                  style={{
                    width: `${(reagentCounts[reagent] / maxCount) * 100}%`,
                    animationDuration: "1s",
                    animationDelay: `${index * 0.1}s`,
                  }}
                ></div>
              </div>
            </div>
          ))}

          {Object.keys(reagentCounts).length === 0 && (
            <div className="text-gray-500 text-center pt-8">No tests performed yet</div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">Total tests: {testHistory.length}</p>
          {unknownSalt && (
            <p className="text-sm animate-fadeIn">
              {isCorrect === true
                ? `Success! Correctly identified as ${saltTests[unknownSalt].name}`
                : `Unknown sample: ${solutionMode ? saltTests[unknownSalt].name : "???"}`}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 h-full">
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="known" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="known" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              Known Salt
            </TabsTrigger>
            <TabsTrigger value="unknown" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              Unknown Salt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="known" className="space-y-4 mt-0">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="salt-category">Salt Category</Label>
                    <Select
                      value={saltCategory}
                      onValueChange={(value: "all" | "inorganic" | "organic") => setSaltCategory(value)}
                    >
                      <SelectTrigger id="salt-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Salts</SelectItem>
                        <SelectItem value="inorganic">Inorganic Salts</SelectItem>
                        <SelectItem value="organic">Organic Salts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="salt">Select Salt</Label>
                    <Select onValueChange={(value) => setSelectedSalt(value)}>
                      <SelectTrigger id="salt">
                        <SelectValue placeholder="Select a salt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FeCl3">Iron(III) Chloride (FeCl₃)</SelectItem>
                        <SelectItem value="CuSO4">Copper(II) Sulfate (CuSO₄)</SelectItem>
                        <SelectItem value="ZnCl2">Zinc Chloride (ZnCl₂)</SelectItem>
                        <SelectItem value="AlCl3">Aluminum Chloride (AlCl₃)</SelectItem>
                        <SelectItem value="MnCl2">Manganese(II) Chloride (MnCl₂)</SelectItem>
                        <SelectItem value="NiCl2">Nickel(II) Chloride (NiCl₂)</SelectItem>
                        <SelectItem value="BaCl2">Barium Chloride (BaCl₂)</SelectItem>
                        <SelectItem value="CoCl2">Cobalt(II) Chloride (CoCl₂)</SelectItem>
                        <SelectItem value="AgNO3">Silver Nitrate (AgNO₃)</SelectItem>
                        <SelectItem value="Pb_NO3_2">Lead(II) Nitrate (Pb(NO₃)₂)</SelectItem>
                        <SelectItem value="NaC2H3O2">Sodium Acetate (CH₃COONa)</SelectItem>
                        <SelectItem value="KHCO3">Potassium Bicarbonate (KHCO₃)</SelectItem>
                        <SelectItem value="C6H5COONa">Sodium Benzoate (C₆H₅COONa)</SelectItem>
                        <SelectItem value="KC4H5O6">Potassium Tartrate (KC₄H₅O₆)</SelectItem>
                        <SelectItem value="Na2C2O4">Sodium Oxalate (Na₂C₂O₄)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reagent">Select Test Reagent</Label>
                    <Select onValueChange={(value) => setReagent(value)}>
                      <SelectTrigger id="reagent">
                        <SelectValue placeholder="Select a reagent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appearance">Physical Appearance</SelectItem>
                        <SelectItem value="naOH">Sodium Hydroxide (NaOH)</SelectItem>
                        <SelectItem value="nh4OH">Ammonium Hydroxide (NH₄OH)</SelectItem>
                        <SelectItem value="k4FeCN6">Potassium Ferrocyanide (K₄[Fe(CN)₆])</SelectItem>
                        <SelectItem value="kSCN">Potassium Thiocyanate (KSCN)</SelectItem>
                        <SelectItem value="flame">Flame Test</SelectItem>
                        <SelectItem value="hCl">Hydrochloric Acid (HCl)</SelectItem>
                        <SelectItem value="h2SO4">Sulfuric Acid (H₂SO₄)</SelectItem>
                        <SelectItem value="heatTest">Heat Test</SelectItem>
                        <SelectItem value="kI">Potassium Iodide (KI)</SelectItem>
                        {selectedSalt && saltTests[selectedSalt].category === "organic" && (
                          <>
                            <SelectItem value="ferricChloride">Ferric Chloride (FeCl₃)</SelectItem>
                            <SelectItem value="neutralization">Neutralization Test</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={performTest}
                      disabled={!selectedSalt || !reagent}
                      className="flex-1 bg-lavender-500 hover:bg-lavender-600"
                    >
                      <Beaker className="mr-2 h-4 w-4" />
                      Perform Test
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedSalt && reagent) {
                          performTest()
                        }
                      }}
                      disabled={!selectedSalt || !reagent}
                      className="flex-1"
                    >
                      <TestTube className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unknown" className="space-y-4 mt-0">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="unknown-category">Salt Category</Label>
                    <Select
                      value={saltCategory}
                      onValueChange={(value: "all" | "inorganic" | "organic") => setSaltCategory(value)}
                    >
                      <SelectTrigger id="unknown-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Salts</SelectItem>
                        <SelectItem value="inorganic">Inorganic Salts</SelectItem>
                        <SelectItem value="organic">Organic Salts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={startUnknownAnalysis} className="w-full bg-lavender-500 hover:bg-lavender-600">
                    <Flask className="mr-2 h-4 w-4" />
                    Get Unknown Sample
                  </Button>

                  {unknownSalt && (
                    <>
                      <div>
                        <Label htmlFor="unknown-reagent">Select Test Reagent</Label>
                        <Select
                          onValueChange={(value) => {
                            setReagent(value)
                            // We'll perform the test after selecting a reagent
                          }}
                        >
                          <SelectTrigger id="unknown-reagent">
                            <SelectValue placeholder="Select a reagent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appearance">Physical Appearance</SelectItem>
                            <SelectItem value="naOH">Sodium Hydroxide (NaOH)</SelectItem>
                            <SelectItem value="nh4OH">Ammonium Hydroxide (NH₄OH)</SelectItem>
                            <SelectItem value="k4FeCN6">Potassium Ferrocyanide (K₄[Fe(CN)₆])</SelectItem>
                            <SelectItem value="kSCN">Potassium Thiocyanate (KSCN)</SelectItem>
                            <SelectItem value="flame">Flame Test</SelectItem>
                            <SelectItem value="hCl">Hydrochloric Acid (HCl)</SelectItem>
                            <SelectItem value="h2SO4">Sulfuric Acid (H₂SO₄)</SelectItem>
                            <SelectItem value="heatTest">Heat Test</SelectItem>
                            <SelectItem value="kI">Potassium Iodide (KI)</SelectItem>
                            <SelectItem value="ferricChloride">Ferric Chloride (FeCl₃)</SelectItem>
                            <SelectItem value="neutralization">Neutralization Test</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={performUnknownTest}
                          disabled={!reagent}
                          className="flex-1 bg-lavender-500 hover:bg-lavender-600"
                        >
                          <TestTube className="mr-2 h-4 w-4" />
                          Perform Test
                        </Button>

                        <Button variant="outline" onClick={getAiHint} className="flex-1">
                          <Lightbulb className="mr-2 h-4 w-4" />
                          AI Hint
                        </Button>
                      </div>

                      {showHint && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-start">
                            <Lightbulb className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                            <p className="text-sm">{aiHint}</p>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="guess">Your Guess</Label>
                        <div className="flex gap-2">
                          <Input
                            id="guess"
                            value={userGuess}
                            onChange={(e) => setUserGuess(e.target.value)}
                            placeholder="Enter chemical formula or name"
                          />
                          <Button onClick={checkGuess}>Check</Button>
                        </div>
                      </div>

                      {isCorrect !== null && (
                        <div
                          className={`p-2 rounded-md ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {isCorrect
                            ? "Correct! You identified the unknown salt."
                            : `Incorrect. Try more tests to identify the salt.`}
                        </div>
                      )}

                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={toggleSolutionMode} className="text-xs">
                          <Eye className="h-3 w-3 mr-1" />
                          {solutionMode ? "Hide Solution" : "Show Solution"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStatsDialog(true)}
                          className="text-xs"
                        >
                          <BarChart className="h-3 w-3 mr-1" />
                          Statistics
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-4 flex-grow">
          <CardContent className="pt-6 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="font-semibold mb-2 text-lavender-800 sticky top-0 bg-white z-10 pb-2">Test History</h3>
            <div className="space-y-2">
              {testHistory.map((test, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-md text-sm animate-fadeIn">
                  <span className="font-medium">{test.salt}</span> + <span className="italic">{test.reagent}</span>:{" "}
                  {test.result}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-4 flex gap-2">
          <Button
            variant={selectedView === "test-tube" ? "default" : "outline"}
            className={selectedView === "test-tube" ? "bg-lavender-500" : ""}
            onClick={() => setSelectedView("test-tube")}
          >
            <TestTube className="mr-2 h-4 w-4" />
            Test Tube
          </Button>
          <Button
            variant={selectedView === "flame" ? "default" : "outline"}
            className={selectedView === "flame" ? "bg-lavender-500" : ""}
            onClick={() => setSelectedView("flame")}
          >
            <Flame className="mr-2 h-4 w-4" />
            Flame Test
          </Button>
          <Button
            variant={selectedView === "chart" ? "default" : "outline"}
            className={selectedView === "chart" ? "bg-lavender-500" : ""}
            onClick={() => setSelectedView("chart")}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Analysis
          </Button>
        </div>

        <div className="flex-grow bg-gray-50 rounded-lg flex justify-center items-center">
          {selectedView === "test-tube" && renderTestTube()}
          {selectedView === "flame" && renderFlameTest()}
          {selectedView === "chart" && renderReactionChart()}
        </div>
      </div>

      <AlertDialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <AlertDialogContent className="max-h-[90vh]">
          <AlertDialogHeader>
            <AlertDialogTitle>Salt Analysis Statistics</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="mt-4">
              <p>
                <strong>Total Tests:</strong> {testHistory.length}
              </p>
              <p>
                <strong>Unique Reagents:</strong> {new Set(testHistory.map((t) => t.reagent)).size}
              </p>
              {unknownSalt && solutionMode && (
                <p className="animate-fadeIn">
                  <strong>Unknown Salt:</strong> {saltTests[unknownSalt].name} ({unknownSalt})
                </p>
              )}
              {isCorrect !== null && (
                <p className="animate-fadeIn">
                  <strong>Result:</strong> {isCorrect ? "Correct identification" : "Incorrect identification"}
                </p>
              )}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Test Breakdown:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {Object.entries(
                    testHistory.reduce((acc, test) => {
                      acc[test.reagent] = (acc[test.reagent] || 0) + 1
                      return acc
                    }, {}),
                  ).map(([reagent, count], index) => (
                    <li key={reagent} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                      {reagent}: {count} tests
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx global>{`
        @keyframes flicker {
          0% { opacity: 0.7; transform: scaleY(0.95); }
          50% { opacity: 0.9; transform: scaleY(1.05); }
          100% { opacity: 0.7; transform: scaleY(0.95); }
        }
        .animate-flicker {
          animation: flicker 3s infinite ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        @keyframes dropIn {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, 20px); }
        }
        .animate-dropIn {
          animation: dropIn 1.5s ease-in-out infinite;
        }
        
        .bubbles-animation {
          position: relative;
          width: 100%;
          height: 100px;
        }
        
        .bubble {
          position: absolute;
          bottom: 0;
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          animation: bubble 3s infinite ease-in;
        }
        
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-80px) scale(1);
            opacity: 0;
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c4b5fd;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a78bfa;
        }

        @keyframes flameIn {
          0% { transform: scaleY(0); opacity: 0; }
          100% { transform: scaleY(1); opacity: 0.8; }
        }
        .animate-flameIn {
          animation: flameIn 0.5s ease-out forwards, flicker 3s infinite ease-in-out 0.5s;
        }

        .sparks-container {
          position: absolute;
          width: 100%;
          height: 150px;
          bottom: 8px;
          overflow: hidden;
        }

        .spark {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          bottom: 0;
          animation: spark 2s ease-out infinite;
        }

        @keyframes spark {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }

        @keyframes growWidth {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-growWidth {
          animation: growWidth 1s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
