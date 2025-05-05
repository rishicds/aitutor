"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Beaker, Droplet, FlaskRoundIcon as Flask, TestTube } from "lucide-react"

// Define the chemical reactions and tests
const saltTests = {
  FeCl3: {
    appearance: "Reddish-brown solution",
    naOH: "Reddish-brown precipitate of Fe(OH)3",
    nh4OH: "Reddish-brown precipitate of Fe(OH)3",
    k4FeCN6: "Deep blue precipitate (Prussian blue)",
    kSCN: "Deep red coloration due to [Fe(SCN)]2+",
    color: "#8B4513",
  },
  CuSO4: {
    appearance: "Blue solution",
    naOH: "Blue precipitate of Cu(OH)2",
    nh4OH: "Deep blue solution [Cu(NH3)4]2+",
    k4FeCN6: "Reddish-brown precipitate",
    kSCN: "No visible change",
    color: "#1E90FF",
  },
  ZnCl2: {
    appearance: "Colorless solution",
    naOH: "White precipitate of Zn(OH)2, soluble in excess",
    nh4OH: "White precipitate, soluble in excess",
    k4FeCN6: "White precipitate",
    kSCN: "No visible change",
    color: "#FFFFFF",
  },
  AlCl3: {
    appearance: "Colorless solution",
    naOH: "White gelatinous precipitate of Al(OH)3",
    nh4OH: "White gelatinous precipitate of Al(OH)3",
    k4FeCN6: "No characteristic precipitate",
    kSCN: "No visible change",
    color: "#F0F0F0",
  },
  MnCl2: {
    appearance: "Pale pink solution",
    naOH: "White precipitate of Mn(OH)2 that turns brown on exposure to air",
    nh4OH: "White precipitate, partially soluble in excess",
    k4FeCN6: "White precipitate that turns blue on exposure to air",
    kSCN: "No visible change",
    color: "#FFC0CB",
  },
}

export default function SaltAnalysisContent() {
  const [selectedSalt, setSelectedSalt] = useState<string | null>(null)
  const [reagent, setReagent] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testHistory, setTestHistory] = useState<Array<{ salt: string; reagent: string; result: string }>>([])
  const [unknownSalt, setUnknownSalt] = useState<string | null>(null)
  const [userGuess, setUserGuess] = useState("")
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  // Function to perform a test
  const performTest = () => {
    if (!selectedSalt || !reagent) return

    let result = ""
    switch (reagent) {
      case "appearance":
        result = saltTests[selectedSalt as keyof typeof saltTests].appearance
        break
      case "naOH":
        result = saltTests[selectedSalt as keyof typeof saltTests].naOH
        break
      case "nh4OH":
        result = saltTests[selectedSalt as keyof typeof saltTests].nh4OH
        break
      case "k4FeCN6":
        result = saltTests[selectedSalt as keyof typeof saltTests].k4FeCN6
        break
      case "kSCN":
        result = saltTests[selectedSalt as keyof typeof saltTests].kSCN
        break
      default:
        result = "No reaction observed"
    }

    setTestResult(result)
    setTestHistory((prev) => [...prev, { salt: selectedSalt, reagent, result }])
  }

  // Function to start unknown salt analysis
  const startUnknownAnalysis = () => {
    const salts = Object.keys(saltTests)
    const randomSalt = salts[Math.floor(Math.random() * salts.length)]
    setUnknownSalt(randomSalt)
    setTestHistory([])
    setTestResult(null)
    setReagent(null)
    setIsCorrect(null)
    setUserGuess("")
  }

  // Function to check user's guess
  const checkGuess = () => {
    if (userGuess.toUpperCase() === unknownSalt) {
      setIsCorrect(true)
    } else {
      setIsCorrect(false)
    }
  }

  // Render the test tube with appropriate color
  const renderTestTube = () => {
    const color = selectedSalt ? saltTests[selectedSalt as keyof typeof saltTests].color : "#FFFFFF"
    const unknownColor = unknownSalt ? saltTests[unknownSalt as keyof typeof saltTests].color : "#FFFFFF"

    return (
      <div className="flex flex-col items-center">
        <div className="w-20 h-60 relative">
          <div className="absolute bottom-0 w-full rounded-b-full bg-gray-200 h-2"></div>
          <div className="absolute bottom-2 w-full rounded-b-full overflow-hidden" style={{ height: "150px" }}>
            <div
              className="w-full h-full transition-all duration-500"
              style={{
                backgroundColor: unknownSalt ? unknownColor : color,
                opacity: selectedSalt || unknownSalt ? 0.7 : 0.1,
              }}
            ></div>
          </div>
          <div className="absolute bottom-2 w-full h-[150px] rounded-b-full border-2 border-gray-300"></div>

          {reagent && testResult && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-16 h-16 animate-bounce">
              <Droplet className="w-full h-full text-blue-500 opacity-70" />
            </div>
          )}
        </div>

        {testResult && (
          <div className="mt-4 text-center p-2 bg-gray-100 rounded-md max-w-[200px]">
            <p className="text-sm font-medium">{testResult}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 h-full">
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="known" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-lavender-100">
            <TabsTrigger value="known" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              Known Salt
            </TabsTrigger>
            <TabsTrigger value="unknown" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              Unknown Salt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="known" className="space-y-4 mt-0">
            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
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
            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
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
                            const result =
                              saltTests[unknownSalt as keyof typeof saltTests][
                                value as keyof (typeof saltTests)["FeCl3"]
                              ]
                            setTestResult(result)
                            setTestHistory((prev) => [...prev, { salt: "Unknown", reagent: value, result }])
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
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="guess">Your Guess</Label>
                        <div className="flex gap-2">
                          <Input
                            id="guess"
                            value={userGuess}
                            onChange={(e) => setUserGuess(e.target.value)}
                            placeholder="Enter chemical formula (e.g., FeCl3)"
                          />
                          <Button onClick={checkGuess}>Check</Button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (reagent) {
                              const result =
                                saltTests[unknownSalt as keyof typeof saltTests][
                                  reagent as keyof (typeof saltTests)["FeCl3"]
                                ]
                              setTestResult(result)
                              setTestHistory((prev) => [...prev, { salt: "Unknown", reagent, result }])
                            }
                          }}
                          disabled={!reagent}
                          className="flex-1"
                        >
                          <TestTube className="mr-2 h-4 w-4" />
                          Test
                        </Button>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {testHistory.length > 0 && (
          <Card className="border-lavender-200 mt-4 flex-grow overflow-auto">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-lavender-800">Test History</h3>
              <div className="space-y-2">
                {testHistory.map((test, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-md text-sm">
                    <span className="font-medium">{test.salt}</span> + <span className="italic">{test.reagent}</span>:{" "}
                    {test.result}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-lg">{renderTestTube()}</div>
    </div>
  )
}
