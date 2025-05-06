import { NextResponse } from 'next/server';
import { Pinecone, Index } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from 'langchain/document';
import pdf from 'pdf-parse/lib/pdf-parse';
import { db } from '@/lib/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

console.log("Loading /api/process-pdf route...");

// Helper to check for necessary environment variables
function checkEnvVars(vars: string[]): string | null {
  for (const v of vars) {
    if (!process.env[v]) {
      return v;
    }
  }
  return null;
}

const requiredEnvVars = [
  'PINECONE_API_KEY',
  'PINECONE_INDEX_NAME',
  'OPENAI_API_KEY'
];

const missingVar = checkEnvVars(requiredEnvVars);
let pinecone: Pinecone | null = null;
let pineconeIndex: Index | null = null;
let embeddings: OpenAIEmbeddings | null = null;

if (missingVar) {
  console.error(`Missing environment variable in /api/process-pdf: ${missingVar}. Route will not function correctly.`);
} else {
  try {
    console.log("Initializing Pinecone client...");
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    console.log("Accessing Pinecone index:", process.env.PINECONE_INDEX_NAME!);
    if (!process.env.PINECONE_INDEX_NAME) throw new Error ("PINECONE_INDEX_NAME not set");
    pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
    console.log("Pinecone initialized successfully.");

    console.log("Initializing OpenAIEmbeddings with model text-embedding-3-small...");
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: "text-embedding-3-small",
    });
    console.log("OpenAIEmbeddings initialized successfully.");
  } catch (initError) {
    console.error("Error during initialization in /api/process-pdf:", initError);
    pinecone = null;
    embeddings = null;
  }
}

export async function POST(req: Request) {
  console.log("Received POST request on /api/process-pdf");
  if (missingVar || !pinecone || !pineconeIndex || !embeddings) {
    console.error("API Misconfiguration: Environment variables missing or initialization failed.");
    return NextResponse.json({ error: `Server misconfiguration: ${missingVar ? `Missing env var ${missingVar}` : 'Initialization failed.'} Please check server logs.` }, { status: 500 });
  }

  let pdfIdForErrorLogging: string | null = null; 

  try {
    const body = await req.json();
    const { pdfId, fileUrl, title } = body;
    pdfIdForErrorLogging = pdfId; // Store for logging in case of an error later

    if (!pdfId || !fileUrl || !title) {
      console.warn("Missing pdfId, fileUrl, or title in request body");
      return NextResponse.json({ error: 'Missing pdfId, fileUrl, or title' }, { status: 400 });
    }
    console.log(`Processing PDF ID: ${pdfId}, Title: ${title}, URL: ${fileUrl}`);

    // 1. Fetch PDF from Cloudinary URL
    console.log("Fetching PDF from Cloudinary...");
    const response = await fetch(fileUrl);
    if (!response.ok) {
      console.error(`Failed to fetch PDF from Cloudinary: ${response.statusText}`);
      throw new Error(`Failed to fetch PDF from Cloudinary: ${response.statusText}`);
    }
    const pdfBuffer = await response.arrayBuffer();
    console.log("PDF fetched successfully.");

    // 2. Extract text from PDF
    console.log("Extracting text from PDF...");
    const pdfData = await pdf(pdfBuffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim() === "") {
      console.warn(`No text could be extracted from PDF ID: ${pdfId}`);
      await updateDoc(doc(db, "pyqPdfs", pdfId), {
        contentProcessed: false,
        processingError: "No text could be extracted from the PDF.",
        processedAt: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'No text could be extracted from the PDF' }, { status: 400 });
    }
    console.log(`Text extracted successfully. Length: ${rawText.length}`);

    // 3. Split text into chunks
    console.log("Splitting text into chunks...");
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const documents = await textSplitter.createDocuments([rawText]);
    console.log(`Text split into ${documents.length} chunks.`);

    const preparedDocuments = documents.map(docChunk => new Document({
      pageContent: docChunk.pageContent,
      metadata: {
        ...docChunk.metadata,
        pdfId: pdfId,
        pdfTitle: title,
        sourceUrl: fileUrl,
      }
    }));

    // 4. Generate embeddings and upsert to Pinecone
    console.log("Upserting documents to Pinecone...");
    await PineconeStore.fromDocuments(preparedDocuments, embeddings, {
      pineconeIndex,
    });
    console.log("Documents upserted to Pinecone successfully.");

    // 5. Update Firestore: Mark as processed
    console.log("Updating Firestore document...");
    await updateDoc(doc(db, "pyqPdfs", pdfId), {
      contentProcessed: true,
      processedAt: new Date().toISOString(),
      processingError: null, 
    });
    console.log("Firestore document updated successfully.");

    return NextResponse.json({ message: 'PDF processed and embeddings stored successfully.' });

  } catch (error) {
    console.error(`Error in /api/process-pdf for PDF ID ${pdfIdForErrorLogging || 'unknown'}:`, error);
    if (pdfIdForErrorLogging) {
      try {
        await updateDoc(doc(db, "pyqPdfs", pdfIdForErrorLogging), {
          contentProcessed: false,
          processingError: error instanceof Error ? error.message : "Unknown processing error. Check server logs.",
          processedAt: new Date().toISOString(),
        });
      } catch (dbError) {
        console.error(`Failed to update Firestore with processing error for PDF ID ${pdfIdForErrorLogging}:`, dbError);
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF. Check server logs.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 