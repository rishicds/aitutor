"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, useGLTF, Html, PerspectiveCamera } from "@react-three/drei"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react"
import type * as THREE from "three"
import AIAnalysis from "./ai-analysis"

// Define experiment interface
interface Experiment {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  tags: string[]
  thumbnail: string
  modelPath: string
  views: number
  featured: boolean
}

// Model component that loads and displays a 3D model
function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  // For demo purposes, use a duck model as a placeholder
  const modelPath = url === "/models/pendulum.glb" ? "/assets/3d/duck.glb" : "/assets/3d/duck.glb"
  const { scene } = useGLTF(modelPath)

  return <primitive object={scene} scale={scale} />
}

// Physics simulation component for pendulum
function PendulumSimulation({
  playing,
  gravity,
  length,
  damping,
}: { playing: boolean; gravity: number; length: number; damping: number }) {
  const pendulumRef = useRef<THREE.Group>(null)
  const [angle, setAngle] = useState(Math.PI / 4)
  const [angularVelocity, setAngularVelocity] = useState(0)

  useEffect(() => {
    if (!playing) return

    let lastTime = Date.now()
    const interval = setInterval(() => {
      const now = Date.now()
      const deltaTime = (now - lastTime) / 1000
      lastTime = now

      // Simple pendulum physics
      const angularAcceleration = -(gravity / length) * Math.sin(angle)
      const newAngularVelocity = angularVelocity + angularAcceleration * deltaTime
      const newAngle = angle + newAngularVelocity * deltaTime

      setAngularVelocity(newAngularVelocity * (1 - damping * deltaTime)) // Add configurable damping
      setAngle(newAngle)
    }, 16)

    return () => clearInterval(interval)
  }, [playing, angle, angularVelocity, gravity, length, damping])

  useEffect(() => {
    if (pendulumRef.current) {
      pendulumRef.current.rotation.z = angle
    }
  }, [angle])

  return (
    <group ref={pendulumRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, length, 8]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      <mesh position={[0, length, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#c4b5fd" />
      </mesh>
    </group>
  )
}

// Chemistry simulation component for molecular bonds
function MoleculeSimulation({
  bondLength,
  atomSize,
  rotationSpeed,
}: { bondLength: number; atomSize: number; rotationSpeed: number }) {
  const groupRef = useRef<THREE.Group>(null)

  // Add rotation effect
  useEffect(() => {
    if (!groupRef.current) return

    const interval = setInterval(() => {
      if (groupRef.current) {
        groupRef.current.rotation.y += rotationSpeed * 0.01
      }
    }, 16)

    return () => clearInterval(interval)
  }, [rotationSpeed])

  return (
    <group ref={groupRef}>
      {/* Oxygen atom */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[atomSize * 0.5, 32, 32]} />
        <meshStandardMaterial color="#8b5cf6" />
        <Html position={[0, atomSize * 0.8, 0]}>
          <div className="bg-white/80 px-2 py-1 rounded-full text-xs font-bold">O</div>
        </Html>
      </mesh>

      {/* Hydrogen atoms */}
      <mesh position={[-bondLength * 0.8, bondLength * 0.3, 0]}>
        <sphereGeometry args={[atomSize * 0.3, 32, 32]} />
        <meshStandardMaterial color="#c4b5fd" />
        <Html position={[0, atomSize * 0.6, 0]}>
          <div className="bg-white/80 px-2 py-1 rounded-full text-xs font-bold">H</div>
        </Html>
      </mesh>

      <mesh position={[bondLength * 0.8, bondLength * 0.3, 0]}>
        <sphereGeometry args={[atomSize * 0.3, 32, 32]} />
        <meshStandardMaterial color="#c4b5fd" />
        <Html position={[0, atomSize * 0.6, 0]}>
          <div className="bg-white/80 px-2 py-1 rounded-full text-xs font-bold">H</div>
        </Html>
      </mesh>

      {/* Bonds */}
      <mesh position={[-bondLength * 0.4, bondLength * 0.15, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.05, 0.05, bondLength * 0.8, 8]} />
        <meshStandardMaterial color="#ddd6fe" />
      </mesh>

      <mesh position={[bondLength * 0.4, bondLength * 0.15, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.05, 0.05, bondLength * 0.8, 8]} />
        <meshStandardMaterial color="#ddd6fe" />
      </mesh>
    </group>
  )
}

// DNA simulation component
function DNASimulation({
  helixRadius,
  helixHeight,
  rotationSpeed,
}: { helixRadius: number; helixHeight: number; rotationSpeed: number }) {
  const dnaRef = useRef<THREE.Group>(null)

  // Add rotation effect
  useEffect(() => {
    if (!dnaRef.current) return

    const interval = setInterval(() => {
      if (dnaRef.current) {
        dnaRef.current.rotation.y += rotationSpeed * 0.01
      }
    }, 16)

    return () => clearInterval(interval)
  }, [rotationSpeed])

  return (
    <group ref={dnaRef}>
      {/* Simplified DNA helix */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={i} position={[0, i * helixHeight * 0.5 - 2.5, 0]}>
          {/* Base pair */}
          <mesh position={[Math.sin(i * 0.6) * helixRadius * 0.8, 0, Math.cos(i * 0.6) * helixRadius * 0.8]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color={i % 4 === 0 ? "#8b5cf6" : i % 4 === 1 ? "#c4b5fd" : i % 4 === 2 ? "#a78bfa" : "#ddd6fe"}
            />
          </mesh>

          <mesh position={[-Math.sin(i * 0.6) * helixRadius * 0.8, 0, -Math.cos(i * 0.6) * helixRadius * 0.8]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color={i % 4 === 0 ? "#c4b5fd" : i % 4 === 1 ? "#8b5cf6" : i % 4 === 2 ? "#ddd6fe" : "#a78bfa"}
            />
          </mesh>

          {/* Backbone */}
          <mesh position={[Math.sin(i * 0.6) * helixRadius * 1.2, 0, Math.cos(i * 0.6) * helixRadius * 1.2]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#ede9fe" />
          </mesh>

          <mesh position={[-Math.sin(i * 0.6) * helixRadius * 1.2, 0, -Math.cos(i * 0.6) * helixRadius * 1.2]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#ede9fe" />
          </mesh>

          {/* Connections */}
          <mesh position={[0, 0, 0]} rotation={[0, i * 0.6, 0]}>
            <cylinderGeometry args={[0.05, 0.05, helixRadius * 1.6, 8]} />
            <meshStandardMaterial color="#f5f3ff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Wave interference simulation
function WaveSimulation({ amplitude, frequency, phase }: { amplitude: number; frequency: number; phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!meshRef.current) return

    const geometry = meshRef.current.geometry as THREE.BufferGeometry
    const position = geometry.attributes.position

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i)
      const z = position.getZ(i)

      // Create interference pattern
      const wave1 = amplitude * Math.sin(frequency * x + phase)
      const wave2 = amplitude * Math.sin(frequency * z + phase)
      const y = wave1 + wave2

      position.setY(i, y)
    }

    position.needsUpdate = true
  }, [amplitude, frequency, phase])

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4, 4, 50, 50]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
  )
}

// Main experiment viewer component
export default function ExperimentViewer({ experiment }: { experiment: Experiment }) {
  const [playing, setPlaying] = useState(false)
  const [simulationTab, setSimulationTab] = useState("visualization")

  // Pendulum parameters
  const [gravity, setGravity] = useState(9.8)
  const [pendulumLength, setPendulumLength] = useState(2)
  const [pendulumDamping, setPendulumDamping] = useState(0.05)

  // Molecule parameters
  const [bondLength, setBondLength] = useState(1)
  const [atomSize, setAtomSize] = useState(1)
  const [moleculeRotationSpeed, setMoleculeRotationSpeed] = useState(1)

  // DNA parameters
  const [helixRadius, setHelixRadius] = useState(1)
  const [helixHeight, setHelixHeight] = useState(1)
  const [dnaRotationSpeed, setDnaRotationSpeed] = useState(0.5)

  // Wave parameters
  const [waveAmplitude, setWaveAmplitude] = useState(0.5)
  const [waveFrequency, setWaveFrequency] = useState(1)
  const [wavePhase, setWavePhase] = useState(0)

  // General parameters
  const [zoom, setZoom] = useState(5)
  const [fullscreen, setFullscreen] = useState(false)

  // Update wave phase when playing
  useEffect(() => {
    if (!playing) return

    const interval = setInterval(() => {
      setWavePhase((prev) => (prev + 0.05) % (Math.PI * 2))
    }, 16)

    return () => clearInterval(interval)
  }, [playing])

  // Reset simulation
  const resetSimulation = () => {
    setPlaying(false)

    // Reset experiment-specific parameters
    if (experiment.id === "pendulum-motion") {
      setGravity(9.8)
      setPendulumLength(2)
      setPendulumDamping(0.05)
    } else if (experiment.id === "molecular-bonds") {
      setBondLength(1)
      setAtomSize(1)
      setMoleculeRotationSpeed(1)
    } else if (experiment.id === "dna-replication") {
      setHelixRadius(1)
      setHelixHeight(1)
      setDnaRotationSpeed(0.5)
    } else if (experiment.id === "wave-interference") {
      setWaveAmplitude(0.5)
      setWaveFrequency(1)
      setWavePhase(0)
    }
  }

  // Render the appropriate simulation based on experiment type
  const renderSimulation = () => {
    switch (experiment.id) {
      case "pendulum-motion":
        return (
          <PendulumSimulation playing={playing} gravity={gravity} length={pendulumLength} damping={pendulumDamping} />
        )
      case "molecular-bonds":
        return <MoleculeSimulation bondLength={bondLength} atomSize={atomSize} rotationSpeed={moleculeRotationSpeed} />
      case "dna-replication":
        return <DNASimulation helixRadius={helixRadius} helixHeight={helixHeight} rotationSpeed={dnaRotationSpeed} />
      case "wave-interference":
        return <WaveSimulation amplitude={waveAmplitude} frequency={waveFrequency} phase={wavePhase} />
      default:
        return <Model url={experiment.modelPath} scale={1.5} />
    }
  }

  // Render experiment-specific controls
  const renderControls = () => {
    switch (experiment.id) {
      case "pendulum-motion":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Gravity (m/s²)</span>
                <span className="text-sm">{gravity.toFixed(1)}</span>
              </div>
              <Slider
                value={[gravity]}
                min={1}
                max={20}
                step={0.1}
                onValueChange={(value) => setGravity(value[0])}
                disabled={playing}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Pendulum Length (m)</span>
                <span className="text-sm">{pendulumLength.toFixed(1)}</span>
              </div>
              <Slider
                value={[pendulumLength]}
                min={0.5}
                max={5}
                step={0.1}
                onValueChange={(value) => setPendulumLength(value[0])}
                disabled={playing}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Damping Coefficient</span>
                <span className="text-sm">{pendulumDamping.toFixed(2)}</span>
              </div>
              <Slider
                value={[pendulumDamping]}
                min={0}
                max={0.2}
                step={0.01}
                onValueChange={(value) => setPendulumDamping(value[0])}
                disabled={playing}
                className="py-2"
              />
            </div>
          </div>
        )

      case "molecular-bonds":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Bond Length</span>
                <span className="text-sm">{bondLength.toFixed(2)}</span>
              </div>
              <Slider
                value={[bondLength]}
                min={0.5}
                max={2.0}
                step={0.05}
                onValueChange={(value) => setBondLength(value[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Atom Size</span>
                <span className="text-sm">{atomSize.toFixed(2)}</span>
              </div>
              <Slider
                value={[atomSize]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={(value) => setAtomSize(value[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rotation Speed</span>
                <span className="text-sm">{moleculeRotationSpeed.toFixed(1)}</span>
              </div>
              <Slider
                value={[moleculeRotationSpeed]}
                min={0}
                max={5}
                step={0.1}
                onValueChange={(value) => setMoleculeRotationSpeed(value[0])}
                className="py-2"
              />
            </div>
          </div>
        )

      case "dna-replication":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Helix Radius</span>
                <span className="text-sm">{helixRadius.toFixed(2)}</span>
              </div>
              <Slider
                value={[helixRadius]}
                min={0.5}
                max={2.0}
                step={0.05}
                onValueChange={(value) => setHelixRadius(value[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Helix Height</span>
                <span className="text-sm">{helixHeight.toFixed(2)}</span>
              </div>
              <Slider
                value={[helixHeight]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={(value) => setHelixHeight(value[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rotation Speed</span>
                <span className="text-sm">{dnaRotationSpeed.toFixed(1)}</span>
              </div>
              <Slider
                value={[dnaRotationSpeed]}
                min={0}
                max={3}
                step={0.1}
                onValueChange={(value) => setDnaRotationSpeed(value[0])}
                className="py-2"
              />
            </div>
          </div>
        )

      case "wave-interference":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Amplitude</span>
                <span className="text-sm">{waveAmplitude.toFixed(2)}</span>
              </div>
              <Slider
                value={[waveAmplitude]}
                min={0.1}
                max={1.0}
                step={0.05}
                onValueChange={(value) => setWaveAmplitude(value[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Frequency</span>
                <span className="text-sm">{waveFrequency.toFixed(2)}</span>
              </div>
              <Slider
                value={[waveFrequency]}
                min={0.5}
                max={3.0}
                step={0.1}
                onValueChange={(value) => setWaveFrequency(value[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Phase</span>
                <span className="text-sm">{(wavePhase / Math.PI).toFixed(2)}π</span>
              </div>
              <Slider
                value={[wavePhase]}
                min={0}
                max={Math.PI * 2}
                step={0.1}
                onValueChange={(value) => setWavePhase(value[0])}
                disabled={playing}
                className="py-2"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No adjustable parameters for this experiment.</p>
          </div>
        )
    }
  }

  return (
    <div className={`flex flex-col ${fullscreen ? "h-screen fixed inset-0 z-50 bg-white" : "h-[600px] md:h-[700px]"}`}>
      <div className="flex-grow relative">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, zoom]} />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          <Suspense
            fallback={
              <Html center>
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lavender-500"></div>
                </div>
              </Html>
            }
          >
            {renderSimulation()}
          </Suspense>

          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          <Environment preset="studio" />
        </Canvas>

        {/* Overlay controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPlaying(!playing)}
            className="rounded-full w-10 h-10 flex items-center justify-center bg-lavender-100 hover:bg-lavender-200"
          >
            {playing ? <Pause size={18} className="text-lavender-700" /> : <Play size={18} className="text-lavender-700" />}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={resetSimulation}
            className="rounded-full w-10 h-10 flex items-center justify-center bg-lavender-100 hover:bg-lavender-200"
          >
            <RotateCcw size={18} className="text-lavender-700" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom(Math.min(zoom + 1, 10))}
            className="rounded-full w-10 h-10 flex items-center justify-center bg-lavender-100 hover:bg-lavender-200"
          >
            <ZoomIn size={18} className="text-lavender-700" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoom(Math.max(zoom - 1, 2))}
            className="rounded-full w-10 h-10 flex items-center justify-center bg-lavender-100 hover:bg-lavender-200"
          >
            <ZoomOut size={18} className="text-lavender-700" />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
            className="rounded-full w-10 h-10 flex items-center justify-center bg-lavender-100 hover:bg-lavender-200"
          >
            {fullscreen ? <Minimize2 size={18} className="text-lavender-700" /> : <Maximize2 size={18} className="text-lavender-700" />}
          </Button>
        </div>
      </div>

      {/* Controls panel */}
      <div className="bg-white border-t border-lavender-200 p-4 overflow-y-auto max-h-[300px] md:max-h-[250px]">
        <Tabs value={simulationTab} onValueChange={setSimulationTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4 bg-lavender-100">
            <TabsTrigger value="visualization" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              Visualization
            </TabsTrigger>
            <TabsTrigger value="parameters" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              Parameters
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              Data
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-lavender-500 data-[state=active]:text-white">
              AI Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="space-y-4 mt-0">
            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-lavender-800">Visualization Controls</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the controls below to adjust the visualization settings.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Zoom Level</span>
                      <span className="text-sm">{zoom.toFixed(1)}</span>
                    </div>
                    <Slider 
                      value={[zoom]} 
                      min={2} 
                      max={10} 
                      step={0.5} 
                      onValueChange={(value) => setZoom(value[0])} 
                      className="py-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4 mt-0">
            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-lavender-800">Experiment Parameters</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adjust the parameters to observe how they affect the experiment.
                </p>

                {renderControls()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-0">
            <Card className="border-lavender-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-lavender-800">Data Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  View and analyze the data collected from this experiment.
                </p>

                <div className="p-4 border border-lavender-100 rounded-lg bg-lavender-50">
                  <p className="text-sm">
                    Data visualization and analysis tools will be displayed here, including graphs, charts, and
                    numerical data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-analysis" className="space-y-4 mt-0">
            <AIAnalysis
              experiment={experiment}
              parameters={{
                // Pendulum parameters
                gravity,
                length: pendulumLength,
                damping: pendulumDamping,

                // Molecule parameters
                bondLength,
                atomSize,
                moleculeRotationSpeed,

                // DNA parameters
                helixRadius,
                helixHeight,
                dnaRotationSpeed,

                // Wave parameters
                amplitude: waveAmplitude,
                frequency: waveFrequency,
                phase: wavePhase,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
