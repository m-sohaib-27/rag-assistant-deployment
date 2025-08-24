import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {

  try {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

export async function generateResponse(prompt: string, context: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that answers questions based on the provided context. 
          Use only the information from the context to answer questions. 
          If the context doesn't contain enough information to answer the question, say so.
          Always cite your sources by mentioning which document or section the information comes from.`,
        },
        {
          role: "user",
          content: `Context: ${context}\n\nQuestion: ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "I couldn't generate a response.";
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate response");
  }
}