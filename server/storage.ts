import { type User, type InsertUser, type Document, type InsertDocument, type DocumentChunk, type Query, type InsertQuery } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  
  // Document chunk methods
  createDocumentChunk(chunk: Omit<DocumentChunk, "id">): Promise<DocumentChunk>;
  getDocumentChunks(documentId: string): Promise<DocumentChunk[]>;
  getAllChunks(): Promise<DocumentChunk[]>;
  deleteDocumentChunks(documentId: string): Promise<void>;
  
  // Query methods
  createQuery(query: InsertQuery): Promise<Query>;
  getQuery(id: string): Promise<Query | undefined>;
  getAllQueries(): Promise<Query[]>;
  updateQuery(id: string, updates: Partial<Query>): Promise<Query | undefined>;
  getRecentQueries(limit?: number): Promise<Query[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private documentChunks: Map<string, DocumentChunk>;
  private queries: Map<string, Query>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.documentChunks = new Map();
    this.queries = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      content: insertDocument.content || null,
      uploadedAt: new Date(),
      processedAt: null,
      errorMessage: null,
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const deleted = this.documents.delete(id);
    if (deleted) {
      await this.deleteDocumentChunks(id);
    }
    return deleted;
  }

  // Document chunk methods
  async createDocumentChunk(chunk: Omit<DocumentChunk, "id">): Promise<DocumentChunk> {
    const id = randomUUID();
    const documentChunk: DocumentChunk = { ...chunk, id };
    this.documentChunks.set(id, documentChunk);
    return documentChunk;
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    return Array.from(this.documentChunks.values()).filter(
      chunk => chunk.documentId === documentId
    ).sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async getAllChunks(): Promise<DocumentChunk[]> {
    return Array.from(this.documentChunks.values());
  }

  async deleteDocumentChunks(documentId: string): Promise<void> {
    const toDelete = Array.from(this.documentChunks.entries())
      .filter(([_, chunk]) => chunk.documentId === documentId)
      .map(([id]) => id);
    
    toDelete.forEach(id => this.documentChunks.delete(id));
  }

  // Query methods
  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const id = randomUUID();
    const query: Query = {
      ...insertQuery,
      id,
      answer: null,
      confidence: null,
      sources: null,
      status: "processing",
      errorMessage: null,
      createdAt: new Date(),
    };
    this.queries.set(id, query);
    return query;
  }

  async getQuery(id: string): Promise<Query | undefined> {
    return this.queries.get(id);
  }

  async getAllQueries(): Promise<Query[]> {
    return Array.from(this.queries.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateQuery(id: string, updates: Partial<Query>): Promise<Query | undefined> {
    const query = this.queries.get(id);
    if (!query) return undefined;
    
    const updatedQuery = { ...query, ...updates };
    this.queries.set(id, updatedQuery);
    return updatedQuery;
  }

  async getRecentQueries(limit: number = 10): Promise<Query[]> {
    const allQueries = await this.getAllQueries();
    return allQueries.slice(0, limit);
  }
}

export const storage = new MemStorage();
