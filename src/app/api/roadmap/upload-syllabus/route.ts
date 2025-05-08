import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import pdf from 'pdf-parse/lib/pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check file type
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    
    // Extract text from PDF
    const buffer = await file.arrayBuffer();
    const pdfData = await pdf(Buffer.from(buffer));
    const pdfText = pdfData.text;
    
    // Generate a unique ID for the roadmap
    const roadmapId = uuidv4();
    
    // Create a placeholder roadmap document in Firestore
    const courseName = file.name.replace('.pdf', '').replace(/_/g, ' ');
    
    await setDoc(doc(db, 'roadmaps', roadmapId), {
      userId,
      title: courseName || 'Untitled Roadmap',
      description: 'Processing syllabus...',
      course: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'processing',
      syllabusText: pdfText,
      topics: [],
    });
    
    // Trigger the processing in the background
    fetch(`${request.nextUrl.origin}/api/roadmap/process-syllabus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roadmapId,
        userId,
      }),
    }).catch(error => {
      console.error('Error triggering syllabus processing:', error);
    });
    
    // Return success with the roadmap ID
    return NextResponse.json({ 
      success: true, 
      roadmapId,
      message: 'Syllabus uploaded successfully. Processing has begun.',
    });
    
  } catch (error) {
    console.error('Error processing syllabus upload:', error);
    return NextResponse.json({ 
      error: 'Failed to process syllabus upload', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 