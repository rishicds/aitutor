import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai"; // UNCOMMENTED - Need to install @google/generative-ai

// Ensure the API key is available
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY; // Using NEXT_PUBLIC_ as requested
if (!GEMINI_API_KEY) {
    // Note: This key will be exposed to the client-side bundle.
    console.error("Error: NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set. This key WILL be exposed client-side.");
    // Optionally, throw an error during server startup or handle it gracefully
    // For now, we'll let requests fail later if the key isn't present during initialization.
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key existence per request
    if (!GEMINI_API_KEY) {
        // This check is somewhat redundant if the variable is public, but good practice.
        return NextResponse.json({ error: 'Server configuration error: NEXT_PUBLIC_GEMINI_API_KEY not set.' }, { status: 500 });
    }

    const body = await request.json();
    const imageDataUrl = body.image;

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/png;base64,')) {
      return NextResponse.json({ error: 'Invalid image data format. Please provide a base64 encoded PNG data URL.' }, { status: 400 });
    }

    // --- START: AI Integration --- 

    // 1. Initialize the Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // 2. Select the Gemini Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // 3. Prepare the image data for the API
    const base64ImageData = imageDataUrl.split(',')[1];
    const imagePart = { // Moved declaration outside comment
        inlineData: {
            data: base64ImageData,
            mimeType: "image/png"
        }
    };

    // 4. Construct the prompt for the model
    const prompt = `Analyze the handwritten content in this image. First, transcribe the handwritten text or mathematical/scientific notation exactly as you see it. Then, interpret the transcribed content as a problem (e.g., math, physics, chemistry, general science) and provide a step-by-step solution. If it's not a solvable problem, describe the content. Format the output as JSON with keys "recognizedText" and "solution". Ensure the output is a single valid JSON object string.`; // Updated prompt for clarity and JSON requirement

    // 5. Make the API Call
    // UNCOMMENTED API CALL BLOCK
    try {
      console.log("Sending request to Gemini API...");
      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();
      console.log("Received response from Gemini API. Raw text:", text);

      // Attempt to parse the JSON response from Gemini
      let parsedResult;
      try {
        // --- Start: Extract JSON from Markdown --- 
        let jsonString = text;
        const jsonRegex = /```json\n([\s\S]*?)\n```/;
        const match = text.match(jsonRegex);
        if (match && match[1]) {
            jsonString = match[1].trim();
            console.log("Extracted JSON string:", jsonString);
        } else {
            // Handle cases where the response might be plain JSON without fences
            // or if the regex fails unexpectedly.
            jsonString = text.trim(); // Assume it might be plain JSON
            console.log("Assuming plain JSON string (no markdown fences found):", jsonString);
        }
        // --- End: Extract JSON from Markdown --- 

        parsedResult = JSON.parse(jsonString); // Parse the extracted/trimmed string

        if (typeof parsedResult !== 'object' || parsedResult === null || !parsedResult.recognizedText || !parsedResult.solution) {
            console.error("Parsed JSON missing required fields or is not a valid object. Parsed Object:", parsedResult);
            throw new Error('AI response missing required fields or invalid format.');
        }
      } catch (parseError) {
          const message = parseError instanceof Error ? parseError.message : String(parseError);
          console.error("Failed to parse AI response as JSON:", message, "Raw response:", text);
          // Consider just returning an error here, as the requested format wasn't met.
           return NextResponse.json({ error: `AI failed to return valid JSON. Raw response: ${text}` }, { status: 500 });
          /* Fallback implementation (alternative):
          parsedResult = {
              recognizedText: "[AI failed to provide structured transcription]",
              solution: text // Return raw text as solution
          };
          */
      }

       return NextResponse.json({
        recognizedText: parsedResult.recognizedText,
        solution: parsedResult.solution
      });

    } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : String(apiError);
        console.error("Gemini API Error:", message);
        // Provide more specific error feedback if possible
        let errorMessage = 'Failed to call AI model.';
        if (message?.includes('API key not valid')) {
            errorMessage = 'Invalid API Key provided for Gemini.';
        }
        // Add more specific error checks if needed (e.g., quota exceeded)
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    // REMOVED Placeholder Response Section 
    // --- END: AI Integration --- 

  } catch (error) {
    console.error('Error in /api/solve-drawing:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
} 