# RAG Support Assistant

A sophisticated document-powered AI support system that implements Retrieval-Augmented Generation (RAG) to provide intelligent responses based on uploaded documents.

## Features

- **Document Processing**: Upload PDF, CSV, and TXT files
- **AI-Powered Q&A**: Ask questions and get intelligent responses with source citations
- **Vector Search**: Advanced semantic search using OpenAI embeddings
- **Real-time Processing**: Live updates on document processing status
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI API for embeddings and text generation
- **Vector Storage**: PostgreSQL with array-based embeddings

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Initialize database**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access application**: http://localhost:5000

## Deployment

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions for various environments including Jupyter and VS Code.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for embeddings and generation
- `SESSION_SECRET`: Random string for session security
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)

## Architecture

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- TanStack Query for state management
- Wouter for routing

### Backend
- Express.js with TypeScript
- Drizzle ORM for database operations
- OpenAI integration for AI features
- Custom document processing pipeline
- Vector similarity search

### Database
- PostgreSQL for data persistence
- Vector embeddings stored as arrays
- Optimized for similarity search queries

## Support

For deployment assistance, see the comprehensive guides included in this package:
- `DEPLOYMENT_GUIDE.md` - Complete setup instructions
- `jupyter_deployment.ipynb` - Interactive Jupyter setup
- `vscode_setup.md` - VS Code development environment"# rag-assistant-deployment" 
