import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const subject = searchParams.get("subject");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create a query to fetch chats
    let chatsQuery = query(
      collection(db, "users", userId, "chats"),
      orderBy("createdAt", "desc")
    );

    // Add subject filter if provided
    if (subject) {
      chatsQuery = query(chatsQuery, where("subject", "==", subject));
    }

    // Execute the query
    const querySnapshot = await getDocs(chatsQuery);
    const chats = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        messages: data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp || Date.now()),
        })),
      };
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}
