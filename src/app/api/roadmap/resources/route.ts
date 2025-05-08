import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty = 'intermediate' } = await request.json();
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }
    
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });
    
    // Create prompt for resource recommendations
    const prompt = `
    You are an educational resource expert. Please recommend additional learning resources for the following topic:
    
    Topic: ${topic}
    Difficulty level: ${difficulty}
    
    Provide your recommendations in the following JSON format:
    [
      {
        "title": "Resource title",
        "type": "video | article | other",
        "platform": "Platform name (e.g., YouTube, Coursera, etc.)",
        "searchQuery": "Recommended search query to find this resource",
        "description": "Brief description of what students will learn from this resource"
      }
    ]
    
    Return exactly 5 resources:
    - 2 video tutorials (prefer YouTube)
    - 2 articles or text-based resources
    - 1 interactive practice resource or quiz
    
    Provide search queries that will yield good results when searched directly on the respective platforms.
    Do not include actual URLs, just search queries.
    `;
    
    // Get resource recommendations
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    let resources;
    try {
      // Parse the JSON response
      resources = JSON.parse(responseText.replace(/```json|```/g, '').trim());
    } catch (error) {
      console.error('Error parsing resources JSON:', error);
      return NextResponse.json({ error: 'Failed to parse resource recommendations' }, { status: 500 });
    }
    
    // Process the resources to add URLs and IDs
    const processedResources = resources.map((resource: {
      title: string;
      type: 'video' | 'article' | 'other';
      platform: string;
      searchQuery: string;
      description: string;
    }) => {
      let url;
      
      // Generate URLs based on platform and search query
      switch (resource.platform.toLowerCase()) {
        case 'youtube':
          url = `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.searchQuery)}`;
          break;
        case 'coursera':
          url = `https://www.coursera.org/search?query=${encodeURIComponent(resource.searchQuery)}`;
          break;
        case 'khan academy':
          url = `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(resource.searchQuery)}`;
          break;
        case 'edx':
          url = `https://www.edx.org/search?q=${encodeURIComponent(resource.searchQuery)}`;
          break;
        case 'medium':
          url = `https://medium.com/search?q=${encodeURIComponent(resource.searchQuery)}`;
          break;
        case 'google scholar':
          url = `https://scholar.google.com/scholar?q=${encodeURIComponent(resource.searchQuery)}`;
          break;
        case 'quizlet':
          url = `https://quizlet.com/search?query=${encodeURIComponent(resource.searchQuery)}`;
          break;
        case 'stackoverflow':
          url = `https://stackoverflow.com/search?q=${encodeURIComponent(resource.searchQuery)}`;
          break;
        default:
          // Default to a Google search
          url = `https://www.google.com/search?q=${encodeURIComponent(resource.searchQuery)}`;
          break;
      }
      
      return {
        id: uuidv4(),
        title: resource.title,
        type: resource.type,
        platform: resource.platform,
        description: resource.description,
        url
      };
    });
    
    return NextResponse.json({
      success: true,
      resources: processedResources
    });
    
  } catch (error) {
    console.error('Error getting learning resources:', error);
    return NextResponse.json({
      error: 'Failed to get learning resources',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 