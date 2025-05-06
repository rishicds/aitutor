import { NextResponse } from 'next/server';
import { Pinecone, Index } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { RetrievalQAChain, loadQAStuffChain } from 'langchain/chains';
import { PromptTemplate } from "@langchain/core/prompts";
import { Document } from 'langchain/document';

// console.log("Loading /api/chat-with-pdf route..."); // Removed to avoid build-time log

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

// Declare clients at module level, but initialize lazily
let pinecone: Pinecone | null = null;
let pineconeIndex: Index | null = null;
let embeddings: OpenAIEmbeddings | null = null;
let llm: ChatOpenAI | null = null;
let chatInitializationError: string | null = null;

async function initializeChatClients() {
  if (pinecone && pineconeIndex && embeddings && llm) {
    console.log("Chat clients already initialized.");
    return;
  }
  console.log("Attempting to initialize Chat clients...");

  const missingVar = checkEnvVars(requiredEnvVars);
  if (missingVar) {
    chatInitializationError = `Missing environment variable for Chat: ${missingVar}.`;
    console.error(chatInitializationError);
    return; 
  }

  try {
    console.log("Initializing Pinecone client for chat...");
    const pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    console.log("Accessing Pinecone index for chat:", process.env.PINECONE_INDEX_NAME!);
    if (!process.env.PINECONE_INDEX_NAME) throw new Error("PINECONE_INDEX_NAME is not set for chat");
    const pi = pc.index(process.env.PINECONE_INDEX_NAME);
    console.log("Pinecone initialized successfully for chat.");

    console.log("Initializing OpenAIEmbeddings for chat...");
    const em = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY! });
    console.log("OpenAIEmbeddings initialized successfully for chat.");

    console.log("Initializing ChatOpenAI model for chat...");
    const chatModel = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
    });
    console.log("ChatOpenAI model initialized successfully for chat.");

    // Assign to module-level variables only on successful initialization
    pinecone = pc;
    pineconeIndex = pi;
    embeddings = em;
    llm = chatModel;
    chatInitializationError = null; // Clear any previous error

  } catch (initError) {
    chatInitializationError = `Error during initialization in /api/chat-with-pdf: ${initError instanceof Error ? initError.message : String(initError)}`;
    console.error(chatInitializationError, initError);
    // Reset to null if partial initialization occurred
    pinecone = null;
    pineconeIndex = null;
    embeddings = null;
    llm = null;
  }
}

const promptTemplate = `You are an AI assistant helping students with questions about a Previous Year Question (PYQ) paper titled "{pdfTitle}".
Use ONLY the following pieces of context from the PDF to answer the question. The context contains relevant excerpts from the PDF.
If the answer is not found within the provided context, explicitly state "The answer to your question is not found in the provided context of this PDF." Do not try to make up an answer or use external knowledge.
If the question is a greeting, a general comment, or clearly not related to the content of the PDF, politely respond that you can only answer questions about the content of the PYQ paper "{pdfTitle}".
Keep your answers concise and directly based on the provided context.

Context from "{pdfTitle}":
{context}

Question: {question}

Helpful Answer based on the PDF content:`;

const QA_PROMPT = new PromptTemplate({
  template: promptTemplate,
  inputVariables: ["context", "question", "pdfTitle"],
});

export async function POST(req: Request) {
  // Ensure clients are initialized
  if (!pinecone || !pineconeIndex || !embeddings || !llm) {
    await initializeChatClients();
  }

  // Check if initialization failed or there are still missing clients
  if (chatInitializationError) {
    console.error("Chat API Misconfiguration:", chatInitializationError);
    return NextResponse.json({ error: `Server misconfiguration: ${chatInitializationError} Please check server logs.` }, { status: 500 });
  }
  if (!pinecone || !pineconeIndex || !embeddings || !llm) {
    console.error("Chat API Misconfiguration: Clients not initialized and no specific error recorded.");
    return NextResponse.json({ error: "Server misconfiguration: Critical chat clients not initialized. Please check server logs." }, { status: 500 });
  }

  console.log("Received POST request on /api/chat-with-pdf");
  // The direct check for missingVar is now part of initializeChatClients
  // The direct check for client variables remains important.

  try {
    const body = await req.json();
    const { question, pdfId, pdfTitle } = body;

    if (!question || !pdfId || !pdfTitle) {
      console.warn("Missing question, pdfId, or pdfTitle in chat request body");
      return NextResponse.json({ error: 'Missing question, pdfId, or pdfTitle' }, { status: 400 });
    }
    console.log(`Chatting for PDF ID: ${pdfId}, Title: ${pdfTitle}. Question: ${question}`);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });
    console.log("PineconeStore initialized for retrieval.");

    const retriever = vectorStore.asRetriever({
      k: 5,
      filter: {
        pdfId: pdfId,
      },
    });
    console.log("Retriever configured with filter for pdfId:", pdfId);

    const chain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(llm, { prompt: QA_PROMPT }),
      retriever: retriever,
      returnSourceDocuments: true,
    });
    console.log("RetrievalQAChain created.");

    console.log("Invoking chain with question...");
    const result = await chain.invoke({
      query: question,
      pdfTitle: pdfTitle,
    });
    console.log("Chain invoked. Result received.");

    return NextResponse.json({ 
      answer: result.text,
      sources: result.sourceDocuments?.map((doc: Document) => ({
        pageContent: doc.pageContent.substring(0, 300) + '...',
        metadata: doc.metadata,
      })) || [] 
    });

  } catch (error) {
    console.error('Error in /api/chat-with-pdf:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get answer from AI. Check server logs.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 