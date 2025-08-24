import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertDocumentSchema, insertQuerySchema } from "@shared/schema";
import { DocumentProcessor } from "./services/documentProcessor";
import { VectorService } from "./services/vectorService";
import { RAGService } from "./services/ragService";

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['pdf', 'csv', 'txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${fileExtension}. Only PDF, CSV, and TXT files are allowed.`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check route
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Upload document
  app.post("/api/documents", upload.single('file'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);
      
      const documentData = {
        name: req.file.originalname,
        type: fileExtension,
        size: req.file.size,
        status: "processing" as const,
        content: null,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);

      // Process document asynchronously
      processDocumentAsync(document.id, req.file.path, fileExtension);
      
      res.json(document);
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(400).json({ message: error?.message || "Failed to upload document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Submit query
  app.post("/api/queries", async (req, res) => {
    try {
      const validatedData = insertQuerySchema.parse(req.body);
      const query = await storage.createQuery(validatedData);
      
      // Process query asynchronously
      processQueryAsync(query.id);
      
      res.json(query);
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Failed to submit query" });
    }
  });

  // Get query by ID
  app.get("/api/queries/:id", async (req, res) => {
    try {
      const query = await storage.getQuery(req.params.id);
      if (!query) {
        return res.status(404).json({ message: "Query not found" });
      }
      res.json(query);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch query" });
    }
  });

  // Get recent queries
  app.get("/api/queries", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const queries = await storage.getRecentQueries(limit);
      res.json(queries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch queries" });
    }
  });

  // Get system stats
  app.get("/api/stats", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      const queries = await storage.getAllQueries();
      const chunks = await storage.getAllChunks();
      
      const processedDocuments = documents.filter(doc => doc.status === 'processed');
      const todayQueries = queries.filter(query => {
        const today = new Date();
        const queryDate = new Date(query.createdAt);
        return queryDate.toDateString() === today.toDateString();
      });

      const completedQueries = queries.filter(query => query.status === 'completed' && query.confidence);
      const avgAccuracy = completedQueries.length > 0 
        ? completedQueries.reduce((sum, query) => sum + (query.confidence || 0), 0) / completedQueries.length
        : 0;

      const vectorStats = VectorService.getEmbeddingStats(chunks);

      res.json({
        totalDocuments: documents.length,
        processedDocuments: processedDocuments.length,
        totalQueries: queries.length,
        queriesToday: todayQueries.length,
        avgAccuracy: Math.round(avgAccuracy * 100),
        totalChunks: vectorStats.totalChunks,
        chunksWithEmbeddings: vectorStats.chunksWithEmbeddings,
        indexingProgress: vectorStats.totalChunks > 0 ? 
          Math.round((vectorStats.chunksWithEmbeddings / vectorStats.totalChunks) * 100) : 0
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get chunks for debugging
  app.get("/api/chunks", async (req, res) => {
    try {
      const chunks = await storage.getAllChunks();
      const debugInfo = chunks.map(chunk => ({
        id: chunk.id,
        documentId: chunk.documentId,
        chunkIndex: chunk.chunkIndex,
        contentPreview: chunk.content.substring(0, 100) + '...',
        hasEmbedding: !!chunk.embedding?.length,
        embeddingLength: chunk.embedding?.length || 0,
        metadata: chunk.metadata
      }));
      res.json({ 
        total: chunks.length,
        withEmbeddings: chunks.filter(c => c.embedding?.length).length,
        chunks: debugInfo 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chunks" });
    }
  });

  // Get example questions
  app.get("/api/example-questions", async (req, res) => {
    try {
      const chunks = await storage.getAllChunks();
      const examples = await RAGService.generateExampleQuestions(chunks);
      res.json(examples);
    } catch (error) {
      console.error('Example questions error:', error);
      // Return fallback questions
      res.json([
        "How do I reset my password?",
        "What are your pricing plans?",
        "How do I contact customer support?"
      ]);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Async function to process uploaded documents
async function processDocumentAsync(documentId: string, filePath: string, fileType: string) {
  try {
    // Extract text from document
    const content = await DocumentProcessor.extractTextFromFile(filePath, fileType);
    
    // Update document with content
    await storage.updateDocument(documentId, {
      content,
      status: "processed",
      processedAt: new Date(),
    });

    // Create chunks and generate embeddings
    const chunks = DocumentProcessor.chunkText(content);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      const embedding = await VectorService.generateEmbedding(chunkContent);
      const metadata = DocumentProcessor.extractMetadata(chunkContent, i, path.basename(filePath));

      await storage.createDocumentChunk({
        documentId,
        content: chunkContent,
        chunkIndex: i,
        embedding,
        metadata,
      });
    }

    console.log(`Document ${documentId} processed successfully with ${chunks.length} chunks`);
    
  } catch (error: any) {
    console.error(`Error processing document ${documentId}:`, error);
    await storage.updateDocument(documentId, {
      status: "error",
      errorMessage: error?.message || "Processing failed",
    });
  } finally {
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }
  }
}

// Async function to process queries
async function processQueryAsync(queryId: string) {
  try {
    const query = await storage.getQuery(queryId);
    if (!query) {
      throw new Error('Query not found');
    }

    const chunks = await storage.getAllChunks();
    const documents = await storage.getAllDocuments();
    
    const response = await RAGService.generateAnswer(
      query.question,
      chunks,
      documents
    );

    await storage.updateQuery(queryId, {
      answer: response.answer,
      confidence: response.confidence,
      sources: response.sources,
      status: "completed",
    });

    console.log(`Query ${queryId} processed successfully`);
    
  } catch (error: any) {
    console.error(`Error processing query ${queryId}:`, error);
    await storage.updateQuery(queryId, {
      status: "error",
      errorMessage: error?.message || "Query processing failed",
    });
  }
}
