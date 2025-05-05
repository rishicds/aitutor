import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key is available
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("Error: NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set. This key WILL be exposed client-side.");
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key existence per request
    if (!GEMINI_API_KEY) {
        return NextResponse.json({ error: 'Server configuration error: NEXT_PUBLIC_GEMINI_API_KEY not set.' }, { status: 500 });
    }

    const body = await request.json();
    const imageUrl = body.imageUrl;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL. Please provide a valid image URL.' }, { status: 400 });
    }

    // --- START: AI Integration --- 

    // 1. Initialize the Google Generative AI SDK
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // 2. Select the Gemini Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    try {
      console.log("Fetching image from URL...");
      // Fetch the image from the provided URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      
      // Get image as blob and convert to base64
      const imageBlob = await imageResponse.blob();
      const imageArrayBuffer = await imageBlob.arrayBuffer();
      const imageBase64 = Buffer.from(imageArrayBuffer).toString('base64');
      
      // 3. Prepare the image data for the API
      const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType: imageBlob.type
        }
      };

      // 4. Construct the prompt for the model
      const prompt = `Analyze this image carefully. Identify what is shown in the image and provide a detailed explanation. 
      If it contains a problem (mathematical, scientific, etc.), solve it step by step. 
      If it's a diagram, chart, or illustration, explain what it represents.
      Format the output as JSON with keys "description" and "analysis". 
      Ensure the output is a single valid JSON object string.`;

      // 5. Make the API Call
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
            jsonString = text.trim(); // Assume it might be plain JSON
            console.log("Assuming plain JSON string (no markdown fences found):", jsonString);
        }
        // --- End: Extract JSON from Markdown --- 

        parsedResult = JSON.parse(jsonString);

        if (typeof parsedResult !== 'object' || parsedResult === null || !parsedResult.description || !parsedResult.analysis) {
            console.error("Parsed JSON missing required fields or is not a valid object. Parsed Object:", parsedResult);
            throw new Error('AI response missing required fields or invalid format.');
        }
      } catch (parseError) {
          const message = parseError instanceof Error ? parseError.message : String(parseError);
          console.error("Failed to parse AI response as JSON:", message, "Raw response:", text);
          return NextResponse.json({ error: `AI failed to return valid JSON. Raw response: ${text}` }, { status: 500 });
      }

      return NextResponse.json({
        description: parsedResult.description,
        analysis: parsedResult.analysis
      });

    } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : String(apiError);
        console.error("API Error:", message);
        let errorMessage = 'Failed to process the image.';
        if (message?.includes('API key not valid')) {
            errorMessage = 'Invalid API Key provided for Gemini.';
        } else if (message?.includes('Failed to fetch image')) {
            errorMessage = message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    // --- END: AI Integration --- 

  } catch (error) {
    console.error('Error in /api/solve-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Internal server error: ${errorMessage}` }, { status: 500 });
  }
}