import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // pdf, csv, txt
  size: integer("size").notNull(),
  status: text("status").notNull().default("uploading"), // uploading, processing, processed, error
  content: text("content"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
});

export const documentChunks = pgTable("document_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: real("embedding").array(),
  metadata: jsonb("metadata"), // page number, section, etc.
});

export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer"),
  confidence: real("confidence"),
  sources: jsonb("sources"), // array of {documentId, chunkId, relevance}
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status").notNull().default("processing"), // processing, completed, error
  errorMessage: text("error_message"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  createdAt: true,
  answer: true,
  confidence: true,
  sources: true,
  status: true,
  errorMessage: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
