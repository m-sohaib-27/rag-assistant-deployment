import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

// PDF parsing would require pdf-parse package
// For now, implementing basic text extraction
export class DocumentProcessor {
  
  static async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    switch (fileType.toLowerCase()) {
      case 'txt':
        return this.extractTextFromTxt(filePath);
      case 'csv':
        return this.extractTextFromCsv(filePath);
      case 'pdf':
        return this.extractTextFromPdf(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private static async extractTextFromTxt(filePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Failed to read TXT file: ${error?.message || 'Unknown error'}`);
    }
  }

  private static async extractTextFromCsv(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      // Convert CSV to readable text format
      const lines = content.split('\n');
      const headers = lines[0]?.split(',') || [];
      
      let text = `CSV Data with columns: ${headers.join(', ')}\n\n`;
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i]?.split(',') || [];
        if (values.length > 0 && values[0].trim()) {
          const row = headers.map((header, index) => 
            `${header.trim()}: ${values[index]?.trim() || ''}`
          ).join(', ');
          text += `Row ${i}: ${row}\n`;
        }
      }
      
      return text;
    } catch (error: any) {
      throw new Error(`Failed to read CSV file: ${error?.message || 'Unknown error'}`);
    }
  }

  private static async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      // Set up DOM polyfills for Node.js environment
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
      (global as any).DOMMatrix = dom.window.DOMMatrix;
      (global as any).document = dom.window.document;
      (global as any).window = dom.window;
      
      // Use legacy build for Node.js compatibility
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      
      const dataBuffer = fs.readFileSync(filePath);
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(dataBuffer),
        useSystemFonts: true,
        disableFontFace: true,
      }).promise;

      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error: any) {
      throw new Error(`Failed to process PDF file: ${error?.message || 'Unknown error'}`);
    }
  }

  static chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + chunkSize;
      
      // Try to break at sentence or paragraph boundaries
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + chunkSize * 0.7) {
          end = breakPoint + 1;
        }
      }
      
      const chunk = text.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      
      start = end - overlap;
    }
    
    return chunks;
  }

  static extractMetadata(chunk: string, chunkIndex: number, fileName: string): any {
    // Extract basic metadata from chunk
    const metadata: any = {
      chunkIndex,
      fileName,
      wordCount: chunk.split(/\s+/).length,
      charCount: chunk.length,
    };

    // Try to detect if this is a header or special section
    const lines = chunk.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine && firstLine.length < 100 && lines.length > 1) {
      metadata.possibleHeader = firstLine;
    }

    // Look for common patterns
    if (chunk.includes('FAQ') || chunk.includes('Question:') || chunk.includes('Q:')) {
      metadata.contentType = 'faq';
    } else if (chunk.includes('Step') || chunk.includes('Instructions')) {
      metadata.contentType = 'instructions';
    } else if (chunk.includes('Price') || chunk.includes('Cost') || chunk.includes('$')) {
      metadata.contentType = 'pricing';
    }

    return metadata;
  }
}
