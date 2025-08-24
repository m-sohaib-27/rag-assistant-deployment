# RAG Support Assistant - Deployment Guide for AI Engineers

## Overview

This guide provides step-by-step instructions for deploying the RAG Support Assistant in Jupyter or VS Code environments. The application is a full-stack TypeScript solution with React frontend, Express backend, PostgreSQL database, and OpenAI integration.

## System Requirements

### Core Dependencies
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v12.0 or higher  
- **OpenAI API Key**: For embeddings and text generation
- **Python**: v3.8+ (for Jupyter deployment)
- **Git**: For version control

### Development Tools
- **VS Code**: Latest version with extensions
- **Jupyter Lab/Notebook**: v3.0+ (for Jupyter deployment)
- **Docker**: Optional but recommended for containerization

## Pre-Deployment Setup

### 1. Environment Preparation

```bash
# Clone or download the project
git clone <repository-url>
cd rag-support-assistant

# Verify Node.js version
node --version  # Should be v18+
npm --version   # Should be v8+
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt update && sudo apt install postgresql postgresql-contrib

# macOS with Homebrew:
brew install postgresql
brew services start postgresql

# Create database
sudo -u postgres createdb rag_support_db
sudo -u postgres createuser --interactive rag_user
```

#### Option B: Cloud Database (Recommended)
- **Neon**: https://neon.tech (free tier available)
- **Supabase**: https://supabase.com (free tier available)
- **AWS RDS**: For production deployments

### 3. Environment Variables

Create `.env` file in project root:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/rag_support_db

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
NODE_ENV=development
PORT=5000

# Session Configuration (generate random string)
SESSION_SECRET=your-super-secret-session-key-here
```

## Deployment Methods

## Method 1: VS Code Development Environment

### Step 1: VS Code Setup
```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension formulahendry.auto-rename-tag
```

### Step 2: Project Installation
```bash
# Install dependencies
npm install

# Initialize database schema
npm run db:push

# Verify setup
npm run check
```

### Step 3: Launch Development Server
```bash
# Start the application
npm run dev

# Server will be available at:
# Frontend: http://localhost:5000
# API: http://localhost:5000/api/*
```

### Step 4: VS Code Debugging Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch RAG Assistant",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": [
        "--loader", "tsx/esm"
      ],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Method 2: Jupyter Environment Deployment

### Step 1: Jupyter Setup
```bash
# Install Jupyter Lab
pip install jupyterlab

# Install Node.js kernel for Jupyter (optional)
npm install -g ijavascript
ijsinstall

# Or use Python subprocess approach
pip install subprocess-tee python-dotenv
```

### Step 2: Create Jupyter Deployment Notebook

Create `deploy_rag_assistant.ipynb`:
```python
# Cell 1: Environment Setup
import subprocess
import os
from pathlib import Path

# Set working directory
os.chdir('/path/to/your/rag-support-assistant')

# Install Node.js dependencies
subprocess.run(['npm', 'install'], check=True)

# Cell 2: Database Configuration
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Verify database connection
DATABASE_URL = os.getenv('DATABASE_URL')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

print(f"Database configured: {'Yes' if DATABASE_URL else 'No'}")
print(f"OpenAI API configured: {'Yes' if OPENAI_API_KEY else 'No'}")

# Cell 3: Launch Application
import subprocess
import threading
import time

def run_server():
    """Run the Express server in background"""
    subprocess.run(['npm', 'run', 'dev'], cwd='.')

# Start server in background thread
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Wait for server to start
time.sleep(5)
print("RAG Support Assistant is starting...")
print("Access at: http://localhost:5000")
```

### Step 3: Jupyter Extensions and Widgets
```bash
# Install useful extensions
pip install jupyterlab-git
pip install ipywidgets
jupyter labextension install @jupyter-widgets/jupyterlab-manager

# Enable extensions
jupyter lab build
```

## Production Deployment

### Method 3: Docker Containerization

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - postgres
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=rag_support_db
      - POSTGRES_USER=rag_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Method 4: Cloud Deployment

#### Vercel (Frontend + Serverless)
```bash
# Install Vercel CLI
npm i -g vercel

# Configure vercel.json
{
  "builds": [
    { "src": "server/index.ts", "use": "@vercel/node" },
    { "src": "client/**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/server/index.ts" },
    { "src": "/(.*)", "dest": "/client/$1" }
  ]
}

# Deploy
vercel --prod
```

#### Railway (Full-Stack)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

## Testing and Validation

### Automated Testing Setup
```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react jsdom

# Run tests
npm test
```

### Health Check Endpoints
```bash
# API Health Check
curl http://localhost:5000/api/health

# Database Connection Test
curl http://localhost:5000/api/stats

# Document Upload Test
curl -X POST -F "file=@test.pdf" http://localhost:5000/api/documents
```

## Configuration for AI Engineers

### Advanced OpenAI Configuration

Create `config/ai-settings.json`:
```json
{
  "embedding": {
    "model": "text-embedding-3-small",
    "dimensions": 1536,
    "batch_size": 100
  },
  "generation": {
    "model": "gpt-4o",
    "temperature": 0.1,
    "max_tokens": 2000
  },
  "rag": {
    "similarity_threshold": 0.15,
    "max_chunks": 5,
    "chunk_size": 1000,
    "overlap": 200
  }
}
```

### Custom Document Processors

Extend document processing in `server/services/documentProcessor.ts`:
```typescript
// Add support for new file types
export const supportedTypes = {
  'application/pdf': processPDF,
  'text/csv': processCSV,
  'text/plain': processText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': processDocx,
  'application/json': processJSON
};
```

### Performance Monitoring

Add monitoring middleware in `server/index.ts`:
```typescript
import { performance } from 'perf_hooks';

app.use((req, res, next) => {
  req.startTime = performance.now();
  res.on('finish', () => {
    const duration = performance.now() - req.startTime;
    console.log(`${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
  });
  next();
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL status
   pg_isready -h localhost -p 5432
   
   # Test connection string
   psql $DATABASE_URL
   ```

2. **OpenAI API Errors**
   ```bash
   # Verify API key
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. **Port Already in Use**
   ```bash
   # Find process using port 5000
   lsof -ti:5000
   
   # Kill process
   kill -9 $(lsof -ti:5000)
   ```

4. **Memory Issues with Large Documents**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run dev
   ```

### Development Tips

- Use `npm run db:push` to sync schema changes
- Monitor API calls with browser DevTools Network tab
- Check server logs for embedding generation progress
- Use PostgreSQL logs for database query optimization

## Security Considerations

- Never commit `.env` files to version control
- Use environment-specific configuration files
- Implement rate limiting for API endpoints
- Add input validation for uploaded documents
- Use HTTPS in production environments
- Regular security audits with `npm audit`

## Support and Maintenance

### Backup Strategy
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Document uploads backup
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

### Updates and Migrations
```bash
# Update dependencies
npm update

# Run database migrations
npm run db:push

# Check for breaking changes
npm run check
```

---

## Quick Start Summary

1. **Clone project** and install dependencies (`npm install`)
2. **Set up PostgreSQL** database and get connection URL
3. **Get OpenAI API key** from platform.openai.com
4. **Create `.env` file** with required variables
5. **Initialize database** (`npm run db:push`)
6. **Start development** (`npm run dev`)
7. **Access application** at http://localhost:5000

For production deployments, use Docker or cloud platforms like Vercel/Railway with proper environment variable configuration.