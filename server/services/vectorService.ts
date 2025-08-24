import OpenAI from "openai";
import { DocumentChunk } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class VectorService {
  
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      
      return response.data[0].embedding;
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error?.message || 'Unknown error'}`);
    }
  }

  static async findSimilarChunks(
    queryEmbedding: number[], 
    chunks: DocumentChunk[], 
    topK: number = 5,
    threshold: number = 0.7
  ): Promise<Array<{ chunk: DocumentChunk; similarity: number }>> {
    
    const similarities = chunks.map(chunk => {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        return { chunk, similarity: 0 };
      }
      
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, similarity };
    });

    // Filter by threshold and sort by similarity
    return similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Calculate embedding statistics for system status
  static getEmbeddingStats(chunks: DocumentChunk[]): {
    totalChunks: number;
    chunksWithEmbeddings: number;
    averageEmbeddingDimension: number;
  } {
    const chunksWithEmbeddings = chunks.filter(chunk => 
      chunk.embedding && chunk.embedding.length > 0
    );

    const averageDimension = chunksWithEmbeddings.length > 0
      ? chunksWithEmbeddings.reduce((sum, chunk) => sum + (chunk.embedding?.length || 0), 0) / chunksWithEmbeddings.length
      : 0;

    return {
      totalChunks: chunks.length,
      chunksWithEmbeddings: chunksWithEmbeddings.length,
      averageEmbeddingDimension: Math.round(averageDimension),
    };
  }
}
