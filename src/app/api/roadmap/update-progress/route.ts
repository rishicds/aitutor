import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore"

export async function POST(request: NextRequest) {
  try {
    const { roadmapId, topicId, sessionId, completed } = await request.json()

    if (!roadmapId || !topicId || !sessionId || completed === undefined) {
      return NextResponse.json(
        {
          error: "Missing required parameters. Please provide roadmapId, topicId, sessionId, and completed status.",
        },
        { status: 400 },
      )
    }

    // Get the roadmap document
    const roadmapRef = doc(db, "roadmaps", roadmapId)
    const roadmapSnap = await getDoc(roadmapRef)

    if (!roadmapSnap.exists()) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 })
    }

    const roadmapData = roadmapSnap.data()

    // Ensure the roadmap belongs to the session
    if (roadmapData.sessionId !== sessionId) {
      return NextResponse.json({ error: "Unauthorized access to roadmap" }, { status: 403 })
    }

    // Find the topic in the roadmap
    const topics = roadmapData.topics || []
    const topicIndex = topics.findIndex((topic: { id: string }) => topic.id === topicId)

    if (topicIndex === -1) {
      return NextResponse.json({ error: "Topic not found in roadmap" }, { status: 404 })
    }

    // Get the current topic
    const currentTopic = topics[topicIndex]

    // Create an updated topic with the new completion status
    const updatedTopic = {
      ...currentTopic,
      completed: completed,
    }

    // Remove the old topic and add the updated one
    await updateDoc(roadmapRef, {
      topics: arrayRemove(currentTopic),
      updatedAt: serverTimestamp(),
    })

    await updateDoc(roadmapRef, {
      topics: arrayUnion(updatedTopic),
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      message: `Topic progress updated: ${completed ? "completed" : "marked as incomplete"}`,
    })
  } catch (error) {
    console.error("Error updating topic progress:", error)
    return NextResponse.json(
      {
        error: "Failed to update topic progress",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
