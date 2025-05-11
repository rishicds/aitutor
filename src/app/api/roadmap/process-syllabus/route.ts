import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

interface Topic {
  id: string;
  title: string;
  description: string;
  keyPoints?: string[];
  videoSearchQuery?: string;
  articleTitle?: string;
  order: number;
  completed: boolean;
  nextTopics?: string[];
  resources?: Resource[];
}

interface Resource {
  id: string;
  title: string;
  url: string;
  type: "video" | "article" | "other";
  platform: string;
  description: string;
}

export async function POST(request: NextRequest) {
  try {
    const { roadmapId, sessionId } = await request.json();

    if (!roadmapId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get the roadmap document
    const roadmapRef = doc(db, "roadmaps", roadmapId);
    const roadmapSnap = await getDoc(roadmapRef);

    if (!roadmapSnap.exists()) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    const roadmapData = roadmapSnap.data();

    // Ensure the roadmap belongs to the session
    if (roadmapData.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Unauthorized access to roadmap" },
        { status: 403 }
      );
    }

    // Get the syllabus text
    const syllabusText = roadmapData.syllabusText;

    if (!syllabusText) {
      await updateDoc(roadmapRef, {
        status: "error",
        description: "No syllabus text found to process.",
      });
      return NextResponse.json(
        { error: "No syllabus text found" },
        { status: 400 }
      );
    }

    // Initialize Gemini AI model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 8192,
      },
    });

    // Extract course information
    const coursePrompt = `
    You are an education expert analyzing a course syllabus. Extract the following information from the syllabus:
    1. Course name/title
    2. A brief description of the course (2-3 sentences)
    3. Level/difficulty of the course (e.g., introductory, intermediate, advanced)
    
    Output in JSON format:
    {
      "courseTitle": "string",
      "courseDescription": "string",
      "courseLevel": "string"
    }
    
    Here is the syllabus text:
    ${syllabusText.substring(0, 15000)}
    `;

    const courseResult = await model.generateContent(coursePrompt);
    const courseResponse = await courseResult.response;
    const courseText = courseResponse.text();

    let courseInfo;
    try {
      // Try to parse the JSON response
      courseInfo = JSON.parse(courseText.replace(/```json|```/g, "").trim());
    } catch (error) {
      console.error("Error parsing course info JSON:", error);
      courseInfo = {
        courseTitle: "Untitled Course",
        courseDescription: "A learning roadmap based on your syllabus.",
        courseLevel: "Not specified",
      };
    }

    // Extract topics and organize them
    const topicsPrompt = `
    You are an AI education assistant helping create a learning roadmap from a course syllabus.
    Analyze the syllabus text and extract the key topics that students need to learn.
    
    For each topic:
    1. Identify the main topic title
    2. Write a brief description of what this topic covers
    3. Identify 3-5 key points students should understand
    4. Suggest one YouTube video (just the topic to search for, not URLs)
    5. Suggest one article/resource title for reading
    6. Determine the logical order in which these topics should be learned
    
    Return your analysis as a JSON array where each object represents a topic:
    
    [
      {
        "title": "Topic title",
        "description": "Brief description of the topic",
        "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
        "videoSearchQuery": "Recommended search query for YouTube",
        "articleTitle": "Recommended article title or search query",
        "order": 1
      }
    ]
    
    Important: 
    - Extract 8-15 distinct topics from the syllabus
    - Order them logically from foundational concepts to advanced topics
    - Focus on the most important concepts in the course
    - Ensure the topic titles are clear and specific
    
    Here is the syllabus text:
    ${syllabusText.substring(0, 25000)}
    `;

    const topicsResult = await model.generateContent(topicsPrompt);
    const topicsResponse = await topicsResult.response;
    const topicsText = topicsResponse.text();

    let topicsList;
    try {
      // Try to parse the JSON response
      topicsText.replace(/```json|```/g, "").trim();
      topicsList = JSON.parse(topicsText.replace(/```json|```/g, "").trim());
    } catch (error) {
      console.error("Error parsing topics JSON:", error);
      topicsList = [];
    }

    // Process each topic to add resources
    const processedTopics = topicsList.map(
      (topic: {
        title: string;
        description: string;
        keyPoints?: string[];
        videoSearchQuery?: string;
        articleTitle?: string;
        order?: number;
      }) => {
        // Generate a unique ID for the topic
        const topicId = uuidv4();

        // Create video resource
        const videoResource = {
          id: uuidv4(),
          title: `${topic.title} - Video Tutorial`,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            topic.videoSearchQuery || topic.title + " tutorial"
          )}`,
          type: "video" as const,
          platform: "YouTube",
          description: `Learn about ${topic.title} through video tutorials`,
        };

        // Create article resource
        const articleResource = {
          id: uuidv4(),
          title: topic.articleTitle || `${topic.title} - Comprehensive Guide`,
          url: `https://scholar.google.com/scholar?q=${encodeURIComponent(
            topic.articleTitle || topic.title
          )}`,
          type: "article" as const,
          platform: "Google Scholar",
          description: `Deepen your understanding of ${topic.title} through academic articles`,
        };

        // Return the processed topic
        return {
          id: topicId,
          title: topic.title,
          description: topic.description,
          keyPoints: topic.keyPoints || [],
          completed: false,
          order: topic.order || 0,
          resources: [videoResource, articleResource],
        };
      }
    );

    // Enhance with next topic recommendations
    const enhancedTopics = processedTopics.map(
      (topic: Topic, index: number) => {
        // Determine next topics (usually the next 1-2 topics in sequence)
        const nextTopics = [];

        if (index < processedTopics.length - 1) {
          nextTopics.push(processedTopics[index + 1].id);
        }

        // For some topics, add a second recommendation if available
        if (index < processedTopics.length - 2) {
          nextTopics.push(processedTopics[index + 2].id);
        }

        return {
          ...topic,
          nextTopics,
        };
      }
    );

    // Update the roadmap with the processed data
    await updateDoc(roadmapRef, {
      title: courseInfo.courseTitle || roadmapData.title,
      description:
        courseInfo.courseDescription ||
        "A learning roadmap based on your syllabus.",
      course: courseInfo.courseLevel || "General",
      status: "completed",
      topics: enhancedTopics,
      currentLevel: "intermediate",
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Syllabus processed successfully",
      roadmapId,
    });
  } catch (error) {
    console.error("Error processing syllabus:", error);
    return NextResponse.json(
      {
        error: "Failed to process syllabus",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
