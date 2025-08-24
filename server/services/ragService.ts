import OpenAI from "openai";
import { VectorService } from "./vectorService";
import { DocumentChunk, Document } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface RAGResponse {
  answer: string;
  confidence: number;
  sources: Array<{
    documentId: string;
    documentName: string;
    chunkId: string;
    relevance: number;
    content: string;
    metadata?: any;
  }>;
}

export class RAGService {
  
  static async generateAnswer(
    question: string,
    chunks: DocumentChunk[],
    documents: Document[]
  ): Promise<RAGResponse> {
    try {
      // Generate embedding for the question
      const questionEmbedding = await VectorService.generateEmbedding(question);
      
      // Find similar chunks with optimized threshold for good recall
      const similarChunks = await VectorService.findSimilarChunks(
        questionEmbedding,
        chunks,
        5, // top 5 chunks
        0.15 // optimized threshold for good precision/recall balance
      );

      if (similarChunks.length === 0) {
        return {
          answer: "I couldn't find relevant information in the uploaded documents to answer your question. Please try rephrasing your question or ensure you've uploaded relevant documents.",
          confidence: 0,
          sources: []
        };
      }

      // Prepare context from similar chunks
      const context = this.prepareContext(similarChunks, documents);
      
      // Generate answer using GPT
      const gptResponse = await this.generateGPTResponse(question, context);
      
      // Prepare sources
      const sources = similarChunks.map(({ chunk, similarity }) => {
        const document = documents.find(doc => doc.id === chunk.documentId);
        return {
          documentId: chunk.documentId,
          documentName: document?.name || 'Unknown Document',
          chunkId: chunk.id,
          relevance: similarity,
          content: chunk.content.substring(0, 200) + '...',
          metadata: chunk.metadata
        };
      });

      // Calculate confidence based on similarity scores and response quality
      const avgSimilarity = similarChunks.reduce((sum, item) => sum + item.similarity, 0) / similarChunks.length;
      const confidence = Math.min(0.95, avgSimilarity * 1.2); // Cap at 95%

      return {
        answer: gptResponse,
        confidence: Math.round(confidence * 100) / 100,
        sources
      };

    } catch (error: any) {
      console.error('Error in RAG service:', error);
      throw new Error(`Failed to generate answer: ${error?.message || 'Unknown error'}`);
    }
  }

  private static prepareContext(
    similarChunks: Array<{ chunk: DocumentChunk; similarity: number }>,
    documents: Document[]
  ): string {
    let context = "Based on the following relevant information from the company documents:\n\n";
    
    similarChunks.forEach(({ chunk, similarity }, index) => {
      const document = documents.find(doc => doc.id === chunk.documentId);
      const documentName = document?.name || 'Unknown Document';
      
      const metadata = chunk.metadata as any;
      context += `[Source ${index + 1}: ${documentName}${metadata?.possibleHeader ? ` - ${metadata.possibleHeader}` : ''}]\n`;
      context += `${chunk.content}\n\n`;
    });

    return context;
  }

  private static async generateGPTResponse(question: string, context: string): Promise<string> {
    try {
      const systemPrompt = `You are a helpful customer support assistant. Answer the user's question based ONLY on the provided context from company documents. 

Guidelines:
1. Be concise but comprehensive
2. If the context doesn't contain enough information, say so
3. Use bullet points or numbered lists when appropriate
4. Don't make up information not in the context
5. Be helpful and professional
6. If referencing specific procedures or steps, include them clearly`;

      const userPrompt = `Context: ${context}

Question: ${question}

Please provide a helpful answer based on the context above.`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content || "I apologize, but I couldn't generate a proper response.";
      
    } catch (error: any) {
      console.error('Error generating GPT response:', error);
      throw new Error(`Failed to generate response: ${error?.message || 'Unknown error'}`);
    }
  }

  // Generate example questions based on document content
  static async generateExampleQuestions(chunks: DocumentChunk[]): Promise<string[]> {
    if (chunks.length === 0) return [];

    try {
      // Sample some content from chunks
      const sampleContent = chunks
        .slice(0, 5)
        .map(chunk => chunk.content.substring(0, 200))
        .join('\n\n');

      const prompt = `Based on this company documentation content, suggest 3 common support questions that users might ask:

${sampleContent}

Please respond with a JSON array of exactly 3 question strings that would be relevant for customer support.`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
      return result.questions || [];
      
    } catch (error) {
      console.error('Error generating example questions:', error);
      return [
        "How do I reset my password?",
        "What are your pricing plans?",
        "How do I contact customer support?"
      ];
    }
  }
}
