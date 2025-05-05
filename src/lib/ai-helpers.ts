import { GoogleGenerativeAI } from "@google/generative-ai"

// This would be your actual API key in a real implementation
// For the demo, we'll use a placeholder
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "YOUR_API_KEY"
const genAI = new GoogleGenerativeAI(API_KEY)

// Fixed tutor names assigned per subject
const tutorMapping: Record<string, string> = {
  physics: "Dr. Arun Patel",
  chemistry: "Dr. Anjali Gupta",
  biology: "Dr. Raj Malhotra",
  neuroscience: "Dr. Neha Sharma",
  genetics: "Dr. Vikram Mehta",
}

type ExperimentParams = {
  experimentId: string
  experimentName: string
  category: string
  parameters: Record<string, number | string>
  question: string
}

export async function getExperimentAnalysis(params: ExperimentParams) {
  try {
    // In a real implementation, this would call the Gemini API
    // For the demo, we'll return mock responses

    // Get the assigned tutor name for the subject, or default to a general tutor
    const tutorName = tutorMapping[params.category] || "Dr. Chandrima Roy"

    // Construct a detailed prompt
    const prompt = `
      You are ${tutorName}, an expert in ${params.category} specializing in laboratory experiments and visualizations.
      
      The student is working with a 3D visualization of the "${params.experimentName}" experiment.
      
      Current experiment parameters:
      ${Object.entries(params.parameters)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join("\n")}
      
      Student question: "${params.question}"
      
      Provide a detailed, educational response that:
      1. Directly answers their question
      2. Explains the relevant scientific principles
      3. Relates to the current parameter settings when appropriate
      4. Suggests experiments they could try with the visualization
      
      Format your response in clear paragraphs with scientific accuracy.
    `

    // In a real implementation, this would call the Gemini API
    // For now, we'll simulate responses based on experiment type
    const responses: Record<string, string> = {
      "pendulum-motion": `The pendulum motion demonstrates simple harmonic motion, which is a type of periodic motion where the restoring force is directly proportional to the displacement.

The period (T) of a pendulum is given by T = 2π√(L/g), where L is the length and g is the gravitational acceleration. With your current settings (length: ${params.parameters.length}m, gravity: ${params.parameters.gravity}m/s²), the theoretical period would be approximately ${(2 * Math.PI * Math.sqrt(Number(params.parameters.length) / Number(params.parameters.gravity))).toFixed(2)} seconds.

The damping coefficient (${params.parameters.damping}) represents energy loss due to air resistance and friction. A higher value means the pendulum will come to rest more quickly.

Try experimenting with different length and gravity values to see how they affect the period. For example, doubling the length should increase the period by a factor of √2 (about 1.414).`,

      "molecular-bonds": `The water molecule (H₂O) visualization shows how hydrogen atoms bond with oxygen through covalent bonds. The bond angle in a real water molecule is approximately 104.5°, which is close to the tetrahedral angle of 109.5°.

With your current bond length setting (${params.parameters.bondLength}), you're seeing a representation of how the atoms are positioned relative to each other. In a real water molecule, the O-H bond length is about 0.96 Å.

The atom size parameter (${params.parameters.atomSize}) affects the visual representation but doesn't change the underlying physics. In reality, atoms don't have definite boundaries since electrons exist in probability clouds.

Try adjusting the bond length to see how it affects the molecule's geometry. Water's unique properties, including its high boiling point and surface tension, are directly related to its molecular structure and the hydrogen bonds that form between molecules.`,

      "dna-replication": `The DNA double helix structure you're observing has several key features that make it perfect for storing genetic information.

With your current settings (helix radius: ${params.parameters.helixRadius}, height: ${params.parameters.helixHeight}), you can observe how the two strands twist around each other. In a real DNA molecule, the helix makes a complete turn every 10-11 base pairs, with each base pair separated by about 3.4 Å.

The four different colored spheres represent the four nucleotide bases: adenine (A), thymine (T), guanine (G), and cytosine (C). These bases always pair in a specific way: A with T, and G with C, through hydrogen bonds.

Try increasing the helix radius to see how it affects the overall structure. The stability of DNA comes from both the hydrogen bonding between base pairs and the stacking interactions between adjacent bases. The rotation speed parameter (${params.parameters.rotationSpeed}) allows you to better visualize the 3D structure from all angles.

During DNA replication, the two strands separate, and each serves as a template for synthesizing a new complementary strand. This semi-conservative replication ensures genetic information is accurately passed to daughter cells.`,

      "wave-interference": `Wave interference is a fundamental phenomenon where two or more waves overlap and either reinforce or cancel each other out.

With your current settings (amplitude: ${params.parameters.amplitude}, frequency: ${params.parameters.frequency}, phase: ${(Number(params.parameters.phase) / Math.PI).toFixed(2)}π), you're observing how waves interact in a two-dimensional space.

When waves are in phase (peaks align with peaks), constructive interference occurs, resulting in a larger amplitude. When waves are out of phase (peaks align with troughs), destructive interference occurs, resulting in a smaller amplitude or complete cancellation.

Try adjusting the frequency parameter to see how it changes the interference pattern. Higher frequencies create more closely spaced patterns. The amplitude parameter affects the height of the peaks and depth of the troughs.

This principle explains many phenomena in physics, from light diffraction and thin-film interference to quantum wave-particle duality. In fact, the double-slit experiment with electrons demonstrates that matter also exhibits wave-like properties through interference patterns.`,
    }

    // Return the appropriate response or a default one
    return (
      responses[params.experimentId] ||
      `I'll analyze the ${params.experimentName} experiment for you.

Based on your current parameters, I can explain that this experiment demonstrates important principles in ${params.category}. 

The specific question you asked about "${params.question}" relates to how these parameters interact. In scientific terms, we would expect to see certain behaviors as you adjust these values.

Try experimenting with different parameter combinations to observe how they affect the simulation. This hands-on approach will help you develop intuition for the underlying scientific principles.`
    )
  } catch (error) {
    console.error("Error getting AI analysis:", error)
    return "Sorry, I couldn't generate an analysis at this time. Please try again later."
  }
}
